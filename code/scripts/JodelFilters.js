import {displayMain, displayMainFiltered} from "./JodelDisplay.js";

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

/**
 * void : create an array containing values user wants to display for a given property "propertyName"
 */
export function filteredDisplay(){

	const selected = document.querySelectorAll('#subfilter1 option:checked');
	console.log("in-filteredDispl",selected);
	var valueListRaw = Array.from(selected).map(el => el.value);
	valueListRaw.sort();

	const selected2 = document.querySelectorAll('#filter1 option:checked');
	const propertyName = Array.from(selected2).map(el => el.value);

	console.log('valueListRaw',propertyName, valueListRaw);

	if (propertyName[0] == -1) {
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
 export async function fillSubFilterBox(subfilterName, varName) {

	const subfilter = document.getElementById(subfilterName);

	if (varName != -1) {

		db_jodel.transaction('rw', db_jodel.var, function () {

			return db_jodel.var.toArray();		
		}).then (result =>{
			console.log("result",result, varName);
			removeOptions(subfilter);
			const dict = result[0].VARLIST;
            console.log("dict",dict, varName, dict[varName].sort());
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