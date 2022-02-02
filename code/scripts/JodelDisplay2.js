import {colorbrewer} from './colorBrewer.js';
import {fields} from './ressources.js';
var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

/**
 * 
 * @returns list of files which are checked to display in file_table
 */
function getFileListToDisplay() {
    let table = document.getElementById("file_table");
	let checkList = [];

	for (var row of table.rows) {
		var fileName = row.cells[0].innerHTML;
		if (fileName != 'File') {
			if (document.getElementById('check_'+fileName).checked) {
				checkList.push(fileName);
			}
		}
	}
    return checkList;
}

export function isFloat(variable) {
    return !Number.isNaN(Number.parseFloat(variable));
}

function fillCaptionTable(colorList, valueList) {

	$("#color_table tr").remove(); 

	var tablebody = document.getElementById("color_table").getElementsByTagName('tbody')[0];
	var row = tablebody.insertRow(0);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	cell1.innerHTML = "#000000";
	cell1.bgColor = "#000000";
	cell2.innerHTML = "No Data Value"; 

	for (var i=0;i<colorList.length; i++) {

		var row = tablebody.insertRow(0);
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		cell1.innerHTML = colorList[i];
		cell1.bgColor = colorList[i];
		cell2.innerHTML = valueList[i]; 
	}		
}

/**
 * 
 * @param {*} analysisLines 
 * @param {*} propertyName 
 * @param {*} varList 
 */
function initColorScale(analysisLines, propertyName, varList) {

	var colorNumber = document.querySelector('input[name="colorPicker"]:checked').value;

	if ((propertyName != "FILE_NAME") & (varList.length >0)) {

		if (isFloat(varList[0])) {

			var size = $('#num-classes').find(":selected").text();
			var limits = chroma.limits(varList, 'e', size);

			var scale = chroma.scale([colorbrewer[colorNumber],'#DCDCDC'])
			.mode('hsl').colors(size);

			const samples = analysisLines.map(({A23})=>A23).filter((v, i, a) => a.indexOf(v) === i);

			var t0 = performance.now();

			for (var sample of samples) {
				const samplesAnalysis = analysisLines.filter(line => line.A23 == sample);
				const values = samplesAnalysis.map(a => a[propertyName]);

				var closest = limits.reduce(function(prev, curr) {
					const sum = values.reduce((a, b) => a + b, 0);
					const avg = (sum / values.length) || 0;
					return (Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev);
				  });

				  for (var obj of samplesAnalysis) {
					obj.COLOR = scale[limits.indexOf(closest)];
				}
			}

			var t1 = performance.now();
			console.log(t1 - t0," millisecondes");
		
		fillCaptionTable(scale, limits);
		}

		// categorical
		else {

			var size = varList.length;

			var scale = chroma.scale(['#fafa6e','#2A4858'])
			.mode('lch').colors(size);
		
			for (var analysis of analysisLines) {
				for (var value of varList) {
					if (analysis[propertyName] == value) {
						analysis.COLOR = scale[varList.indexOf(value)];
						break;
					}
				}
			}
			fillCaptionTable(scale, varList);
		}
	}
}

/**
 * 
 * @param {*} analysisLines 
 * @param {*} displayType 
 * @param {*} propertyName 
 * @returns trace,; object containing samples coordinates and tags for display function
 */
export function buildDisplayedPointset(analysisLines, displayType, propertyName) {

	var analysisName = analysisSelect.options[analysisSelect.selectedIndex].value;

	let X = analysisLines.map(({A31})=>A31);
	let Y = analysisLines.map(({A32})=>A32);
	let Z = analysisLines.map(({A33})=>A33);
	let colors = analysisLines.map(({COLOR})=>COLOR);

	let names =[];

	if (propertyName != 0) {
		names = [];

		for (var analysis of analysisLines) {
			var name = analysis.A23+'\n'+fields[analysisName][propertyName]+'\n'+analysis[propertyName];
			names.push(name);
		}
	}
	else {
		names = analysisLines.map(({A23})=>A23);
	}

	var trace = {
		 x: X,
		 y: Y,
		 z: Z,
		 text:names,
		mode: 'markers',
		marker: {
			size: 12,
			color:colors,
			line: {
			color:colors,
			width: 0.5},
			opacity: 0.8},
		type: displayType
	};

	return trace;
}

