import {getColumn} from "../Common/common_functions.js";
import { holeMetadata,sampleMetadata,projectMetadata } from "../Common/ressources.js";
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

// ANALYSIS DATA ---------------------------------------------

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


// METADATA ---------------------------------------------

export function saveMetadata() {

    var assoc = readCurrentAssociation("BDDQC_Meta_table");
    console.log(assoc);

    db_BDD.transaction('rw', db_BDD.metadata, function () {
        return db_BDD.metadata.where('ID').equals(1).toArray();
    }).then (metadata =>{

        console.log(metadata);

        db_BDD.transaction('r', db_BDD.rawMetadata_files, function() {
            return db_BDD.rawMetadata_files.where('IS_READ').equals(0).toArray();
        }).then(rawFiles => {

            console.log(rawFiles);

            var updatedMetadata = {};

            for (var rawFile of rawFiles) {
                console.log(rawFile);
                if (rawFile.TYPE == "PROJECT_METADATA") {
                    console.log('PROJECT',rawFile);
                    updatedMetadata = importProjectMetadata(rawFile, metadata[0], assoc);
                }
                else if (rawFile.TYPE == "HOLES_METADATA") {
                    updatedMetadata = importHolesMetadata(rawFile, metadata[0], assoc);
                }
                else if (rawFile.TYPE == "SAMPLES_METADATA") {
                    updatedMetadata = importSamplesMetadata(rawFile, metadata[0], assoc);
                }
                
                if (!jQuery.isEmptyObject(updatedMetadata)) {

                    db_BDD.rawMetadata_files.update(rawFile.FILE_NAME, {IS_READ:1}); 

                    // display loaded file 
                    updateMetadataTable(rawFile.FILE_NAME, rawFile.TYPE);

                    // update information in referenced metadata
                    db_BDD.metadata.update(1, updatedMetadata);
                }          
            }
        })
        .catch (function (e) {
            console.error("Load RAW FILES ERROR : ",e);
        });	
    })
    .catch (function (e) {
        console.error("LOAD METADATA TEMPLATE ERROR : ",e);
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

            if (assoc[wrongKey] != "NO MATCH") {

                var values = getColumn(wrongKey,rawFile.RAW_ARRAY);
                console.log(assoc[wrongKey]);
                metadata.PROJECT_METADATA[assoc[wrongKey]].value = getMostRepresentedItem(values);   

            }

        }
        return metadata;
    }
    else{
        return {};
    }
}

function filterByValue(array, value, colNumber) {
    return array.filter(innerArray => innerArray[colNumber] == value);
}

function importHolesMetadata(rawFile, metadata, assoc) {

    if ((!jQuery.isEmptyObject(assoc)) && (Object.keys(assoc).includes('HOLEID'))){

        var holeName = Object.keys(assoc).find(key => assoc[key] === 'HOLEID');
        var holes = getColumn(holeName,rawFile.RAW_ARRAY);
        var uniqueHoles = holes.filter((v, i, a) => a.indexOf(v) === i);
        uniqueHoles.shift(); // we assume firt element is header
        var colNumber = rawFile.RAW_ARRAY[0].indexOf(holeName);

        var headers, lines;
        [headers, ...lines] = rawFile.RAW_ARRAY;

        for (var hole of uniqueHoles) {

            var filtered = [headers].concat(filterByValue(lines, hole, colNumber));

            console.log("holeid",hole,"filtered",filtered);

            metadata.HOLES_METADATA[hole] = Object.assign({}, holeMetadata);

            for (var wrongKey of Object.keys(assoc)) {

                if (assoc[wrongKey] != "NO MATCH") {
                    var values = getColumn(wrongKey,filtered);
                    values.shift();
                    metadata.HOLES_METADATA[hole][assoc[wrongKey]].value = getMostRepresentedItem(values);
                    console.log("update",metadata.HOLES_METADATA[hole][assoc[wrongKey]].value);   
                }
            }   
        }
        console.log("metadata",metadata);
        return metadata;
    }
    else {
        return {};
    }
}

function importSamplesMetadata(rawFile, metadata, assoc) {

    if ((!jQuery.isEmptyObject(assoc)) && (Object.keys(assoc).includes('SAMPLING_POINT-NAME'))){

        var sampleName = Object.keys(assoc).find(key => object[key] === 'SAMPLING_POINT-NAME');

        var samples = getColumn(sampleName,rawFile.RAW_ARRAY);
        var uniqueSamples = samples.filter((v, i, a) => a.indexOf(v) === i);

        var colNumber = rawFile.RAW_ARRAY[0].indexOf(sampleName);

        for (var sample of uniqueSamples) {

            var filtered = rawFile.filter(i => i[colNumber].match(sample));

            for (var wrongKey of Object.keys(assoc)) { // à modifier pour ne pas ecraser les valeurs existantes
                var values = getColumn(wrongKey,filtered);
                metadata.PROJECT_METADATA[assoc[wrongKey]].value = getMostRepresentedItem(values);   
            }
        }
        return metadata;
    }
    else {
        return {};
    }

}

function getMostRepresentedItem(arr1) {

    if (arr1.length == 1) {
        return arr1[0];
    }
    if (arr1.length >1) {

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


}