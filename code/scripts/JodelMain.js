import {fields} from './ressources.js';
import {displayMain, displayMainFiltered, isFloat} from './JodelDisplay.js';
import {exportSamples} from './JodelExport.js';
import {removeOptions,fillSubFilterBox, filteredDisplay, updateBox} from './JodelFilters.js'

document.getElementById('exportSamples').addEventListener("click",exportSamples);

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	samples:`NAME,FILE_NAME,COLOR,DISPLAY_TYPE,
	*A0,*A1,*A2,*A3,*A4,*A5,*A6,*A7,*A8,*A9,*A10,*A11,*A12,*A13,*A14,*A15,*A16,*A17,*A18,*A19,*A20,*A21,*A22,*A23,*A24,*A25,*A26,*A27,*A28,*A29,*A30,*A31,*A32,*A33,*A34,*A35,*A36,*A37,*A38,*A39,*A40,**A41,*A42,*A43,*A44,*A45,*A46,*A47,*A48,*A49,*A50,*A51,*A52,*A53,*A54,*A55,*A56,*A57,*A58,*A59,*A60,*A61,*A62,*A63,*A64,*A65,*A66,*A67,*A68,*A69,*A70,*A71,*A72,*A73,*A74,*A75,*A76,*A77,*A78,
	*B0,*B1,*B2,*B3,*B4,*B5,*B6,*B7,*B8,*B9,*B10,*B11,*B12,*B13,*B14,*B15,*B16,*B17,*B18,*B19,*B20,*B21,*B22,*B23,*B24,*B25,*B26,*B27,*B28,*B29,*B30,*B31,*B32,*B33,*B34,*B35,*B36,*B37,*B38,*B39,*B40,*B41,*B42,*B43,*B44,*B45,*B46,*B47,*B48,*B49,*B50,*B51,*B52,*B53,*B54,*B55,*B56,*B57,*B58,*B59,*B60,*B61,*B62,*B63,*B64,*B65,*B66,*B67,*B68,*B69,
	*C0,*C1,*C2,*C3,*C4,*C5,*C6,*C7,*C8,*C9,*C10,*C11,*C12,*C13,*C14,*C15,*C16,*C17,
	*D0,*D1,*D2,*D3,*D4,*D5,*D6,*D7,*D8,*D9,*D10,*D11,*D12,*D13,*D14,*D15,*D16,*D17,*D18,*D19,*D20,
	*E0,*E1,*E2,*E3,*E4,*E5,*E6,*E7,*E8,*E9,*E10,*E11,*E12,*E13,*E14,*E15,*E16,*E17,*E18,*E19,*E20,*E21,*E22,*E23,*E24,*E25,*E26,*E27,*E28,*E29,*E30,*E31,*E32,*E33,*E34,*E35,*E36,*E37,*E38,*E39,*E40,*E41,*E42,*E43,*E44,
	*F0,*F1,*F2,*F3,*F4,*F5,*F6,*F7,*F8,*F9,*F10,*F11,*F12,*F13,
	*G0,*G1,*G2,*G3,*G4,*G5,*G6,*G7,*G8,*G9,*G10,*G11,*G12,*G13,*G14,*G15,*G16,*G17,
	*I0,*I1,*I2,*I3,*I4,*I5,*I6,*I7,*I8,*I9,*I10,*I11,*I12,*I13,*I14,*I15,*I16,
	*J0,*J1,*J2,*J3,*J4,*J5,*J6,*J7,*J8,*J9,*J10,*J11,*J12,*J13,*J14,*J15,*J16,*J17,*J18,*J19,*J20,
	*H0,*H1,*H2,*H3,*H4,*H5,*H6,*H7,*H8,*H9,*H10,*H11,*H12,*H13,*H14,*H15,
	*K0,*K1,*K2,*K3,*K4,*K5,*K6,*K7,*K8,*K9,*K10,*K11,*K12,*K13,*K14,*K15,*K16,*K17,*K18,*K19,*K20,*K21,*K22,*K23,*K24,*K25,*K26,*K27,*K28,*K29,*K30,*K31,*K32,*K33,*K34,
	*L0,*L1,*L2,*L3,*L4,*L5,*L6,*L7,*L8,*L9,*L10,*L11,*L12,*L13,*L14,*L15,*L16,*L17,*L18,*L19,*L20,*L21,*L22,*L23,*L24,*L25,*L26,*L27,*L28,*L29,*L30,*L31,*L32,*L33,*L34,*L35,*L36,*L37,*L38,*L39,*L40,*L41,*L42,*L43,*L44,*L45,*L46,*L47`, 
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
var selectBtn = document.getElementById("selectAll");

selectBtn.addEventListener('click', selectAll);

function selectAll()
    {
    	var myOpts = document.getElementById('subfilter1').options;
    	for (var i=0; i<myOpts.length; i++)
    	{
    		myOpts[i].selected = "true";
    	}
		filteredDisplay();
}

