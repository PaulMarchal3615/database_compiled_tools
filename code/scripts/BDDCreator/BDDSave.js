import {getColumn} from "../Common/common_functions.js";
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

//---------------------------------------------

export function convertDataToArray() {

    var assoc = readCurrentAssociation("BDDQCtable");

    var fileName = document.getElementById("BDDText3").innerHTML.split(" ")[3];

    db_BDD.transaction('r', db_BDD.analysis_files, function () {
        return db_BDD.analysis_files.where('FILE_NAME').equals(fileName).toArray();
    }).then (files =>{
        
        var newArray = createCorrectedArray(assoc, files[0].RAW_ARRAY);

        if (!jQuery.isEmptyObject(newArray)) {
            updateAnalysisTable(files[0].FILE_NAME,files[0].TYPE);
            db_BDD.analysis_files.update(fileName, {CORRECT_DICT:newArray});
        }
        
    })
    .catch (function (e) {
        console.error("CONVERT DATA ERROR : ",e);
    });	

}

function updateAnalysisTable(fileName, type) {

    var tablebody = document.getElementById("BDD_Bloc_table_Zone").getElementsByTagName('tbody')[0];

    var arr = [];
    for (var i =0; i<tablebody.rows.length; i++) {
        arr.push(tablebody.rows[i].cells[0].innerText);
    }

    if (!arr.includes(fileName)) {

        var row = tablebody.insertRow(0);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2)

        cell1.innerHTML = fileName;
        cell2.innerHTML = type;
        cell3.innerHTML = "";
    }
    else {
        alert("ERROR : FILE ALREADY REFERENCED");
    }

    
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

    if ((Object.keys(correctDict).includes("SAMPLING_POINT-NAME")) || (Object.keys(correctDict).includes("SAMPLE_NAME"))) {

        return correctDict;
    }
    else {
        alert("ABORT TRANSACTION : There are no SAMPLES referenced in your file ! ")
        return {};
    }
    
}



function readCurrentAssociation(tableName) {
    var assoc = {};
    var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];

    for (var row of tablebody.rows) {
        var select = document.getElementById("select_"+row.cells[0].innerHTML);
        var opt = select.options[select.selectedIndex].text;
        assoc[row.cells[0].innerHTML] = opt; 
    }

    return assoc;
}


//---------------------------------------------

export function saveMetadata() {

    var assoc = readCurrentAssociation("BDDQC_Meta_table");

    db_BDD.transaction('rw', db_BDD.metadata,db_BDD.rawMetadata_files, function () {
        return db_BDD.metadata.where('ID').equals(1).toArray();
    }).then (metadata =>{

        db_BDD.transaction('r', db_BDD.rawMetadata_files, function() {
            return db_BDD.rawMetadata_files.where('IS_READ').equals(false).toArray();
        }).then(rawFiles => {

            var updatedMetadata = {};

            for (var rawFile of rawFiles) {
                if (rawFile.TYPE == "PROJECT_METADATA") {
                    updatedMetadata = importProjectMetadata(rawFile, metadata[0], assoc);
                }
                else if (rawFile.TYPE == "HOLES_METADATA") {
                    updatedMetadata = importHolesMetadata(rawFile, metadata[0], assoc);
                }
                else if (rawFile.TYPE == "SAMPLES_METADATA") {
                    updatedMetadata = importSamplesMetadata(rawFile, metadata[0], assoc);
                }
                
                if (!jQuery.isEmptyObject(updatedMetadata)) {

                    db_BDD.rawMetadata_files.update(rawFile.FILE_NAME, {IS_READ:true}); 

                    // display loaded file 
                    updateMetadataTable(rawFile.FILE_NAME, rawFile.TYPE);

                    // update information in referenced metadata
                    db_BDD.metadata.update(1, updatedMetadata);
                }          
            }
        })
    })
    .catch (function (e) {
        console.error("SAVE METADATA ERROR : ",e);
    });	



    return 0;
}

function updateMetadataTable(fileName, type) {

    var tablebody = document.getElementById("BDD_Meta_Bloc_table_Zone").getElementsByTagName('tbody')[0];

    var arr = [];
    for (var i =0; i<tablebody.rows.length; i++) {
        arr.push(tablebody.rows[i].cells[0].innerText);
    }

    if (!arr.includes(fileName)) {

        var row = tablebody.insertRow(0);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2)

        cell1.innerHTML = fileName;
        cell2.innerHTML = type;
        cell3.innerHTML = "";
    }
    else {
        alert("ERROR : FILE ALREADY REFERENCED");
    }

    
}


function importProjectMetadata(rawFile, metadata, assoc) {

    if (!jQuery.isEmptyObject(assoc)) {


        for (var wrongKey of Object.keys(assoc)) {
            var values = getColumn(wrongKey,rawFile.RAW_ARRAY);

            metadata.PROJECT_METADATA[assoc[wrongKey]].value = getMostRepresentedItem(values);   
        }
        return metadata;
    }
    else{
        return {};
    }
}

function importHolesMetadata(rawFile, metadata, assoc) {

    if ((!jQuery.isEmptyObject(assoc)) && (Object.keys(assoc).includes('HOLEID'))){

        var holes = getColumn('HOLEID',rawFile.RAW_ARRAY);
        var uniqueHoles = result.filter((v, i, a) => a.indexOf(v) === i);

        for (var hole of uniqueHoles) {
            const filteredAnalysis = analysis.filter(analysisLine => valueListRaw.includes(analysisLine[propertyName])); //NOT AN OBJECT NEED TO ADAPT
        }


        for (var wrongKey of Object.keys(assoc)) {
            var values = getColumn(wrongKey,rawFile.RAW_ARRAY);

            metadata.PROJECT_METADATA[assoc[wrongKey]].value = values[2]; // à modifier mais en attendant pour tester  
        }
        return metadata;
    }
    else {
        return {};
    }
}

function importSamplesMetadata(rawFile, metadata, assoc) {

    var updatedMetadata ={};
    return updatedMetadata;

}

function getMostRepresentedItem(arr1) {

    var mf = 1;
    var m = 0;
    var item;

    for (var i=0; i<arr1.length; i++)
    {
        for (var j=i; j<arr1.length; j++){
            if (arr1[i] == arr1[j])
                m++;
                if (mf<m)
                {
                mf=m; 
                item = arr1[i];
            }
        }
        m=0;
    }

    return item;
}