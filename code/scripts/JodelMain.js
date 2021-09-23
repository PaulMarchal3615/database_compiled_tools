// function and classes import fron other files
import {Study, addDataset,fillStudyVariablesList} from './Study.js';
import {changeTrace,display,displayMap, displayStats} from './JodelDisplay.js';
import {Dataset} from './Dataset.js';
import {Sample} from './Drillhole.js'
//------------------------------------


//
// Define your database
//
var db = new Dexie("database");

db.version(1).stores({
	studys: `
	  id,
	  object`,
  });

var study = new Study();

// Now add some values.
db.studys.bulkPut([{ id: 1, object: study}]);

//---------------------------------------------

// following are defined all the events signals needed 

var X_select = document.getElementById('X_select');
X_select.addEventListener('change',changeTrace);

var Y_select = document.getElementById('Y_select');
Y_select.addEventListener('change',changeTrace);

var Z_select = document.getElementById('Z_select');
Z_select.addEventListener('change',changeTrace);

var sub = document.getElementById('subfilter1');
sub.addEventListener('change',() => {changeTrace(); displayStats(); displayMap(); });

var lat_select = document.getElementById('Lat_select');
lat_select.addEventListener('change',displayMap);

var lon_select = document.getElementById('Lon_select');
lon_select.addEventListener('change',displayMap);

var name_select = document.getElementById('Name_select');
name_select.addEventListener('change',displayMap);


var input = document.querySelector('#fileInput');
var input2 = document.querySelector('#fileInput2');

// pointset input is hidden behind a pushbutton
document.getElementById('addPointset').addEventListener('click', function() {input.click();});

// surface input is hidden behind a pushbutton
document.getElementById('addSurface').addEventListener('click', function() {input2.click();});

// files input 
input.addEventListener('input',parseData);
input2.addEventListener('input',parseData);


document.addEventListener('change',function(e){
    if(e.target.type== 'color'){
          changeTrace();
		  displayMap();
     }
 });

 document.addEventListener('change',function(e){
    if(e.target.type== 'checkbox'){
         display();
		 displayMap();
     }
 });


var ddhSelect = document.getElementById("ddh");
var objSelect = document.getElementById("objects");
var depthSelect= document.getElementById("depth");
ddhSelect.addEventListener("change", makeDrillholeDict);
objSelect.addEventListener("change", makeDrillholeDict);
depthSelect.addEventListener("change", makeDrillholeDict);


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

// 
 /**
  * Main function called when adding a file : create a new Dataset object from file input and add it to current Study
  */
async function parseData() {
	input = document.querySelector('#fileInput');
	input2 = document.querySelector('#fileInput2');

	var container = await db.studys.get(1);
	study = container.object;

	// need to see if surface or pointset added
	if (input.files.length > 0)  {
			CreateDataset("Pointset", input);
			input.value ='';
		}
	
	if (input2.files.length > 0)  {
			CreateDataset("Surface", input2);
			input2.value ='';
		}
	}
	
/**
 * returns void : create a Dataset object of selected type based on file input; only works with csv input for the moment
 * @param {*} type String : Pointset or Surface to distinguish differents input whith different display behaviour
 * @param {*} input HTML File input object
 */

function CreateDataset(type, FileInput) {

	for (let file of FileInput.files) {

		var extension = file.name.split('.').pop();

		if (extension =='csv'){
		// parse csv file to get an array containing csv data and create a Dataset object with array in it.
		Papa.parse(file, {
			download: true,
			complete: function(results) {
				//create new Dataset object 
				let dataset = new Dataset(file.name,results.data, type);
				// call BuildDict to build a dict based on array to make data manipulation easier 				
				dataset.BuildDict();
				// load study and add Dataset to study
				addDataset(study,dataset);
				// store all column headers in Study as Study.variables
				fillStudyVariablesList(study);
				// fill combobox with new headers --> for the moment old values are not deleted when deleting a dataset.
				updateComboBoxes(study.variables);
				updateFileTable(dataset);

				// saving study

				db.studys.put({id:1, object:study});

				display();	
			}
		});
	}
	// xlsx file opening is not implemented yet
	else if ((extension=='xlsx') ||(extension=='xls') (extension=='xlsm')) {
		//Upload(); not implemented yet
		alert("Not Implemented yet ! use a csv file instead.");
	}
	// if not excel file, display a alert popup
	else {
		alert("Not a table !");
	}
	}
}


/**
 * bool : returns false if tested value is in the options of a select
 * @param {*} value tested string value
 * @returns 
 */
HTMLSelectElement.prototype.contains = function( value ) {

    for ( var i = 0, l = this.options.length; i < l; i++ ) {

        if ( this.options[i].label == value ) {
            return true;
        }
    }
    return false;
}

