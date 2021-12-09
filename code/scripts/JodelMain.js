import {findValue, findColumnIndice, buildMultipleSelect} from './display.js';
import {metadataNamesList, metadataMiniFilterList} from './ressources.js';
import {displayMain, displayMainFiltered} from './JodelDisplay.js';

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	samples:`NAME,FILE_NAME,HOLEID,
	DISPLAY_TYPE,COLOR,MEASUREMENT,
	PROJECT_AREA,PROJECT_CODE,
	PROJECT_COUNTRY,PROJECT_NAME,
	PROJECT_PROVINCE,
	SAMPLE_NAME,SAMPLE_NAME_GEORESSOURCES,SAMPLE_NAME_ORANO,
	SAMPLE_DEPTH_FROM,SAMPLE_DEPTH_TO,
	SAMPLING_DATE,SAMPLE_TYPE,REFERENT_NAME,
	REFERENT_NAME2,REFERENT_NAME3,KEYWORD,
	KEYWORD2,ALTERATION_DEGREE,LITHOLOGY,
	LITHOLOGY_2,LITHOLOGY_3,ORE_TYPE,ORE_TYPE_2,
	ORE_TYPE_3,TEXTURE_STRUCTURE,TEXTURE_STRUCTURE_1,
	TEXTURE_STRUCTURE_2,HOST_AGE,MAIN_EVENT_AGE,
	Vp_short_axis,Vp_long_axis,Vs_short_axis,Vs_long_axis,
	Vp_short_axis_sature,Vp_long_axis_sature,Vs_short_axis_sature,Vs_long_axis_sature,
	Absolute_solid_density,Bulk_density,Porosity,Permeability,
	Magnetic_susceptibility,Resistivity_1hz`,
	datasets:`FILE_NAME,ARRAY,TYPE,COLOR`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	var:`FILE_NAME,VARLIST`
});

db_jodel.open().catch(function (e) {
    console.error("Open failed: " + e);
})

// clear stores if reload page 

db_jodel.samples.clear();
db_jodel.holes.clear();
db_jodel.datasets.clear();
db_jodel.var.clear();

// add event listener on file input
var input = document.querySelector('#fileInput');
document.getElementById('addPointset').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFiles);

document.getElementById("X_input").addEventListener("change",displayMain);
document.getElementById("Y_input").addEventListener("change",displayMain);
document.getElementById("Z_input").addEventListener("change",displayMain);
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

subfilter.addEventListener('change', function() {

	const selected = document.querySelectorAll('#subfilter1 option:checked');
	var valueListRaw = Array.from(selected).map(el => el.label);
	//var valueList = valueListRaw.map(num => parseFloat(num));
	valueListRaw.sort();

	const selected2 = document.querySelectorAll('#filter1 option:checked');
	const propertyName = Array.from(selected2).map(el => el.label);

	if (valueListRaw[0] == "-- display all data --") {
		displayMain();
	}
	else {
		displayMainFiltered(propertyName[0], valueListRaw);	
	}
})


//--------------------------------------------

/**
 * void : fill subfilter when filter value is changed 
 * @param {*} filter_name 
 */
 async function fillSubFilterBox(varName) {

	if (varName != "-- display all data --") {

		db_jodel.transaction('rw', db_jodel.var, function () {

			return db_jodel.var.toArray();		
		}).then (result =>{
			subfilter = document.getElementById("subfilter1");
			removeOptions(subfilter);
			let dict = result[0].VARLIST;
			updateBox("subfilter1", dict[varName].sort());
		})
		.catch (function (e) {
			alert("subfilter error",e);
		});

	}
	else {
		removeOptions(subfilter);
		updateBox("subfilter1",["-- display all data --"]);
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

							db_jodel.datasets.where("FILE_NAME").equals(file.name)
							.each(function (dataset) {
								updateFileTable(dataset);
								buildSamplesBase(dataset);
								
							}).then(function() {
								updateBox('filter1',metadataMiniFilterList);
								displayMain();
								var dict = makeDictValue(results.data);
								db_jodel.var.put({
									FILE_NAME:file.name,
									VARLIST:dict
								}).catch(function(error)
								{alert(error);})
							});	
						})		
					}
				});		
			}	
		}					
	}
}

/**
 * 
 * @param {*} array 
 * @returns dict of value for each header of input csv file 
 */
function makeDictValue(array) {
	
	var dict ={};
	for (var i = 0; i< array[0].length; i++) {
		let varList = array.map(x => x[i]);
		let firstElement = varList.splice(0, 2);
		if (array[0][i]=="MEASUREMENT-ABBREV") {
			dict["MEASUREMENT"] = varList;
		}
		else {
			dict[array[0][i]] = varList;
		}
		
	}
	return dict;
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
			
			var measurementIndice = findColumnIndice("MEASUREMENT-ABBREV", array);
			sample.MEASUREMENT = line[measurementIndice];

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



	db_jodel.holes.put(hole).catch((error => {
		console.log(error);
		alert("ERROR : createHole",error);
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

		db_jodel.transaction('rw', db_jodel.holes, function () {
	
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

		db_jodel.transaction('rw', db_jodel.samples, function () {
	
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

/**
 * void : remove selectElement from select 
 * @param {*} selectElement 
 */
 function removeOptions(selectElement) {
	var i, L = selectElement.options.length - 1;
	for(i = L; i >= 0; i--) {
	   selectElement.remove(i);
	}
}


document.getElementById('exportSamples').addEventListener("click",exportSamples);

function exportSamples() {

	console.log("in export");

	const selected = document.querySelectorAll('#subfilter1 option:checked');
	const valueList = Array.from(selected).map(el => el.label);

	const selected2 = document.querySelectorAll('#filter1 option:checked');
	const propertyName = Array.from(selected2).map(el => el.label);

	if (valueList[0] != "-- display all data --") {

		db_jodel.transaction('rw', db_jodel.samples, function () {
			console.log('in transaction');
			return db_jodel.samples.where(propertyName[0]).anyOf(valueList).toArray();		
		}).then (samples =>{

			const data = [samples.map(({NAME}) => NAME),samples.map(({HOLEID}) => HOLEID),samples.map(({Resistivity_1hz}) => Resistivity_1hz)];
			console.log(data);
			let csvContent = "data:text/csv;charset=utf-8,"
			+ data.map(e => e.join(",")).join("\n");
			
			var encodedUri = encodeURI(csvContent);
			var link = document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute("download", "my_data.csv");
			document.body.appendChild(link); 
			link.click();
		})
		.catch (function (error) {
			console.error("EXPORT ERROR",error);
		});

	}

	else {
		const data = [
			["Bonjour", "c'est", "Nicolas","Sarkozy"],
			["et", "j'ai", "le","plaisir"],
			["de", "lire", "le","Temps des Tempetes"],
			["_", "pour", "Audible","_"],
		];

		let csvContent = "data:text/csv;charset=utf-8," 
		+ data.map(e => e.join(",")).join("\n");
	
	var encodedUri = encodeURI(csvContent);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", "my_data.csv");
	document.body.appendChild(link); 
	link.click();

	}

		

			

	}
