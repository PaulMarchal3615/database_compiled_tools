import {fields} from "../Common/ressources.js";


var input = document.querySelector('#BDDfileInput');
document.getElementById('BDDLoad').addEventListener('click', function() {input.click();});
input.addEventListener('input',parseFile);


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

/**
 * triggered if button "Add pointset" is clicked : read fileInput and parse it into Dataset object
 */
function parseFile() {

	for (let file of input.files) {

		if (file.name.split('.').pop() =="csv") {

			Papa.parsePromise(file).then(function(results) { 
                LoadAnalysisFile(results.data);
			});
		}
	}
}

function LoadAnalysisFile(MDarray) {

    var head , lines;
    [head, ...lines] = MDarray;
    checkFileHeaders(head);
    return 0;

}


function checkFileHeaders(heads) {

    var BDDselect = document.getElementById("BDDanalysisSelect");
    let selectVal = BDDselect.options[BDDselect.selectedIndex].value;
    let references = Object.values(fields[selectVal]).concat(["HOLEID","SAMPLING_POINT-NAME"]);
    var results = compareHeads(heads, references);
    displayResults(results);
}

function compareHeads(heads, references) {

    var DistanceResults = {};

    for (var head of heads) {

        var headResult = {};

        for (var reference of references) {

            headResult[reference] = JaroWrinker(head, reference);
        }

        DistanceResults[head] = headResult;
    }

    return DistanceResults;
}




/**
 * void update file table adding newly input file in it.
 * @param {*} dataset : Dataset object to add in file table
 */
 function displayResults(results){

	var tablebody = document.getElementById("BDDQCtable").getElementsByTagName('tbody')[0];

    for (var head of Object.keys(results)) {

        var values = results[head];

        var row = tablebody.insertRow(0);
    
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
    
        cell1.innerHTML = head;
        cell2.innerHTML = '<select id ="select_'+head+'"</select>';

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
        console.log(max, maxName);

        cell3.innerHTML = max;
        const $options = Array.from(select.options);
        const optionToSelect = $options.find(item => item.text === maxName);
        optionToSelect.selected = true;
            
        select.addEventListener('change',updatePercent);



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
    return [max, maxName];

}

function updatePercent(event) {

    var select = event.currentTarget;
    var currentRow = select.parentNode.parentNode;
    console.log(currentRow);
    var percentCell = currentRow.cells[currentRow.cells.length-1];
    console.log(percentCell);
    var percent = select.options[select.selectedIndex].value;
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