var analysisSelect = document.getElementById("analysisSelect");
analysisSelect.addEventListener('change',updateAnalysisFilter);

function updateAnalysisFilter() {

	removeOptions(filter);
	var analysisName = analysisSelect.options[analysisSelect.selectedIndex].value;

	if (analysisName != 0) {
		updateBox("filter1",Object.keys(fields[analysisName]), Object.values(fields[analysisName]));
	}
	else {
		updateBox("filter1", ["-- display all data --"], ["-- display all data --"]);
		updateBox("subfilter1", ["-- display all data --"], ["-- display all data --"]);
	}
	
}

filter.addEventListener('change', function() {

	for (var option of filter.options) {
		if (option.selected) {
			fillSubFilterBox("subfilter1",option.value);
		}
	}
})

subfilter.addEventListener('change', filteredDisplay);

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

							//CSVarrayToJSON(results.data);

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
								buildPropertyDict(dataset);

								
							}).then(function() {
								displayMain();
							});	
						})		
					}
				});		
			}	
		}					
	}
}


function buildSamplesBase(dataset) {

	var fortime = 0;
	var newdate = new Date();
	var fordiff = newdate.getTime();
	var headers, units, lines;
	[headers, units, ...lines] = dataset.ARRAY;

	const headersKeys = headers.map(getKeyByValue); // for simple keys A0,... to avoid use of variable name with dashes
	const samplesColIndice = headers.findIndex(element =>element === "SAMPLING_POINT-NAME");
	const allSamples = lines.map(function(value,index) { return value[samplesColIndice]; });
	const uniqueSamples = allSamples.filter((v, i, a) => (a.indexOf(v) === i)).filter(n=>n); //keep unique values and only values != "" or undefined
	
	for (var sampleName of uniqueSamples) {

		var miniSample = {};
		miniSample.NAME = sampleName;
		miniSample.FILE_NAME = dataset['FILE_NAME'];
		miniSample.DISPLAY_TYPE = dataset['TYPE'];
		miniSample.COLOR = dataset['COLOR'];

		const lines = filter2DArray(dataset.ARRAY, samplesColIndice, sampleName);
		const JSON = compactLines(lines, headersKeys);
		const sample = Object.assign({},miniSample,JSON);

		createHole(sample);
		db_jodel.samples.add(sample)
		.catch((error => {
			alert("ERROR : createSample",error);
		}));

	}

	newdate = new Date();
	fortime = fortime + (newdate.getTime() - fordiff);
	console.log(fortime);
}

/**
 * 
 * @param {*} array 2D array to filter
 * @param {*} colNumber column to 
 * @param {*} VOI : value of interest
 * @returns lines where array[col] === VOI
 */
function filter2DArray(array, colNumber, VOI) {

	return array.filter(line=> line[colNumber]===VOI);

}

/**
 * 
 * @param {*} lines array of lines concerning a sample in initial array
 * @param {*} headersKeys array of heads codes (cf ressources.js --> fields)
 * @returns an Object JSON with for each property code, an associated list of all encountered values for this sample.
 */
function compactLines(lines, headersKeys) {
	var JSON ={};

	for (var i =0; i<headersKeys.length; i++) {
		JSON[headersKeys[i]] =[];
		for (var j=0; j<lines.length; j++) 
		{
			const val = parseFloat(lines[j][i]) || lines[j][i];
			if (!JSON[headersKeys[i]].includes(val) || isFloat(val)) {
				
				JSON[headersKeys[i]].push(val);
			}
		}
	}
	return JSON;
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


function buildPropertyDict(dataset) {

	var headers, units, lines;
	[headers, units, ...lines] = dataset.ARRAY;
	var allVar ={};

	const headersKeys = headers.map(getKeyByValue); // for simple keys A0,... to avoid use of variable name with dashes
	for (var i=0; i<headersKeys.length; i++){
		const values = lines.map(function(value,index) { return value[i]; });
		const uniquevalues = values.filter((v, i, a) => (a.indexOf(v) === i)).filter(n=>n); //keep unique values and only values != "" or undefined
		allVar[headersKeys[i]]=uniquevalues;
	}

	db_jodel.var.add({FILE_NAME:dataset.FILE_NAME, VARLIST:allVar})
		.catch((error => {
			alert("ERROR : createVARLIST",error);
		}));

}



/**
 * create an Hole object containing HoleID, latitude, lontitude, color, file and store it in db_jodel.holes
 * @param {*} sample Sample Object from Sample.js
 */
function createHole(sample) {

	var colorPoint = document.getElementById("colorPicker_"+sample.FILE_NAME).value;
	
	var hole = {};
	hole.HOLEID = sample.A41[0];
	hole.HOLEID_LATITUDE = sample.A42[0];
	hole.HOLEID_LONGITUDE = sample.A43[0];
	hole.COLOR = colorPoint;
	hole.FILE_NAME = sample.FILE_NAME;

	db_jodel.holes.put(hole).catch((error => {
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



