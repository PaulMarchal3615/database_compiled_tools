import {fields} from "../Common/ressources.js";
import {parseFile} from "./BDDLoad.js";
import { convertDataToArray } from "./BDDConvert.js";


//---------------------------------------------
// 1. init dexie db : db_jodel with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis:`LINE`,
	files:`FILE_NAME,ARRAY`
});

db_BDD.open().catch(function (e) {
	console.error("Open failed: " + e);
})

// clear stores if reload page 

db_BDD.analysis.clear();
db_BDD.files.clear();

//---------------------------------------------


var input = document.querySelector('#BDDfileInput');
document.getElementById('BDDLoad').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFile);

document.getElementById('BDDConvert').addEventListener('click', convertDataToArray);


