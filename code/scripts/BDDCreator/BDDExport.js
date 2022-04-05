import {getKeyByValue} from "../Common/common_functions.js";
import {units, keyVal, abbrev} from "../Common/ressources.js";

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

//---------------------------------------------



export function exportData() {


        db_BDD.transaction('r', db_BDD.analysis_files, function() {
            return db_BDD.analysis_files.toArray();
        }).then(analysis_files => {

            var types = getTypeList(analysis_files);
            console.log(types);

            for (var type of types) {

                console.log(analysis_files.filter(file => file.TYPE == type));

                var filteredfiles = analysis_files.filter(file => file.TYPE == type);
                var array = convertToArray(filteredfiles);
                console.log(array);
            }
            
        })
        .catch (function (e) {
            console.error("Load ANALYSIS FILES ERROR : ",e);
        });	

    return 0;

}

function convertToArray(files) {

    var array =[];
    var headers, unitsLine;
    [headers, unitsLine] = getHeadersLine(files);
    array.push(headers, unitsLine);
    headers.unshift('ANALYSIS_ABBREV');
    headers.unshift('MEASUREMENT-ABBREV');
    headers.unshift('MEASUREMENT-NATURE');
    unitsLine.unshift('text');
    unitsLine.unshift('text');
    unitsLine.unshift('text');

    for (var file of files) {

        for (var i = 0; i <file.CORRECT_DICT[Object.keys(file.CORRECT_DICT)[0]].length; i++) {

            var line = [];

            for (var head of headers) {

                if ((head == 'ANALYSIS_ABBREV') || (head == 'MEASUREMENT-NATURE')) {
                    line.push(abbrev[file.TYPE]);
                }

                else if (head == 'MEASUREMENT-ABBREV') {
                    line.push(file.TYPE);
                }
                else {
                    var values = file.CORRECT_DICT[head];
                    line.push(values[i]);   
                }


            }
            array.push(line);
        }
    }
    return array;

}

function getTypeList(files) {
    var types =[];

    for (var file of files) {

        types.push(file.TYPE);

    }

    return types.filter((v, i, a) => a.indexOf(v) === i);
}

function getHeadersLine(analysis_files) {
    var headers = [];
    var unitsList = [];

    for (var file of analysis_files) {
        headers = headers.concat(Object.keys(file.CORRECT_DICT));
    }
    var unique = headers.filter((v, i, a) => a.indexOf(v) === i);

    for ( var value of unique) {
        var key = getKeyByValue(keyVal, value);
        var unit = units[key];
        unitsList.push(unit);
    }

    return [unique, unitsList];
}

function mergeAnalysis(analysis_files) {

    return Array;

}

export function showData() {

    db_BDD.transaction('r', db_BDD.rawMetadata_files, function() {
        return db_BDD.rawMetadata_files.toArray();
    }).then(rawFiles => {

        db_BDD.transaction('r', db_BDD.analysis_files, function() {
            return db_BDD.analysis_files.toArray();
        }).then(analysis_files => {

            updateExportTable(rawFiles, analysis_files);
    
        })
        .catch (function (e) {
            console.error("Load ANALYSIS FILES ERROR : ",e);
        });	


    })
    .catch (function (e) {
        console.error("Load RAW FILES ERROR : ",e);
    });	



}

function updateExportTable(metadataFiles, analysisFiles) {

    var tablebody = document.getElementById("ExportTable").getElementsByTagName('tbody')[0];
    $("#ExportTable tbody tr").remove();
    
    for (var file of metadataFiles) {
        var row = tablebody.insertRow(0);
        var cell1 = row.insertCell(0);  
        cell1.innerHTML = file.FILE_NAME;

        var cell2 = row.insertCell(0);  
        cell2.innerHTML = file.TYPE;
    }

    for (var file of analysisFiles) {
        var row = tablebody.insertRow(0);
        var cell1 = row.insertCell(0);  
        cell1.innerHTML = file.FILE_NAME;

        var cell2 = row.insertCell(0);  
        cell2.innerHTML = file.TYPE;
    }
}