import { holeMetadata } from "../Common/ressources.js";

export function askForSurveyAndCollar() {

    alert("ADD CSV FILE CONTAINING COLLAR DATA");


    var inputC = document.querySelector("#inputCollar");
    var inputS = document.querySelector("#inputSurvey");

    inputC.click();

    inputC.addEventListener('input',function() {
        alert("ADD CSV FILE CONTAINING SURVEY DATA");
        inputS.click();
    });

    inputS.addEventListener('input',parseCollarSurvey);

}


/**
 * 
 * @param {*} file single fileInput from html input 
 * @returns Promise based on success of Papa.parse
 */
    Papa.parsePromise = function(file) {
    return new Promise(function(complete, error) {
        Papa.parse(file, {download: true, complete, error});
    });
};

function parseTraceFile(input) {

    if (input.name.split('.').pop() =="csv") {

        Papa.parsePromise(input).then(function(results) {

            return results.data;
            
        });
    }
}


function parseCollarSurvey() {

    db_BDD.transaction('rw', db_BDD.metadata, function () {
        return db_BDD.metadata.toArray();
    }).then (metadatas =>{
        
        if (metadatas.length > 0) {

            var holesMetadata  = metadatas[0].HOLES_METADATA;

            var colArray = parseTraceFile(inputC.files[0]);
            readCollar(colArray, holesMetadata);
            var survArray = parseTraceFile(inputS.files[0]);

        }
    })
    .catch (function (e) {
        console.error("PARSE COLLAR SURVEY ERROR : ",e);
    });	

}


function readCollar(collarArr, holesMetadata) {

    var holes = Object.keys(holesMetadata);

    var dictIndex ={};
    var i = 0;
    for (var head of collarArr[0]) {
        dictIndex[head] = i;
        i+=1;
    }

    for (var line of collarArr) {

        if (!holes.includes(line[dictIndex["HOLEID"]])) {

            var holesInfo = jQuery.extend(true, {}, holeMetadata);
            holesInfo.HOLEID = line[dictIndex["HOLEID"]];
            holesInfo.X_NAD = line[dictIndex["X"]];
            holesInfo.Y_NAD = line[dictIndex["Y"]];
            holesInfo.Z_NAD = line[dictIndex["Z"]];   

            holesMetadata[holesInfo.HOLEID] = holesInfo;
        }

    }
    return holesMetadata;
}


function readSurvey(surveyArr, holesMetadata) {

    Array.from(surveyArr, )

}
