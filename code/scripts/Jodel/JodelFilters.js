import {displayMain} from "./JodelDisplay.js";

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE,A41`,
	datasets:`FILE_NAME,COLOR,TYPE`
});


//--------------------------------------------
// Filtering option to display only selected data in subfilter1

/**
 * void : fill subfilter when filter value is changed 
 * @param {*} filter_name 
 */
 export async function fillSubFilterBox(subfilterName, varName) {

	const subfilter = document.getElementById(subfilterName);

	if (varName != "DEFAULT") {

		db_jodel.transaction('r', db_jodel.analysis, function () {
			return db_jodel.analysis.toArray();		
		}).then (analysis =>{

			console.log(varName);

			console.log(analysis);
			
			let result = analysis.map(a => a[varName]);
			console.log(result);
			var unique = result.filter((v, i, a) => a.indexOf(v) === i).filter(function (el) {return el != null & el!= "";});

			console.log("unique",unique);

			removeOptions(subfilter);
			updateBox(subfilterName,unique.sort(), unique.sort());
		})
		.catch (function (e) {
			console.log("subfilter error : No Values",e);
		});

	}
	else {
		removeOptions(subfilter);
		updateBox(subfilterName,["DEFAULT"],["-- display all data --"]);
		displayMain();
	}
}

// --------------------------------------------

/**
 * 
 * @param {*} select select object we want to check options
 * @param {*} value string
 * @returns bool true if value exists ins select options
 */
function optionExists (select, value) {
	const options = Object.values(select.options).map(option => option.value)
	return options.includes(value)
}

/**
 * void : update a combobox with an Array
 * @param {*} box_name String containing combobox name to update
 * @param {*} listValues Array of code values
 * @param {*} listText Array of string value to display in the combobox
 */
 export function updateBox(box_name, listValues,listText) {
	 var select = document.getElementById(box_name);
	 for (var i=0 ; i<listText.length ; i++) {
		 if (!optionExists(select,listText[i])) {
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