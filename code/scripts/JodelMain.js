import {fields, units, keys} from './ressources.js';
import {displayMain} from './JodelDisplay2.js';
import {exportSamples} from './JodelExport.js';
import {removeOptions,fillSubFilterBox, updateBox} from './JodelFilters.js'

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


/*
$(document).on('change', 'input[type=color]', function() {
	this.parentNode.style.backgroundColor = this.value;
  });

*/

// clear stores if reload page 

db_jodel.analysis.clear();
db_jodel.holes.clear();
db_jodel.datasets.clear();

// add event listener on file input
var input = document.querySelector('#fileInput');
document.getElementById('addPointset').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFiles);

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

function parseFiles(event) {
	$.when(readFiles(event)).then(displayMain());
}

function readFiles(event) {

	var id = event.target.id;

	if (id == "fileInput") {
		console.log(input.files);

		for (let file of input.files) {
			console.log(file);
			if (file.name.split('.').pop() =="csv") {

				Papa.parse(file, {
					download: true,
					complete: function(results) {

						db_jodel.transaction('rw', db_jodel.datasets,db_jodel.analysis, () => {
							let dataset = {FILE_NAME: file.name,ARRAY: results.data,TYPE: 'scatter3d',COLOR: rndHex()};
							console.log("dataset", file.name, dataset);
							updateFileTable(dataset);
							let analysisLines = readDataset(dataset);

							db_jodel.datasets.put(dataset);
							db_jodel.analysis.bulkPut(analysisLines);
							})
							.catch (error => {
								console.error("Read File Error",error);
							});	
					}
				});		
			}	
		}			
	}	
}

function rowsToObjects(headers, rows){
	return rows.reduce((acc, e, idx) =>  {
	   acc.push(headers.reduce((r, h, i)=> {r[h] = e[i]; return r; }, {}))
	   return acc;
	}, []);
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


/**
 * 
 * @returns random color value in hexadecimal
 */
 function rndHex(){return'#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);}


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
		var cell6 = row.insertCell(5);
		cell1.innerHTML = dataset.FILE_NAME;
		cell2.innerHTML = '<input type="color" id="colorPicker_'+dataset.FILE_NAME+'" name="color_'+dataset.FILE_NAME+'" value="'+dataset.COLOR+'">'; 
		cell3.innerHTML = '<input type="checkbox" id="check_'+dataset.FILE_NAME+'" name="'+dataset.FILE_NAME+'" checked>';
		cell4.innerHTML = dataset.ARRAY.length;
		
		cell5.innerHTML = '<button class="btn-del"><i class="fa fa-trash"></i></button>';
		const oBtSup = document.getElementsByClassName('btn-del');
		for(var Btn of oBtSup){
			Btn.addEventListener('click',  deleteLine);
			Btn.addEventListener('click',  displayMain);
		}

		cell6.innerHTML = '<select name="type" id="type-select_'+dataset.FILE_NAME+'"><option value="scatter3d">Pointset</option><option value="mesh3d">Surface</option></select>';
		document.getElementById("type-select_"+dataset.FILE_NAME).value = dataset.TYPE;

		document.getElementById('colorPicker_'+dataset.FILE_NAME).addEventListener('change',updateColor);
		document.getElementById('type-select_'+dataset.FILE_NAME).addEventListener('change',displayMain);
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
				db_jodel.datasets.update(dataset.FILE_NAME,{COLOR:color});

				db_jodel.transaction('rw', db_jodel.analysis, function () {
					return db_jodel.analysis.where('FILE_NAME').equals(name).modify({COLOR:color});
				}).then(displayMain())
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



