import {findValue, findColumnIndice, buildMultipleSelect} from './display.js';
import {metadataNamesList} from './ressources.js';
import {displayMain} from './JodelDisplay.js';

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	samples:`NAME,FILE_NAME,HOLEID,DISPLAY_TYPE,COLOR`,
	datasets:`FILE_NAME,ARRAY,TYPE,COLOR`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	var:`VARLIST`
});

db_jodel.open().catch(function (e) {
    console.error("Open failed: " + e.stack);
})

// clear stores if reload page 

db_jodel.samples.clear();
db_jodel.holes.clear();
db_jodel.datasets.clear();

// add event listener on file input
var input = document.querySelector('#fileInput');
document.getElementById('addPointset').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFiles);

document.getElementById("X_input").addEventListener("change",displayMain);
document.getElementById("Y_input").addEventListener("change",displayMain);
document.getElementById("Z_input").addEventListener("change",displayMain);


//---------------------------------------------

//add event listener on filter change --> update subfilter
var filter = document.getElementById("filter1");
var subfilter = document.getElementById("subfilter1");

filter.addEventListener('change', function() {

	for (var option of filter.options) {
		if (option.selected) {
			fillSubFilterBox(option.label);
		}
	}
})


//--------------------------------------------

/**
 * void : fill subfilter when filter value is changed 
 * @param {*} filter_name 
 */
 async function fillSubFilterBox(filter_name) {

	// load study 
	var container = await db.studys.get(1);
	study = container.object;
	subfilter = document.getElementById("subfilter1");
	removeOptions(subfilter);

	var all_var = [];

	for (var key in study.datasets) {
		var dataset = study.datasets[key];
		if (filter_name in dataset.dict) {
			var column = dataset.dict[filter_name];
			all_var = all_var.concat(column);
		}
		if (filter_name == "-- display all data --") {
			all_var = ["-- display all data --"];
		}	
	}
	if (all_var.length >0) {
		updateBox("subfilter1", all_var);
	}	
}

// --------------------------------------------

/**
 * void : update a combobox with an Array
 * @param {*} box_name String containing combobox name to update
 * @param {*} list Array of string value to put in the combobox
 */
 function updateBox(box_name, list) {
	var select = document.getElementById(box_name);

	for (var i=0 ; i<list.length ; i++) {

		if (!select.contains(list[i])) {
			var option = new Option(list[i],i);
			select.options[select.options.length] = option;
		}
	}
}

//--------------------------------------------------

function parseFiles(event) {
	var id = event.target.id;

	if (id == "fileInput") {

		for (var file of input.files) {
			if (file.name.split('.').pop() =="csv") {

				Papa.parse(file, {
					download: true,
					complete: function(results) {

						db_jodel.transaction('rw', db_jodel.datasets,db_jodel.holes,db_jodel.samples,db_jodel.var, function () {

							db_jodel.datasets.add({
								FILE_NAME: file.name,
								ARRAY: results.data,
								TYPE: 'scatter3d',
								COLOR: rndHex()
								});

							db_jodel.var.add({
								VARLIST:results.data[0]
							})

							//makeDictValue(results.data);

							db_jodel.datasets.where("FILE_NAME").equals(file.name)
							.each(function (dataset) {
								updateFileTable(dataset);
								buildSamplesBase(dataset);
								
							}).then(function() {
								updateBox('filter1',results.data[0]);
								displayMain();
							});	
						})		
					}
				});		
			}	
		}					
	}
}

function makeDictValue(array) {
	var dict ={};
	var header = array[0];
	for (var i = 2; i< array.length; i++) {
		var line = array [i];
		for (var j =0; j < header.length; j++) {
			if (!dict[header[j]].includes(line[j])) {
				dict[header[j]].push(line[j]);
			}
			
		}
	}
	console.log(dict);
}


function buildSamplesBase(dataset) {
	var samplesList = [];
	const array = dataset.ARRAY;

	for (var line of array) {
		var sample = {};
		var nameIndice = findColumnIndice("SAMPLING_POINT-NAME", array);
		var sampleName = line[nameIndice];


		if ((!samplesList.includes(sampleName)) & (sampleName != "SAMPLING_POINT-NAME") & (sampleName != "text")) {
			samplesList.push(sampleName);
			sample.NAME = sampleName;
			sample.FILE_NAME = dataset['FILE_NAME'];
			sample.DISPLAY_TYPE = dataset['TYPE'];
			sample.COLOR = dataset['COLOR'];

			for (var colName of metadataNamesList) {
				var j = findColumnIndice(colName, dataset.ARRAY);
				sample[colName] = line[j];
			}
			db_jodel.samples.add(sample);
			createHole(sample);		
		}
	}
}


function createHole(sample) {

	var colorPoint = document.getElementById("colorPicker_"+sample.FILE_NAME).value;
	
	var hole = {};
	hole.HOLEID = sample.HOLEID;
	hole.HOLEID_LATITUDE = parseFloat(sample.HOLEID_LATITUDE);
	hole.HOLEID_LONGITUDE = parseFloat(sample.HOLEID_LONGITUDE);
	hole.COLOR = colorPoint;
	hole.FILE_NAME = sample.FILE_NAME;
	console.log(hole);


	db_jodel.holes.put(hole).catch((error => {
		console.log("test_createHole",error);
	}));

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
			//Btn.addEventListener('click',  displayMain);
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
		console.log(name,color);

		db_jodel.transaction('rw', db_jodel.holes, function () {
			console.log('in transaction');
	
			return db_jodel.holes.where('FILE_NAME').equals(name).toArray();
			
		}).then (result => {

			for (const hole of result) {
				db_jodel.holes.update(hole.HOLEID,{COLOR:color});
			}
		})
		.catch (function (e) {
			console.error("CHANGE COLOR",e);
		});

		db_jodel.transaction('rw', db_jodel.samples, function () {
			console.log('in transaction');
	
			return db_jodel.samples.where('FILE_NAME').equals(name).toArray();
			
		}).then (result => {

			for (const sample of result) {
				db_jodel.samples.update(sample.NAME,{COLOR:color});
			}
			displayMain();
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
		console.log(name);

		db_jodel.transaction('rw', db_jodel.samples, function () {
			console.log('in transaction');
	
			return db_jodel.samples.where('FILE_NAME').equals(name).toArray();
			
		}).then (result => {

			for (const sample of result) {
				db_jodel.samples.delete(sample['NAME']);
			}
		})
		.catch (function (e) {
			console.error("DELETE SAMPLES",e);
		});

	oTr.remove(); 
}
