import {fields, units} from './ressources.js';
import {displayMain} from './JodelDisplay.js';
import {exportSamples} from './JodelExport.js';
import {removeOptions,fillSubFilterBox, updateBox} from './JodelFilters.js'
import {rowsToObjects,rndHex,getColumn,getAllIndexes,getKeyByValue} from './common_functions.js'

//---------------------------------------------
// 1. init dexie db : db_jodel with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE,A41`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

db_jodel.open().catch(function (e) {
	console.error("Open failed: " + e);
})

// clear stores if reload page 

db_jodel.analysis.clear();
db_jodel.datasets.clear();

//---------------------------------------------
// 2. init events to trigger 

document.getElementById('exportSamples').addEventListener("click",exportSamples);

var input = document.querySelector('#fileInput');
document.getElementById('addPointset').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFiles);

var input2 = document.querySelector('#fileInput2');
document.getElementById('addSurface').addEventListener('click', function() {input2.click();});
input2.addEventListener('input',parseSurfaceFiles);

document.getElementById("X_input").addEventListener("change",displayMain);
document.getElementById("Y_input").addEventListener("change",displayMain);
document.getElementById("Z_input").addEventListener("change",displayMain);

document.getElementById("lowCol").addEventListener("change",displayMain);
document.getElementById("highCol").addEventListener("change",displayMain);
document.getElementById("multiCol").addEventListener("change",displayMain);

var filter = document.getElementById("filter1");
var subfilter = document.getElementById("subfilter1");
var selectBtn = document.getElementById("selectAll");

selectBtn.addEventListener('click', selectAll);

/**
 * select all options avalaible in subfilter1
 */
function selectAll()
    {
    	var myOpts = document.getElementById('subfilter1').options;
    	for (var i=0; i<myOpts.length; i++)
    	{
    		myOpts[i].selected = "true";
    	}
		displayMain();
}

var analysisSelect = document.getElementById("analysisSelect");
analysisSelect.addEventListener('change',updateAnalysisFilter);

/**
 * update analysisfilters (filter1, subfilter1) when changing "analysisSelect" select 
 */
function updateAnalysisFilter() {

	removeOptions(filter);
	var analysisName = analysisSelect.options[analysisSelect.selectedIndex].value;

	if (analysisName != "DEFAULT") {
		updateBox("filter1",Object.keys(fields[analysisName]), Object.values(fields[analysisName]));
	}
	else {
		removeOptions(subfilter);
		updateBox("filter1", ["DEFAULT"], ["-- display all data --"]);
		updateBox("subfilter1", ["DEFAULT"], ["-- display all data --"]);
		var myOpts = document.getElementById('subfilter1').options;
		myOpts[0].selected = "true";
		displayMain();

	}
	
}

filter.addEventListener('change', function() {

	for (var option of filter.options) {
		if (option.selected){
			fillSubFilterBox("subfilter1",option.value);
			var text = document.getElementById("miniInfoDisp");
			text.innerHTML = option.text+' in Unit : '+units[option.text];
		}
	}
})

subfilter.addEventListener('change', displayMain);


//--------------------------------------------------
// 2. Parse funtions : file input reading function based on Papa-parse for reading and converting csv files as array

/**
 * print error in console
 * @param {*} error error object to display in console
 */
function failureCallback(error) {
	console.error("Read File Error",error);
}

/**
 * 
 * @param {*} file single fileInput from html input 
 * @returns Promise based on success of Papa.parse
 */
Papa.parsePromise = function(file) {
	return new Promise(function(complete, error) {
		Papa.parse(file, {download: true, complete, error});
	});
};

/**
 * triggered if button "Add surface" is clicked : read fileInput2 and parse it into Dataset object
 */
function parseSurfaceFiles() {

	for (let file of input2.files) {

		if (file.name.split('.').pop() =="csv") {

			Papa.parsePromise(file).then(function(results) {

				let X = getColumn('X_NAD',results.data);
				X.shift();
				let Y = getColumn('Y_NAD',results.data);
				Y.shift();
				let Z = getColumn('Z_NAD',results.data);
				Z.shift();

				let dataset = {FILE_NAME:file.name,X_NAD:X,Y_NAD:Y,Z_NAD:Z,TYPE: 'surface',COLOR: rndHex()};
				const promise = readSurfaceResults(dataset);
				promise.then(displayMain, failureCallback);
			});
		}
	}

}

/**
 * triggered if button "Add pointset" is clicked : read fileInput and parse it into Dataset object
 */
function parseFiles() {

	for (let file of input.files) {

		if (file.name.split('.').pop() =="csv") {

			Papa.parsePromise(file).then(function(results) { 

				let dataset = {FILE_NAME: file.name,ARRAY: results.data,TYPE: 'scatter3d',COLOR: rndHex()};
				const promise = readResults(dataset);
				promise.then(displayMain, failureCallback);
			});
		}
	}
}

/**
 * 
 * @param {*} dataset : dataset object (based on file input)
 * @returns Promise based on dexie transaction fail or success; save dataset data into dexie db
 */
function readResults(dataset) {

	return new Promise((successCallback, failureCallback) => {

		db_jodel.transaction('rw', db_jodel.datasets,db_jodel.analysis, () => {
			updateFileTable(dataset);
			let analysisLines = readDataset(dataset);

			db_jodel.datasets.put(dataset);
			db_jodel.analysis.bulkPut(analysisLines);

			}).then(()=>{successCallback();})
			.catch (error => {
				failureCallback(error);
			});	

	});
}

/**
 * 
 * @param {*} dataset : dataset object (based on file input)
 * @returns Promise based on dexie transaction fail or success; save surface data into dexie db
 */
