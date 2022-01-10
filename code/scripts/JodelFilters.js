import {displayMain, displayMainFiltered} from "./JodelDisplay.js";

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
	Absolute_solid_density,Bulk_density,Porosity_H2O,Porosity_He,Porosity_Hg,Permeability,
	Magnetic_susceptibility,Resistivity_1hz`,
	datasets:`FILE_NAME,ARRAY,TYPE,COLOR`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	var:`FILE_NAME,VARLIST`
});

/**
 * void : create an array containing values user wants to display for a given property "propertyName"
 */
export function filteredDisplay(){

	const selected = document.querySelectorAll('#subfilter1 option:checked');
	var valueListRaw = Array.from(selected).map(el => el.label);
	valueListRaw.sort();

	const selected2 = document.querySelectorAll('#filter1 option:checked');
	const propertyName = Array.from(selected2).map(el => el.label);

	if (valueListRaw[0] == "-- display all data --") {
		displayMain();
	}
	else {
		displayMainFiltered(propertyName[0], valueListRaw);	
	}
}


//--------------------------------------------

/**
 * void : fill subfilter when filter value is changed 
 * @param {*} filter_name 
 */
 export async function fillSubFilterBox(varName) {

	if (varName != "-- display all data --") {

		db_jodel.transaction('rw', db_jodel.var, function () {

			return db_jodel.var.toArray();		
		}).then (result =>{
			const subfilter = document.getElementById("subfilter1");
			removeOptions(subfilter);
			let dict = result[0].VARLIST;
            console.log(dict);
			updateBox("subfilter1", dict[varName].sort());
		})
		.catch (function (e) {
            console.log(e);
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
 export function updateBox(box_name, list) {
	var select = document.getElementById(box_name);

	for (var i=0 ; i<list.length ; i++) {

		if (!select.contains(list[i])) {
			var option = new Option(list[i],i);
			select.options[select.options.length] = option;
		}
	}
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