import {findValue, findColumnIndice, buildMultipleSelect} from './display.js';
import {metadataNamesList} from './ressources.js';
import { Dataset } from './Dataset.js';

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	samples: `NAME,FILE_NAME,HOLEID`,
	datasets: `FILE_NAME,ARRAY,TYPE,COLOR`
});

db_jodel.open().catch(function (e) {
    console.error("Open failed: " + e.stack);
})

// add event listener on file input
var input = document.querySelector('#fileInput');
document.getElementById('addPointset').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFiles);

function parseFiles(event) {
	var id = event.target.id;

	if (id == "fileInput") {

		for (var file of input.files) {
			if (file.name.split('.').pop() =="csv") {

				Papa.parse(file, {
					download: true,
					complete: function(results) {

						db_jodel.transaction('rw', db_jodel.datasets,db_jodel.samples, function () {

							db_jodel.datasets.add({
								FILE_NAME: file.name,
								ARRAY: results.data,
								TYPE: 'Pointset',
								COLOR: rndHex()
								});

							db_jodel.datasets.where("FILE_NAME").equals(file.name)
							.each(function (dataset) {
								updateFileTable(dataset)
								buildSamplesBase(dataset);
							});
											
						}).catch (function (e) {
							console.error(e.stack);
						});
					}
				});
			}
			
		}
					
	}
}

function displayMain() {

	db_jodel.transaction('rw', db_jodel.samples, function () {

		db.samples.where('FILE_NAME').equals('QUESSANDIER_001.csv')
			.each(function (sample) {
				console.log("Found user: " + sample.NAME);
			});
	
	}).catch (function (e) {
		console.error(e.stack);
	});
					
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

			for (var colName of metadataNamesList) {
				var j = findColumnIndice(colName, dataset.ARRAY);
				sample[colName] = line[j];
			}
			db_jodel.samples.add(sample);
			console.log(sample);
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
		cell2.innerHTML =  '<input type="color" id="colorPicker" name="color_'+dataset.FILE_NAME+'" value="'+dataset.COLOR+'">'; //ADD EVENT LISTENER ON COLOR CHNAGE
		cell3.innerHTML = '<input type="checkbox" id="check" name="'+dataset.FILE_NAME+'" checked>';
		cell4.innerHTML = dataset.ARRAY.length;
		
		cell5.innerHTML = '<button class="btn-del"><i class="fa fa-trash"></i></button>';
		const oBtSup = document.getElementsByClassName('btn-del');
		for(var Btn of oBtSup){
			//Btn.addEventListener('click',  deleteLine);
			Btn.addEventListener('click',displayMain);
		}
		cell6.innerHTML = '<select name="type" id="type-select"><option value="Pointset">Pointset</option><option value="Surface">Surface</option></select>';
		document.getElementById("type-select").value = dataset.TYPE;


}


//--------------------------------------------------

/**
 * void : delete line of filetable on event --> also delete file in Study
 * @param {*} oEvent 
 */

function deleteLine(oEvent){
	let oEleBt = oEvent.currentTarget, oTr = oEleBt.parentNode.parentNode ;
		let name = oTr.cells[0].innerHTML;
	oTr.remove(); 
}