export function getColumn(colName,  array) {

    var indice; 

    for (var i=0;i<array[0].length;i++) {
        if (array[0][i] == colName) {
            indice =  i;
            break;
        }
    }
    return array.map(x => x[indice]);
}

export function displayMain() {

	var trace = {};
    var checkList = getFileListToDisplay();

	// --------get filter values------------------------------------

	var filter1 = document.querySelectorAll('#filter1 option:checked');
	var propertyName = Array.from(filter1).map(el => el.value)[0] || "DEFAULT";

	var subfilter1 = document.querySelectorAll('#subfilter1 option:checked');
	var valueListRaw = Array.from(subfilter1).map(el => el.value);
	valueListRaw.sort();
	valueListRaw = valueListRaw.map(value => parseFloat(value)||value);

	console.log(propertyName, valueListRaw);

	// ------------------------- 3D & density view

	db_jodel.transaction('rw', db_jodel.analysis, function () {
			return db_jodel.analysis.where('FILE_NAME').anyOf(checkList).toArray();
	}).then (analysis =>{
        if (propertyName != "DEFAULT") {
			const filteredAnalysis = analysis.filter(analysisLine => valueListRaw.includes(analysisLine[propertyName]));
            initColorScale(filteredAnalysis, propertyName, valueListRaw)
			trace = buildDisplayedPointset(filteredAnalysis, 'scatter3d', 0);
			scatter3DPlot([trace]);
        }
        else {
            initColorScale(analysis, 'FILE_NAME', checkList);
			trace = buildDisplayedPointset(analysis, 'scatter3d', 0);
			scatter3DPlot([trace]);
        }
	})
	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});				
}


/**
 * void 3d plot function 
 * @param {*} data : Array[dict] containing traces as dict
 * @param {*} x_name String
 * @param {*} y_name String 
 * @param {*} z_name String
 */
 function scatter3DPlot(data){

	var ratio = {
		x:document.getElementById("X_input").value,
		y:document.getElementById("Y_input").value,
		z:document.getElementById("Z_input").value};

	 var layout = {
		 scene:{
			 aspectmode:'manual',
			 aspectratio: ratio,
			 domain:{row:0, column:0}
		 },
		 autosize:true,
		 xaxis: {
			 backgroundcolor: "rgb(200, 200, 230)",
			 gridcolor: "rgb(255, 255, 255)",
			 showbackground: true,
			 zerolinecolor: "rgb(255, 255, 255)",
			 automargin:true,
			 title: {
			   text: "X_NAD",
			   font: {
				 family: 'Courier New, monospace',
				 size: 18,
			   }
			 }
		   },
		 yaxis: {
			 backgroundcolor: "rgb(230, 200,230)",
			 gridcolor: "rgb(255, 255, 255)",
			 showbackground: true,
			 zerolinecolor: "rgb(255, 255, 255)",
			 automargin:true,
			 title: {
			   text: "Y_NAD",
			   font: {
				 family: 'Courier New, monospace',
				 size: 18,
			   }
			 }
		   },
		   zaxis: {
			 backgroundcolor: "rgb(230, 230,200)",
			 gridcolor: "rgb(255, 255, 255)",
			 showbackground: true,
			 zerolinecolor: "rgb(255, 255, 255)",
			 automargin:true,
			 title: {
			   text: "Z_NAD",
			   font: {
				 family: 'Courier New, monospace',
				 size: 18,
			   }
			 }
		   },
		 margin: {
			 l: 0,
			 r: 0,
			 b: 0,
			 t: 0
			 }};

 
	 var config = {responsive: true};
 
	Plotly.newPlot('chart1', data, layout, config);
 }
