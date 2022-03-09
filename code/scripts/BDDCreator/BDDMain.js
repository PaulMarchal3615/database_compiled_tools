import {fields} from "../Common/ressources.js";
import {parseFile} from "./BDDLoad.js";
import { convertDataToArray } from "./BDDConvert.js";


//---------------------------------------------
// 1. init dexie db : db_BDD with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis_files:`FILE_NAME,RAW_ARRAY,TYPE,CORRECT_ARRAY`,
    metadata:`PROJECT_METADATA,HOLES_METADATA,SAMPLES_METADATA`,
});

db_BDD.open().catch(function (e) {
	console.error("Open failed: " + e);
})

// clear stores if reload page 

db_BDD.analysis_files.clear();
db_BDD.metadata.clear();

//---------------------------------------------


var input = document.querySelector('#BDDfileInput');
document.getElementById('BDDLoad').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFile);

document.getElementById('BDDConvert').addEventListener('click', convertDataToArray);


