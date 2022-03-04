import {fields} from "../Common/ressources.js";
import {getColumn} from "../Common/common_functions.js";

//---------------------------------------------
// 1. init dexie db : db_jodel with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis:`LINE`,
	files:`FILE_NAME,ARRAY`
});

db_BDD.open().catch(function (e) {
	console.error("Open failed: " + e);
})

// clear stores if reload page 

db_BDD.analysis.clear();
db_BDD.files.clear();

//---------------------------------------------

/**
 * triggered if button "Add pointset" is clicked : read fileInput and parse it into Dataset object
 */
 export function parseFile() {

    var input = document.querySelector('#BDDfileInput');

	for (let file of input.files) {

		if (file.name.split('.').pop() =="csv") {

			Papa.parsePromise(file).then(function(results) { 
                LoadAnalysisFile(file.name,results.data);
			});
		}
	}
}


/**
 * print error in console
 * @param {*} error error object to display in console
 */
 function failureCallback(error) {
	console.error("Read File Error",error);
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


function LoadAnalysisFile(fileName,MDarray) {

    var head , lines;
    [head, ...lines] = MDarray;

    var BDDselect = document.getElementById("BDDanalysisSelect");
    let selectVal = BDDselect.options[BDDselect.selectedIndex].value;
    let references = Object.values(fields[selectVal]).concat(["HOLEID","SAMPLING_POINT-NAME","SAMPLE_DEPTH_FROM","SAMPLE_DEPTH_TO","X_NAD","Y_NAD","Z_NAD"]);
    var results = compareHeads(head, references);
    displayResults(results,MDarray);

    var file = {};
    file.ARRAY = MDarray;
    file.FILE_NAME =fileName;

    db_BDD.transaction('rw', db_BDD.files, () => {

        db_BDD.files.put(file);

        }).then(()=>{console.log('DONE')})
        .catch (error => {
            console.error(error);
        });	

}


function compareHeads(heads, references) {

    var DistanceResults = {};

    for (var head of heads) {

        var headResult = {};

        for (var reference of references) {

            headResult[reference] = Math.round(JaroWrinker(head, reference)*100);
        }

        DistanceResults[head] = headResult;
    }

    return DistanceResults;
}

/**
 * void update file table adding newly input file in it.
 * @param {*} dataset : Dataset object to add in file table
 */
 function displayResults(results, array){

	var tablebody = document.getElementById("BDDQCtable").getElementsByTagName('tbody')[0];

    for (var head of Object.keys(results)) {

        var values = results[head];
        values["NO MATCH"] = 0;

        var row = tablebody.insertRow(0);
    
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2)
        var cell4 = row.insertCell(3);
    
        cell1.innerHTML = head;
        var colValues = getColumn(head, array);
        colValues.shift();
        cell1.allValues = colValues;

        cell1.addEventListener('click', showValues);
        cell2.innerHTML = '<select id ="select_'+head+'"</select>';
        cell3.innerHTML = '<button id ="btnIgn_'+head+'">&#10003</button>'; 

        var btn = document.getElementById('btnIgn_'+head);
        btn.addEventListener('click',setToIgnore);

        var select = document.getElementById('select_'+head);

        //Create and append the options
        for (var val of Object.keys(values)) {
            var option = document.createElement("option");
            option.value = values[val];
            option.text = val;
            select.appendChild(option);
        }

        var max = selectMaximumValues(values)[0];
        var maxName = selectMaximumValues(values)[1] ;

        setCellColor(cell4, max);

        cell4.innerHTML = max;
        const $options = Array.from(select.options);
        const optionToSelect = $options.find(item => item.text === maxName);
        optionToSelect.selected = true;
            
        select.addEventListener('change',updatePercent);



    }
}

