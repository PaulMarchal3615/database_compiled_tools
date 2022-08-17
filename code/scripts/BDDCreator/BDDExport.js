import {getColumn, getKeyByValue, getColumnIndice} from "../Common/common_functions.js";
import {units, keyVal, abbrev, fields, metadataFields} from "../Common/ressources.js";

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


export function exportData() {


        db_BDD.transaction('r', db_BDD.analysis_files, function() {
            return db_BDD.analysis_files.toArray();
        }).then(analysis_files => {

            var types = getTypeList(analysis_files);

            var dataExport ={};

            for (var type of types) {

                var filteredfiles = analysis_files.filter(file => file.TYPE == type);
                var array = convertToArray(filteredfiles);

                dataExport[type] = array;
            }

            mergeDataAndMetadata(dataExport);
            
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
    
    for (var file1 of metadataFiles) {
        var row1 = tablebody.insertRow(0);
        var cell1 = row1.insertCell(0);  
        cell1.innerHTML = file1.FILE_NAME;

        var cell2 = row1.insertCell(0);  
        cell2.innerHTML = file1.TYPE;
    }

    for (var file2 of analysisFiles) {
        var row2 = tablebody.insertRow(0);
        var cell3 = row2.insertCell(0);  
        cell3.innerHTML = file2.FILE_NAME;

        var cell4 = row2.insertCell(0);  
        cell4.innerHTML = file2.TYPE;
    }
}

function mergeDataAndMetadata(dataExport) {

    db_BDD.transaction('rw', db_BDD.metadata, function () {
        return db_BDD.metadata.where('ID').equals(1).toArray();
    }).then (metadata =>{
        
        generateFinalArray(dataExport, metadata[0]);

    })
    .catch (function (e) {
        console.error("LOAD METADATA TEMPLATE ERROR : ",e);
    });	

}

/**
 * convert js object to array and export it using export_csv() function 
 * @param {*} dataExport 
 * @param {*} metadata 
 */
function generateFinalArray(dataExport, metadata) {

    var heads = [...metadataFields['PROJECT_METADATA'],...metadataFields['HOLES_METADATA'],...metadataFields['SAMPLES_METADATA']];
    var unitsList = [];

    var blank1 = 0;
    var blank2 = 0;

    for (var analysis of Object.keys(dataExport)) {
        blank2 += dataExport[analysis][0].length;
        heads  = heads.concat(dataExport[analysis][0]);
    }
    
    var newArray = [];

    for (var head of heads) {

        var unitVal = units[getKeyByValue(keyVal,head)];

        if (typeof unitVal !== 'undefined') {
            unitsList.push(unitVal);
        }
        else {
            unitsList.push(units[" "]);
        }
        
    }

    newArray.push(unitsList);
    
    
    for (var analysis of Object.keys(dataExport)) {

        var table = dataExport[analysis];
        var tableLength = table[0].length;
        blank2 = blank2 - tableLength;

        var sampleColIndice = getColumnIndice('SAMPLE_NAME', table);

        for (var line of dataExport[analysis]) {

            var newLine = [];

            var sampleName = line[sampleColIndice];

            if ((sampleName != 'SAMPLE_NAME') && (sampleName != 'text')) {

                var holeName = metadata.SAMPLES_METADATA[sampleName].HOLEID.value;

                for (var head of metadataFields['PROJECT_METADATA']) {

                    var value = metadata.PROJECT_METADATA[head].value;

                    if (!value) {
                        newLine.push("");
                    }

                    else {

                        var exportValue = value.replace(',','.');
                        newLine.push(exportValue);

                    }
                }

                if (Object.keys(metadata.HOLES_METADATA).length > 0) {

                    for (var head of metadataFields['HOLES_METADATA']) {

                        var value = metadata.HOLES_METADATA[holeName][head].value;

                        if (!value) {
                            newLine.push("");
                        }

                        else {

                            var exportValue = value.replace(',','.');
                            newLine.push(exportValue);

                        }


                    }    

                }

                if (Object.keys(metadata.SAMPLES_METADATA).length > 0) {

                    for (var head of metadataFields['SAMPLES_METADATA']) {

                        var value = metadata.SAMPLES_METADATA[sampleName][head].value;

                        if (!value) {
                            newLine.push("");
                        }

                        else {

                            var exportValue = value.replace(',','.');
                            newLine.push(exportValue);

                        }
                    }
                }

                if (blank1 != 0) {
                    newLine = newLine.concat(new Array(blank1));
                }
                console.log(line);

                var lineTxt = line.join('#');
                console.log(lineTxt);
                lineTxt = lineTxt.replaceAll(',','.');

                line = lineTxt.split('#');
                console.log(line);

                newLine = newLine.concat(line);

                newLine = newLine.concat(new Array(blank2));
                newArray.push(newLine);
        }
    }
        blank1 = tableLength;  

    }

    if (newArray.length > 0) {
        export_csv(heads, newArray, ',', 'exportBDD.csv');
    }

}

/**
 * convert/export array to csv file and open it as an URL link
 * @param {*} arrayHeader : array[string] containing 
 * @param {*} arrayData array[array[string]] data line as array
 * @param {*} delimiter string delimiter ','
 * @param {*} fileName string fileName without extension
 */
 const export_csv = (arrayHeader, arrayData, delimiter, fileName) => {
	let header = arrayHeader.join(delimiter) + '\n';
	let csv = header;
	arrayData.forEach( array => {  
		csv += array.join(delimiter)+"\n";
	});

	let csvData = new Blob([csv], { type: 'text/csv' });  
	let csvUrl = URL.createObjectURL(csvData);

	let hiddenElement = document.createElement('a');
	hiddenElement.href = csvUrl;
	hiddenElement.target = '_blank';
	hiddenElement.download = fileName + '.csv';
	hiddenElement.click();
}
