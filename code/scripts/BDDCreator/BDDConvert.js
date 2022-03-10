import {getColumn} from "../Common/common_functions.js";


//---------------------------------------------
// 1. init dexie db : db_BDD with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis_files:`FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT`,
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

    var fileName = document.getElementById("BDDText3").innerHTML.split(" ")[3];

        db_BDD.transaction('r', db_BDD.analysis_files, function () {
            return db_BDD.analysis_files.where('FILE_NAME').equals(fileName).toArray();
    }).then (files =>{
        
        var newArray = createCorrectedArray(assoc, files[0].RAW_ARRAY);
        updateAnalysisTable(files[0].FILE_NAME,files[0].TYPE);
        db_BDD.analysis_files.update(fileName, {CORRECT_DICT:newArray});
    })
    .catch (function (e) {
        console.error("CONVERT DATA ERROR : ",e);
    });	

}

function updateAnalysisTable(fileName, type) {

    var tablebody = document.getElementById("BDD_Bloc_table_Zone").getElementsByTagName('tbody')[0];

    var row = tablebody.insertRow(0);
    
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2)
    
    cell1.innerHTML = fileName;
    cell2.innerHTML = type;
    cell3.innerHTML = "";
}


function createCorrectedArray(assoc, rawArray){

    var correctDict = {};

    for (var key of Object.keys(assoc)) {

        if (assoc[key] != "NO MATCH" ) {
            console.log(key);
            var column = getColumn(key, rawArray);
            column.shift();
            correctDict[assoc[key]] = column;
        }

    }
    console.log(correctDict);
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