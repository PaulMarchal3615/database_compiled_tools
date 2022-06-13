import {projectMetadata,lithology,gitology,texture, countries, GeoCoordSys,ProjCoordSys,Languages} from "../Common/ressources.js";
import { buildMultipleSelect,initselect, fillSelect,updateSelect } from "./BDDSelect.js";
//---------------------------------------------
// 1. init dexie db : db_BDD with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis_files:`++ID,FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT`,
    metadata:`++ID,PROJECT_METADATA,HOLES_METADATA,SAMPLES_METADATA,HOLES_TRACES`,
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


export function displayMetadata() {

    db_BDD.transaction('rw', db_BDD.metadata, function () {
        return db_BDD.metadata.toArray();
    }).then (metadatas =>{
        
        if (metadatas.length > 0) {
            displayLoadedProjectData(metadatas[0].PROJECT_METADATA);
            displayLoadedHolesData(metadatas[0].HOLES_METADATA);
            displayLoadedsSamplesData(metadatas[0].SAMPLES_METADATA);
        }
    })
    .catch (function (e) {
        console.error("DISPLAY METADATA ERROR : ",e);
    });	

}

  
function displayLoadedProjectData(projectMetadata) {
  
    buildComplexTable("GeneralMetadata", projectMetadata);
    buildMultipleSelect(["PROJECT_COUNTRY","PROJECT_PROVINCE"],countries,2);

    initselect("PROJECT_COUNTRY", projectMetadata['PROJECT_COUNTRY'].value);
    initselect("PROJECT_PROVINCE", projectMetadata['PROJECT_PROVINCE'].value);
  
    updateSelect("SAMPLING_POINT-COORDINATE_SYSTEM",GeoCoordSys);
    initselect("SAMPLING_POINT-COORDINATE_SYSTEM", projectMetadata["SAMPLING_POINT-COORDINATE_SYSTEM"].value);
    updateSelect("COORDINATE_SYSTEM_NAD",ProjCoordSys);
    initselect("COORDINATE_SYSTEM_NAD", projectMetadata['COORDINATE_SYSTEM_NAD'].value);
    updateSelect("LANGUAGE",Languages);
    initselect("LANGUAGE", projectMetadata['LANGUAGE'].value);
  
}


function displayLoadedHolesData(holesMetadata) {

    var holeList = Object.keys(holesMetadata);
    buildSimpleTable("HolesTable", holeList, displayHoleMetadata);

}

function displayLoadedsSamplesData(samplesMetadata) {

    var sampleList = Object.keys(samplesMetadata);
    buildSimpleTable("SamplesTable", sampleList, displaySampleMetadata);

}


function getValues(array, metaDict, i) {

    // deep copy to avoid to change the same object
    var meta = JSON.parse(JSON.stringify(metaDict));
  
    for (var colName of Object.keys(metaDict)) {
      let val = findValue(array,colName,i);
      meta[colName].value = val;
    }
    return meta;
}
  
  
function displayHoleMetadata(event) {

    var cell = $(event.target);
    var holeid = cell[0].innerHTML;
    console.log(holeid);

    db_BDD.transaction('rw', db_BDD.metadata, function () {
        return db_BDD.metadata.toArray();
    }).then (metadatas =>{
        
        var holeMetadata = metadatas[0].HOLES_METADATA[holeid];
        console.log(holeMetadata);
        buildComplexTable("HoleMetadataTable",holeMetadata);

    })
    .catch (function (e) {
        console.error("DISPLAY HOLE METADATA ERROR : ",e);
    });	
  
  
    
}
  

function displaySampleMetadata(event) {

    var cell = $(event.target);
    var sample = cell[0].innerHTML;
    console.log(sample);

    db_BDD.transaction('rw', db_BDD.metadata, function () {
        return db_BDD.metadata.toArray();
    }).then (metadatas =>{
        
        var sampleMetadata = metadatas[0].SAMPLES_METADATA[sample];

        buildComplexTable("SampleMetadataTable",sampleMetadata);
        buildMultipleSelect(["LITHOLOGY","LITHOLOGY_2","LITHOLOGY_3"],lithology,3);
        buildMultipleSelect(["TEXTURE_STRUCTURE","TEXTURE_STRUCTURE_2"],texture,2);
        buildMultipleSelect(["ORE_TYPE","ORE_TYPE_2","ORE_TYPE_3"],gitology,3);
        
    })
    .catch (function (e) {
        console.error("DISPLAY SAMPLE METADATA ERROR : ",e);
    });	
}

function clearTable(tableName) {
    var old_tbody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
    var new_tbody = document.createElement('tbody');
    old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
}


function buildSimpleTable(tableName,array,fonct) {

    clearTable(tableName);
    var fonction = fonct || 0; // if no fonction to link
  
    var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
    for (var value of array) {
        var row = tablebody.insertRow(-1);
    var cell1 = row.insertCell(0);
        cell1.innerHTML = value;
        if (fonction != 0) {
            cell1.addEventListener("click",fonction);
        }
    }
}


function buildComplexTable(tableName, dict) {

    clearTable(tableName);
  
    var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
    for (var key of Object.keys(dict)) {
  
        var row = tablebody.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);

  
        cell1.innerHTML = key;
        cell2.innerHTML = dict[key].description;
  
        if (dict[key].htmlContent != 0) {
            cell3.innerHTML = dict[key].htmlContent;
        }
        else {
            const patternText1 = new String("[A-Za-z]+[-|_]+|[0-9]+");
            cell3.innerHTML = '<input type="text" value="'+dict[key].value+'"placeholder="'+dict[key].placeholder+'" title="'+dict[key].description+'" class="TextInput" id="name" name="name" required minlength="1" maxlength="30" size="10" style="width: 200px" required pattern="'+dict[key].requiredPattern+'">';
            cell3.addEventListener('change',saveCellContent);
        } 
    }
}

function saveCellContent(event) {
    console.log('save');

    var tablebody = event.target.parentNode.parentNode;
    var sampleName = tablebody.rows[12].cell3.innerHTML;
    console.log(tablebody, sampleName);


}


function BuildTableFromArray(tableName,array) {

    clearTable(tableName);
    var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
  
    for (var line of array) {
        var row = tablebody.insertRow(-1);
  
        for (var i = 0; i < line.length; i++) {
  
          var cell = row.insertCell(i);
          cell.innerHTML = line[i];
  
        }   
    }  
}