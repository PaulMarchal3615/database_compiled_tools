import {displayMain} from "./JodelDisplay2.js";

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

/**
 * void : create an array containing values user wants to display for a given property "propertyName"
 */
export function filteredDisplay(){

	const selected = document.querySelectorAll('#subfilter1 option:checked');
	var valueListRaw = Array.from(selected).map(el => el.value);
	valueListRaw.sort();

	const selected2 = document.querySelectorAll('#filter1 option:checked');
	const propertyName = Array.from(selected2).map(el => el.value);

	if (propertyName[0] == -1) {
		displayMain();
	}
	else {
		displayMain(propertyName[0], valueListRaw);	
	}
}


//--------------------------------------------

/**
 * void : fill subfilter when filter value is changed 
 * @param {*} filter_name 
 */
 export async function fillSubFilterBox(subfilterName, varName) {

	const subfilter = document.getElementById(subfilterName);

	if (varName != -1) {

		db_jodel.transaction('rw', db_jodel.var, function () {

			return db_jodel.var.toArray();		
		}).then (result =>{
			removeOptions(subfilter);
			const dict = result[0].VARLIST;
			updateBox(subfilterName,dict[varName].sort(), dict[varName].sort());
		})
		.catch (function (e) {
            console.log(e);
			alert("subfilter error : No Values",e);
		});

	}
	else {
		removeOptions(subfilter);
		updateBox(subfilterName,[-1],["-- display all data --"]);
		displayMain();
	}
}

// --------------------------------------------

/**
 * void : update a combobox with an Array
 * @param {*} box_name String containing combobox name to update
 * @param {*} listValues Array of code values
 * @param {*} listText Array of string value to display in the combobox
 */
 export function updateBox(box_name, listValues,listText) {
	 var select = document.getElementById(box_name);
	 for (var i=0 ; i<listText.length ; i++) {
		 if (!select.contains(listText[i])) {
			 var option = new Option(listText[i],listValues[i]);
			 select.options[select.options.length] = option;
			}
		}
	}


/**
 * void : remove selectElement from select 
 * @param {*} selectElement 
 */
 export function removeOptions(selectElement) {
	var i, L = selectElement.options.length - 1;
	for(i = L; i >= 0; i--) {
	   selectElement.remove(i);
	}
}