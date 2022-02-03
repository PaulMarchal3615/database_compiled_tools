import { getFileListToDisplay } from "./JodelDisplay2.js ";
var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

function convertToArray(arr) {
	const headers = Object.keys(arr[0]);
	console.log(headers);

	var data =[];
	data.push(headers);

	for (let obj of arr) {
		console.log(obj);
		let line =[];
		for (let key of headers) {
			console.log(key, obj[key]);
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

function WriteCSV(csvContent) {
	var encodedUri = encodeURI(csvContent);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", "EXPORTED_ANALYSIS.csv");
	document.body.appendChild(link); 
	link.click();
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

			var data = convertToArray(filteredAnalysis);
			var csv = convertToCSV(data);
			console.log(csv);
			WriteCSV(csv);

        }
        else {
			var data = convertToArray(analysis);
			var csv = convertToCSV(data);
			WriteCSV(csv);
        }
	})
	.catch (function (e) {
		console.error("EXPORT MAIN",e);
	});				
}




