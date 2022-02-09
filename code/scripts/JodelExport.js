import { getFileListToDisplay } from "./JodelDisplay2.js ";
import { keyVal, units } from "./ressources.js";
var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE,A41`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});



function convertToArray(arr) {
	var headers = Object.keys(arr[0]);
	
	var data =[];
	const trueHeaders = headers.map(val => keyVal[val]);
	const unitsLine = trueHeaders.map(val => units[val]);

	data.push(trueHeaders, unitsLine);

	for (let obj of arr) {
		let line =[];
		for (let key of headers) {
			line.push(obj[key]);
		}
		data.push(line);
	}
	return data;
  }

function convertToCSV(array) {
	let csvContent = "data:text/csv;charset=utf-8,"+ array.map(e => e.join(",")).join("\n");
	return csvContent;
}


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



export function exportSamples() {

    var checkList = getFileListToDisplay();
	var selected2 = document.querySelectorAll('#filter1 option:checked');
	var propertyName = Array.from(selected2).map(el => el.value);

	var selected = document.querySelectorAll('#subfilter1 option:checked');
	var valueListRaw = Array.from(selected).map(el => el.value);
	valueListRaw.sort();
	valueListRaw = valueListRaw.map(value => parseFloat(value)||value);

	// ------------------------- 3D & density view

	db_jodel.transaction('rw', db_jodel.analysis, function () {
			return db_jodel.analysis.where('FILE_NAME').anyOf(checkList).toArray();
	}).then (analysis =>{
        if (propertyName != "DEFAULT") {
			const filteredAnalysis = analysis.filter(analysisLine => valueListRaw.includes(analysisLine[propertyName]));
			const data = convertToArray(filteredAnalysis);
			const [headers, ...lines] = data;
			export_csv(headers, lines, ",", "sampleExportFiltered");

        }
        else {

			const data = convertToArray(analysis);
			const [headers, ...lines] = data;
			export_csv(headers, lines, ",", "sampleExport");

        }
	})
	.catch (function (e) {
		console.error("EXPORT MAIN",e);
	});				
}



// JSON to CSV Converter
function ConvertToCSV(objArray) {
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = '';

	for (var i = 0; i < array.length; i++) {
		var line = '';
		for (var index in array[i]) {
			if (line != '') line += ','

			line += array[i][index];
		}

		str += line + '\r\n';
	}

	return str;
}