// -------------------------------------------------
/**
 * 
 * @param {*} list : Array 
 * @param {*} value : tested value 
 * @returns Array of values containing value 
 * (exemple if tested value is 'LAT', it will only keep values containing 'LAT' ie 'LATITUDE', 'HOLEID_LATITUDE' etc)
 * It is used to make smaller lists in comboBoxes
 */
 function extractList(list, value) {
	// extract a sub list from list with only elements containing value
	var extList = [];
	for (var element of list) {
		var index = element.indexOf(value);
		if (index != -1) {
			extList.push(element);	
		}
	}
	return extList;
}

//--------------------------------------------------
/**
 * void : update all combobox when a new file with new variables in header is added to study
 * @param {*} study main Study object
 */
function updateComboBoxes(variables) {
    // update combo boxes with string stored in variables_

    updateBox('X_select',variables);
    updateBox('Y_select', variables);
    updateBox('Z_select', variables);
    updateBox('filter1', variables);

    var lat_list = extractList(variables, 'LAT').concat(extractList(variables, 'lat'));
    var lon_list = extractList(variables, 'LON').concat(extractList(variables, 'lon'));
	var hole_list = extractList(variables, 'hole').concat(extractList(variables, 'HOLE').concat(extractList(variables, 'ID')));
	var sample_list = extractList(variables, 'samp').concat(extractList(variables, 'SAMP'));
	var depth_list = extractList(variables, 'depth').concat(extractList(variables, 'DEPTH').concat(extractList(variables, 'Z')));


    updateBox('Lat_select', lat_list);
    updateBox('Lon_select', lon_list);
	updateBox('ddh', hole_list);
	updateBox('objects', sample_list);
	updateBox('depth', depth_list);
    
}

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

/**
 * build a dict based on three columns (objects/drillholes/depth or Z value) : this dict is used for 1D drillhole view 
 */
async function makeDrillholeDict() {
	
	// load study 
	var container = await db.studys.get(1);
	study = container.object;
	
	// get objects/drillholes/depth columns string content
	var ddhColumn = document.getElementById("ddh").options[document.getElementById("ddh").selectedIndex].label;
	var depthColumn = document.getElementById("depth").options[document.getElementById("depth").selectedIndex].label;
	var objColumn = document.getElementById("objects").options[document.getElementById("objects").selectedIndex].label;

	if ((ddhColumn != "--choose drillhole column--") & (depthColumn != "--choose depth column--") & (objColumn != "--choose object column--")) {

		if (Object.values(study.datasets).length > 0) {
			var tempDict = {};

			for (var dataset of Object.values(study.datasets)) {

				if (dataset.type == "Pointset") {
		
				for (var j =1; j < dataset.dict[objColumn].length; j++) {
		
					var ddh = dataset.dict[ddhColumn][j];
					var depth = parseFloat(dataset.dict[depthColumn][j]);
					var obj = dataset.dict[objColumn][j];
					var keys = Object.keys(tempDict);
	
					var sample = new Sample(obj, depth, ddh, dataset);
	
					if (keys.includes(ddh)) {
						tempDict[ddh].push(sample);
					}
					else {
						tempDict[ddh] = [sample];
					}
				}
				updateBox('Name_select', [ddhColumn]);
			}
			}
			study.drillholes = tempDict;
	}
		db.studys.put({id:1, object:study});
	}
}

//--------------------------------------------------

/**
 * void : delete line of filetable on event --> also delete file in Study
 * @param {*} oEvent 
 */
async function deleteLine(oEvent){
	let oEleBt = oEvent.currentTarget, oTr = oEleBt.parentNode.parentNode ;
		let name = oTr.cells[0].innerHTML;

		var container = await db.studys.get(1);
		study = container.object;
	
		delete study.datasets[name];
		db.studys.put({id:1, object:study});

	oTr.remove(); 

	display();
}

//--------------------------------------------------

/**
 * 
 * @returns random color value in hexadecimal
 */
function rndHex(){return'#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);}

//--------------------------------------------------

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
		cell1.innerHTML = dataset.name;
		const rndCol = rndHex();
		cell2.innerHTML =  '<input type="color" id="colorPicker" name="color_'+dataset.name+'" value="'+rndCol+'">'; 
		cell3.innerHTML = '<input type="checkbox" id="check" name="'+dataset.name+'" checked>';
		cell4.innerHTML = dataset.array.length; 
		
		cell5.innerHTML = '<button class="btn-del"><i class="fa fa-trash"></i></button>';
		const oBtSup = document.getElementsByClassName('btn-del');
		for(var Btn of oBtSup){
			Btn.addEventListener('click',  deleteLine);
			Btn.addEventListener('click',display);
		}
		cell6.innerHTML = '<select name="type" id="type-select"><option value="Pointset">Pointset</option><option value="Surface">Surface</option></select>';
		document.getElementById("type-select").value = dataset.type;


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