function showValues(event) {

    var cell = event.currentTarget;
    var colValues = cell.allValues;

    var tablebody = document.getElementById("BDDValtable").getElementsByTagName('tbody')[0];
    $("#BDDValtable tr").remove();

    for (var val of colValues) {
        var row = tablebody.insertRow(0);
        var cell1 = row.insertCell(0);  
        cell1.innerHTML = val;
    }

    var trace = {
        x: colValues,
        type: 'histogram',
    };

    var data = [trace];

    Plotly.newPlot('BDDchart1', data);

}

function setCellColor(percentCell, percent) {

    if (percent < 10) {
        percentCell.bgColor = "#ff0000";
    }
    if ((percent >= 10) && (percent < 25)) {
        percentCell.bgColor = "#f26815";
    }
    if ((percent >= 25) && (percent < 50)) {
        percentCell.bgColor = "#f2bb15";
    }
    if ((percent >= 50) && (percent <75)) {
        percentCell.bgColor = "#fffd00";
    }
    if ((percent >= 75) && (percent < 100)) {
        percentCell.bgColor = "#b3ff00";
    }
    if (percent >=100) {
        percentCell.bgColor = "#39ff00";
    }

}

function selectMaximumValues(values) {

    var max =-1;
    var maxName='';

    for (var val of Object.keys(values)) {

        if (values[val] > max) {
            max = values[val];
            maxName = val;
        }
    }

    if (max != 0) {
        return [max, maxName];
    }
    else {
        return [0, 'NO MATCH']
    }
    

}

function setToIgnore(event) {
    var btn = event.currentTarget;
    var currentRow = btn.parentNode.parentNode;
    var select = document.getElementById("select_"+currentRow.cells[0].innerHTML);
    const $options = Array.from(select.options);
    const optionToSelect = $options.find(item => item.text === "NO MATCH");
    optionToSelect.selected = true;
    var percentCell = currentRow.cells[currentRow.cells.length-1];
    var percent = select.options[select.selectedIndex].value;

    setCellColor(percentCell, percent);
    percentCell.innerHTML = percent;
}

function updatePercent(event) {

    var select = event.currentTarget;
    var currentRow = select.parentNode.parentNode;
    var percentCell = currentRow.cells[currentRow.cells.length-1];
    var percent = select.options[select.selectedIndex].value;

    setCellColor(percentCell, percent);
    percentCell.innerHTML = percent;
}

const JaroWrinker  =  (s1, s2) =>  {
    var m = 0;

    // Exit early if either are empty.
    if ( s1.length === 0 || s2.length === 0 ) {
        return 0;
    }

    // Exit early if they're an exact match.
    if ( s1 === s2 ) {
        return 1;
    }

    var range = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1,
        s1Matches = new Array(s1.length),
        s2Matches = new Array(s2.length);

    for (var i = 0; i < s1.length; i++ ) {
        var low  = (i >= range) ? i - range : 0,
            high = (i + range <= s2.length) ? (i + range) : (s2.length - 1);

        for (var j = low; j <= high; j++ ) {
        if ( s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j] ) {
            ++m;
            s1Matches[i] = s2Matches[j] = true;
            break;
        }
        }
    }

    // Exit early if no matches were found.
    if ( m === 0 ) {
        return 0;
    }

    // Count the transpositions.
    var k = 0;
    var n_trans = 0;

    for ( i = 0; i < s1.length; i++ ) {
        if ( s1Matches[i] === true ) {
        for ( j = k; j < s2.length; j++ ) {
            if ( s2Matches[j] === true ) {
            k = j + 1;
            break;
            }
        }

        if ( s1[i] !== s2[j] ) {
            ++n_trans;
        }
        }
    }

    var weight = (m / s1.length + m / s2.length + (m - (n_trans / 2)) / m) / 3,
        l      = 0,
        p      = 0.1;

    if ( weight > 0.7 ) {
        while ( s1[l] === s2[l] && l < 4 ) {
        ++l;
        }

        weight = weight + l * p * (1 - weight);
    }

    return weight;
};