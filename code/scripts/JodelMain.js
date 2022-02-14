import {fields, units} from './ressources.js';
import {displayMain} from './JodelDisplay2.js';
import {exportSamples} from './JodelExport.js';
import {removeOptions,fillSubFilterBox, updateBox} from './JodelFilters.js'
import {rowsToObjects,rndHex,getColumn} from './common_functions.js'

document.getElementById('exportSamples').addEventListener("click",exportSamples);

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE,A41`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

db_jodel.open().catch(function (e) {
	console.error("Open failed: " + e);
})

// clear stores if reload page 

db_jodel.analysis.clear();
db_jodel.holes.clear();
db_jodel.datasets.clear();

// add event listener on file input
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

//---------------------------------------------

//add event listener on filter change --> update subfilter
var filter = document.getElementById("filter1");
var subfilter = document.getElementById("subfilter1");
var selectBtn = document.getElementById("selectAll");

selectBtn.addEventListener('click', selectAll);

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

function updateAnalysisFilter() {

	removeOptions(filter);
	var analysisName = analysisSelect.options[analysisSelect.selectedIndex].value;
	console.log(analysisName);

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



function failureCallback(error) {
	console.error("Read File Error",error);
}

Papa.parsePromise = function(file) {
	return new Promise(function(complete, error) {
		Papa.parse(file, {download: true, complete, error});
	});
};

function parseSurfaceFiles(event) {

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

function parseFiles(event) {

	for (let file of input.files) {

		if (file.name.split('.').pop() =="csv") {

			console.log(file);

			Papa.parsePromise(file).then(function(results) { 

				let dataset = {FILE_NAME: file.name,ARRAY: results.data,TYPE: 'scatter3d',COLOR: rndHex()};
				const promise = readResults(dataset);
				promise.then(displayMain, failureCallback);
			});
		}
	}
}

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
	const headersKeys = headers.map(getKeyByValue);

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
 * @param {*} value string name of a property 
 * @returns key associated to value in fields (in ressources.js)
 */
function getKeyByValue(value) {

	for (var analysis of Object.keys(fields)) {
		if (Object.values(fields[analysis]).includes(value)) {
			return Object.keys(fields[analysis]).find(key => fields[analysis][key] === value);
		}
	}
  }	




//--------------------------------------------------
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

//--------------------------------------------------

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



