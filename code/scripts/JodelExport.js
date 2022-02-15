import { getFileListToDisplay } from "./JodelDisplay.js ";
import { keyVal, units } from "./ressources.js";

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE,A41`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

// -------------------------------------
// Export functions : export data stored in db_jodel.analysis into csv (based on filtering if used)

/**
 * 
 * @param {*} arr 
 * @returns a 2D array from an array of object with keys as first line and units in second line
 */
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


/**
 * main function for export : get all selected files + current working filters --> get concerned analysis in dexie
 * convert to array --> convert to csv --> dwl link
 */
export function exportSamples() {

    var checkList = getFileListToDisplay().SCATTER;
	var selected2 = document.querySelectorAll('#filter1 option:checked');
	var propertyName = Array.from(selected2).map(el => el.value) ||"DEFAULT";

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
