import {fields} from "./ressources.js";


document.getElementById("BDDanalysisSelect").addEventListener("change",runReplacement);


function runReplacement(event) {

    var BDDselect =event.currentTarget;

    let selectVal = BDDselect.options[BDDselect.selectedIndex].value;
    let headers = Object.values(fields[selectVal]);

    $("#BDDMaintable tr").remove(); 
    // $("tbody#id tr").remove()

    var thead = document.getElementById("BDDMaintable").getElementsByTagName('thead')[0];

    var row = thead.insertRow(0);

    for (var el of headers) {
        var cell1 = row.insertCell(0);
        cell1.innerHTML = el;

    }
}

function LoadAnalysisFile() {

}

function checkFileHeaders() {

}

function displayResults() {
    
}