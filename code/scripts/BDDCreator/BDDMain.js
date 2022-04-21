import {projectMetadata, metadataFields} from "../Common/ressources.js";
import {parseFile, deactivateHeads} from "./BDDOpen.js";
import { convertDataToArray} from "./BDDSave.js";
import { displayMetadata } from "./BDDQC.js";
import {showData, exportData} from "./BDDExport.js";


//---------------------------------------------
// 1. init dexie db : db_BDD with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis_files:`++ID,FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT`,
    metadata:`++ID,PROJECT_METADATA,HOLES_METADATA,SAMPLES_METADATA`,
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
var inputCollar = document.querySelector('#inputCollar');
document.getElementById('BDDOpen').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFile);

document.getElementById('BDDSave').addEventListener('click', convertDataToArray);


document.getElementById('BDDDisplay').addEventListener('click', displayMetadata);


document.getElementById('BDDIgnore').addEventListener('click', deactivateHeads);


document.getElementById('BDDExport').addEventListener('click',exportData);

document.getElementById('BDDShowData').addEventListener('click',showData);



var editor = CodeMirror(document.querySelector('#scrInput'), {
    lineNumbers: false,
    tabSize: 2,
    value: '//you can write a script here : allMetadata is an object containing all metadatas for your project;\n console.log(allMetadata);\n',
    mode: 'javascript',
    theme: 'lesser-dark'
});


document.getElementById('applyScript').addEventListener('click', executeScript);


function executeScript() {

    db_BDD.transaction('rw', db_BDD.metadata, function () {
        return db_BDD.metadata.where('ID').equals(1).toArray();
    }).then (metadata =>{

        var allMetadata = metadata[0];
    
        var textInput = editor.getValue();
        eval(textInput);

        db_BDD.metadata.update(1, allMetadata);
    
    })
    .catch (function (e) {
        console.error("LOAD METADATA TEMPLATE ERROR : ",e);
    });	


}

initSCRList();

function initSCRList() {
    let scrSelect = document.getElementById("ScrSelect");
    let samplesMeta = metadataFields.SAMPLES_METADATA;

    var i =0;

    for (var name of samplesMeta) {
        i++;

        if (!scrSelect.contains(name)) {
            var option = new Option(name,i);
            option.addEventListener('click',addOptionToScr);
            scrSelect.options[scrSelect.options.length] = option;
        }
    }

}

function addOptionToScr(event) {

    var opt = event.target;
    var text = "";
    var textInput = editor.getValue();
    var newText = "";

    if (event.target.id == "loop-scr") {

        text = 'for (var sample of Object.keys(allMetadata.SAMPLES_METADATA)) {\n \t // do something on sample object \n \t// ie you can change sample["HOLEID"] \n}';
       
        newText = textInput.concat(text+"\n");
        

    }
    else if (event.target.id == "if-scr") {

        text = 'if (sample["HOLEID"]!="SF731_05") || (sample["X_NAD"]<=500000) {\n \t //do something \n}';

        newText = textInput.concat(text+"\n");


    }

    else {

        text = opt.text;
        newText = textInput.concat('"'+text+'" ');

    }
    editor.setValue(newText);



}

document.getElementById("if-scr").addEventListener('click',addOptionToScr);
document.getElementById("loop-scr").addEventListener('click',addOptionToScr);