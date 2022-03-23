import {fields, projectMetadata, sampleMetadata,holeMetadata} from "../Common/ressources.js";
import {parseFile} from "./BDDOpen.js";
import { convertDataToArray, saveMetadata } from "./BDDSave.js";
import { displayMetadata } from "./BDDQC.js";


//---------------------------------------------
// 1. init dexie db : db_BDD with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis_files:`FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT`,
    metadata:`ID,PROJECT_METADATA,HOLES_METADATA,SAMPLES_METADATA`,
    rawMetadata_files:`FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT,IS_READ`
});

db_BDD.open().catch(function (e) {
	console.error("Open failed: " + e);
})

// clear stores if reload page 

db_BDD.analysis_files.clear();
db_BDD.metadata.clear();
db_BDD.rawMetadata_files.clear();


db_BDD.transaction('rw', db_BDD.metadata, () => {

    db_BDD.metadata.bulkPut([{ID: 1,PROJECT_METADATA:projectMetadata, SAMPLES_METADATA:{},HOLES_METADATA:{}}]);

}).then(()=>{console.log("ok")})
    .catch (error => {
        console.error(error);
});	


//---------------------------------------------


var input = document.querySelector('#BDDfileInput');
document.getElementById('BDDOpen').addEventListener('click', function() {input.click();});
document.getElementById('BDDMetaOpen').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFile);

document.getElementById('BDDSave').addEventListener('click', convertDataToArray);
;
document.getElementById('BDDMetaSave').addEventListener('click', saveMetadata);


document.getElementById('BDDDisplay').addEventListener('click', displayMetadata);