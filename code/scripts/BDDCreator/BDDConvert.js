import {getColumn} from "../Common/common_functions.js";


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

export function convertDataToArray() {

    var assoc = readCurrentAssociation();

    var fileName = document.getElementById("BDDtext3").innerHTML.split(" ")[3];

        db_BDD.transaction('r', db_BDD.analysis_files, function () {
            return db_BDD.analysis_files.where('FILE_NAME').equals(fileName).toArray();
    }).then (files =>{
        createCorrectedArray(assoc, files[0].ARRAY);

    })
    .catch (function (e) {
        console.error("CONVERT DATA ERROR : ",e);
    });	

}


function createCorrectedArray(assoc, rawArray){

    var correctDict = {};

    for (var key of Object.keys(assoc)) {
        console.log(key);

        var column = getColumn(key, rawArray);
        column.shift();
        correctDict[assoc[key]] = column;
    }

    console.log(correctDict);
}

function checkSamples() {
    return 0;
}


function readCurrentAssociation() {
    var assoc = {};
    var tablebody = document.getElementById("BDDQCtable").getElementsByTagName('tbody')[0];

    for (var row of tablebody.rows) {
        var select = document.getElementById("select_"+row.cells[0].innerHTML);
        var opt = select.options[select.selectedIndex].text;
        assoc[row.cells[0].innerHTML] = opt; 
    }

    return assoc;
}