function readSurfaceResults(dataset) {

	
	return new Promise((successCallback, failureCallback) => {

		db_jodel.transaction('rw', db_jodel.datasets, () => {
			updateFileTable(dataset);
			db_jodel.datasets.put(dataset);

			}).then(()=>{successCallback();})
			.catch (error => {
				failureCallback(error);
			});	

	});
}

/**
 * 
 * @param {*} dataset 
 * @returns [AnalysisLines] with analysisLine = {A0:val, ...} to be stored in db
 */
function readDataset(dataset) {
	
	var headers, units, values;
	[headers, units, ...values] = dataset.ARRAY;

	var indexes = getAllIndexes(headers,'ANALYSIS_ABBREV');
	indexes.unshift(0);
	indexes.push(headers.length);

	var headerSlice = {};

	var measure = getColumn('MEASUREMENT-NATURE',dataset.ARRAY).filter((v,i,a)=> a.indexOf(v)===i).filter(function(f) { return f !== 'MEASUREMENT-NATURE' & f !== 'text' &f !== undefined});
	measure.unshift('METADATA');

	for (var j =0; j<(indexes.length)-1; j++) {

		var analysisName = measure[j];
		var subHead = headers.slice(indexes[j], indexes[j+1]);
		headerSlice[analysisName] = subHead;
	}

	var headersKeys = mapHeaders(headerSlice);
	
	var result = rowsToObjects(headersKeys, values);
	var i =2;

	// convert string 'float' to float values

	result = result.map(entry => 
		Object.entries(entry).reduce(
			(obj, [key, value]) => (obj[key] = parseFloat(value)||value, obj), 
			{}
		)
	  );

	// add dexie main properties

	for (var obj of result) {
		obj.LINE = i;
		obj.COLOR = dataset.COLOR;
		obj.FILE_NAME= dataset.FILE_NAME;
		obj.TYPE= dataset.TYPE;
		i+=1;
	}
	return result;
}


/**
 * 
 * @param {*} headDict : dict of Analysis_type:[Headers]
 * @returns array[string] containing standardized headers
 */
function mapHeaders(headDict) {
	var standardsHeads =[];

	for (var key of Object.keys(headDict)) {

		for (var value of headDict[key]) {

			if (Object.keys(fields).includes(key)) {
				var champ = getKeyByValue(fields[key],value);
			standardsHeads.push(champ);
			}
		}
	}	
	return standardsHeads;
}


//--------------------------------------------------
// 2. Update functions 

/**
 * void update file table adding newly input file in it.
 * @param {*} dataset : Dataset object to add in file table
 */
 function updateFileTable(dataset){

	var tablebody = document.getElementById("file_table").getElementsByTagName('tbody')[0];
		var row = tablebody.insertRow(0);
		
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		var cell3 = row.insertCell(2);
		var cell4 = row.insertCell(3);
		var cell5 = row.insertCell(4);

		cell1.innerHTML = dataset.FILE_NAME;
		
		cell2.innerHTML = '<input type="color" id="colorPicker_'+dataset.FILE_NAME+'" name="color_'+dataset.FILE_NAME+'" value="'+dataset.COLOR+'">'; 
		
		cell3.innerHTML = '<input type="checkbox" id="check_'+dataset.FILE_NAME+'" name="'+dataset.FILE_NAME+'" checked>';
		
		cell4.innerHTML = '<button id ="btn_del_'+dataset.FILE_NAME+'"class="btn-del"><i class="fa fa-trash"></i></button>';

		cell5.innerHTML = dataset.TYPE;

		var oBtSup = document.getElementById('btn_del_'+dataset.FILE_NAME);
		oBtSup.addEventListener('click',  deleteLine);
		oBtSup.addEventListener('click',  displayMain);
	
		

		document.getElementById('colorPicker_'+dataset.FILE_NAME).addEventListener('change',updateColor);
		document.getElementById('check_'+dataset.FILE_NAME).addEventListener('change',displayMain);
}

/**
 * change color of dataset in dexie db when color is changed in colorPickers (in file_table)
 * @param {*} event trigger event 
 */
function updateColor(event) {

	let oEleBt = event.currentTarget, oTr = oEleBt.parentNode.parentNode ;
	
	let name = oTr.cells[0].innerHTML;
	
	let color = document.getElementById("colorPicker_"+name).value;

	db_jodel.transaction('rw', db_jodel.datasets, function () {
			return db_jodel.datasets.where('FILE_NAME').equals(name).toArray();
			
		}).then (result => {

			for (const dataset of result) {
				db_jodel.datasets.update(dataset.FILE_NAME,{COLOR:color}).then(displayMain());

				if (dataset.type =='scatter3d') {

					db_jodel.transaction('rw', db_jodel.analysis, function () {
						return db_jodel.analysis.where('FILE_NAME').equals(name).modify({COLOR:color});
					}).then(displayMain())
				}
			}
		})
		.catch (function (e) {
			console.error("CHANGE COLOR",e);
		});

}

/**
 * void : delete line of filetable on event --> also delete file in Study
 * @param {*} oEvent 
 */

function deleteLine(oEvent){
	let oEleBt = oEvent.currentTarget, oTr = oEleBt.parentNode.parentNode ;
		let name = oTr.cells[0].innerHTML;

		db_jodel.transaction('rw', db_jodel.analysis, function () {
			return db_jodel.analysis.where('FILE_NAME').equals(name).each(analysis => db_jodel.analysis.delete())
		})
		.then (console.log("deleted"))
		.catch (function (e) {
			console.error("DELETE SAMPLES",e);
		});

	oTr.remove(); 
}



