import { projectMetadata } from "../Common/ressources.js";
import { buildMultipleSelect,initselect, fillSelect } from "./BDDSelect.js";
//---------------------------------------------
// 1. init dexie db : db_BDD with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis_files:`FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT`,
    metadata:`ID,PROJECT_METADATA,HOLES_METADATA,SAMPLES_METADATA`,
    rawMetadata_files:`FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT`
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

        console.log(metadatas);
        
        if (metadatas.length > 0) {

            if (!(jQuery.isEmptyObject(metadatas[0].HOLES_METADATA)) && !(jQuery.isEmptyObject(metadatas[0].SAMPLES_METADATA))) {

                var samples = Object.keys(metadatas.SAMPLES_METADATA) ;
                var holes = Object.keys(holes.HOLES_METADATA);

                console.log(samples, holes);
    
                buildComplexTable("MetadataTable", metadatas[0].PROJECT_METADATA);
                buildSimpleTable("SamplesTable",samples);
                buildSimpleTable("HolesTable",holes);

            }
            else {
                buildComplexTable("MetadataTable", metadatas[0].PROJECT_METADATA);
            }
        }
    })
    .catch (function (e) {
        console.error("DISPLAY METADATA ERROR : ",e);
    });	

}

  
function displayLoadedData(project) {
  
    buildComplexTable("GeneralMetadata", project.metadata);
    buildMultipleSelect(["PROJECT_COUNTRY","PROJECT_PROVINCE"],countries,2);
    initselect("PROJECT_COUNTRY", project.metadata.PROJECT_COUNTRY.value);
    initselect("PROJECT_PROVINCE", project.metadata.PROJECT_PROVINCE.value);
  
    updateSelect("SAMPLING_POINT-COORDINATE_SYSTEM",GeoCoordSys);
    initselect("SAMPLING_POINT-COORDINATE_SYSTEM", project.metadata["SAMPLING_POINT-COORDINATE_SYSTEM"].value);
    updateSelect("COORDINATE_SYSTEM_NAD",ProjCoordSys);
    initselect("COORDINATE_SYSTEM_NAD", project.metadata.COORDINATE_SYSTEM_NAD.value);
    updateSelect("LANGUAGE",Languages);
    initselect("LANGUAGE", project.metadata.LANGUAGE.value);
    
    buildSimpleTable("HolesTable",Object.keys(project.holes), displayHoleMetadata);
    var buildingList = getStorageInformation(Object.values(project.samples));
    
    buildSimpleTable("StorageBuildingsTable",buildingList,displayBuildingContent);
  
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
  
  
async function displayHoleMetadata(event) {

    var cell = $(event.target);
    var holeid = cell[0].innerHTML;
  
    var container = await db.projects.get(1);
    var project = container.object;
  
    buildComplexTable("HoleMetadataTable",project.holes[holeid].meta);
    buildSimpleTable("SamplesTable",project.holes[holeid].samples, displaySampleMetadata);
}
  

async function displaySampleMetadata(event) {

    var container = await db.projects.get(1);
    var project = container.object;

    var cell = $(event.target);
    var sample = cell[0].innerHTML;
    buildComplexTable("SampleMetadataTable",project.samples[sample].meta);
    buildMultipleSelect(["LITHOLOGY","LITHOLOGY_2","LITHOLOGY_3"],lithology,3);
    buildMultipleSelect(["TEXTURE_STRUCTURE","TEXTURE_STRUCTURE_2"],texture,2);
    buildMultipleSelect(["ORE_TYPE","ORE_TYPE_2","ORE_TYPE_3"],gitology,3);
    buildMultipleSelect(["CHRONOSTRATIGRAPHIC_AGE","CHRONOSTRATIGRAPHIC_AGE_2",
    "CHRONOSTRATIGRAPHIC_AGE_3"],chronostratigraphic,3);
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

    console.log(tableName, dict);

    clearTable(tableName);
  
    var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];

    console.log(tablebody);
    for (var key of Object.keys(dict)) {

        console.log(key);
  
        var row = tablebody.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);

        console.log('opo');
  
        cell1.innerHTML = key;
        cell2.innerHTML = dict[key].description;
  
        if (dict[key].htmlContent != 0) {
            cell3.innerHTML = dict[key].htmlContent;
        }
        else {

            console.log('test');
          const patternText1 = new String("[A-Za-z]+[-|_]+|[0-9]+");
          console.log("init",patternText1);
          console.log("pattern",dict[key].requiredPattern);
        cell3.innerHTML = '<input type="text" value="'+dict[key].value+'"placeholder="'+dict[key].placeholder+'" title="'+dict[key].description+'" class="TextInput" id="name" name="name" required minlength="1" maxlength="15" size="10" style="width: 100%" required pattern="'+dict[key].requiredPattern+'">';
        } 
    }
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