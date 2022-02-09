import {colorbrewer} from './colorBrewer.js';
import {fields} from './ressources.js';
var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE,A41`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

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

	// ------------------------- 3D & density view

	db_jodel.transaction('rw', db_jodel.analysis, function () {
			return db_jodel.analysis.where('FILE_NAME').anyOf(checkList).toArray();
	}).then (analysis =>{
		console.log("analysis",analysis);
        if (propertyName != "DEFAULT") {
			const filteredAnalysis = analysis.filter(analysisLine => valueListRaw.includes(analysisLine[propertyName]));
            initColorScale(filteredAnalysis, propertyName, valueListRaw);
			trace = buildTrace3D(filteredAnalysis, 'scatter3d', propertyName);
			scatter3DPlot([trace]);
			buildTraceMap(filteredAnalysis);
        }
        else {
            initColorScale(analysis, 'FILE_NAME', checkList);
			trace = buildTrace3D(analysis, 'scatter3d', 0);
			scatter3DPlot([trace]);
			buildTraceMap(analysis);
        }
	})
	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});				
}

/**
 * 
 * @returns list of files which are checked to display in file_table
 */
export function getFileListToDisplay() {
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
	let multiCol = document.getElementById("multiCol").value;

	var tablebody = document.getElementById("color_table").getElementsByTagName('tbody')[0];
	var row = tablebody.insertRow(0);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	cell1.bgColor = multiCol;
	cell1.style.width = '25px';
	cell2.innerHTML = "Multiple Values"; 

	for (var i=0;i<colorList.length; i++) {
		var row = tablebody.insertRow(0);
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		cell1.bgColor = colorList[i];
		cell1.style.width = '25px';
		cell2.innerHTML = Math.round((valueList[i] + Number.EPSILON) * 100) / 100 || valueList[i];
	}		
}

/**
 * 
 * @param {*} analysisLines 
 * @param {*} propertyName 
 * @param {*} varList 
 */
function initColorScale(analysisLines, propertyName, varList) {

	let colorLow = document.getElementById("lowCol").value;
	var colorHigh = document.getElementById("highCol").value;

	if ((propertyName != "FILE_NAME") & (varList.length >0)) {

		if (isFloat(varList[0])) {

			var size = $('#num-classes').find(":selected").text();
			var limits = chroma.limits(varList, 'e', size);

			var scale = chroma.scale([colorLow,colorHigh])
			.mode('hsl').colors(size);

			const samples = analysisLines.map(({A23})=>A23).filter((v, i, a) => a.indexOf(v) === i);

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
		
		fillCaptionTable(scale, limits);
		}

		// categorical
		else {

			var size = varList.length;

			var scale = chroma.scale([colorLow,colorHigh])
			.mode('hsl').colors(size);
		
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

/*
function multiDimensionalUnique(arr) {
	var uniquesS =[];
	var uniquesCol = [];
    var itemsFound = {};
	var sampleCols={};
    for(var i = 0, l = arr[0].length; i < l; i++) {
        var stringified = JSON.stringify(arr[0][i]+arr[1][i]);
		console.log(stringified);
        if(itemsFound[stringified]) { continue; }
		uniquesS.push(arr[0][i]);
		uniquesCol.push(arr[1][i]);
        itemsFound[stringified] = true;
    }
    return [uniquesS,uniquesCol];
}
*/

function multiDimArray(arrLines, propertyName, analysisName) {
	var sampleCol={};
	for (var line of arrLines) {
		if (!Object.keys(sampleCol).includes(line.A23)){
			let sample = {NAME:line.A23,ETIQUETTE: line.A23, X:line.A31, Y:line.A32, Z:line.A33, COLOR:[line.COLOR] };
			sampleCol[line.A23] = sample ;
		}
		else if (!sampleCol[line.A23].COLOR.includes(line.COLOR)){
			sampleCol[line.A23].COLOR.push(line.COLOR);
			sampleCol[line.A23].ETIQUETTE+String('\n'+fields[analysisName][propertyName]+'\n'+line[propertyName]);
		}
	}
	return sampleCol;
}

function mapColors(obj) {

	var colorMulti = document.getElementById("multiCol").value;

	if (obj.COLOR.length >1) {
		return colorMulti;
	}
	else {
		return obj.COLOR[0];
	}
}

/**
 * 
 * @param {*} analysisLines 
 * @param {*} displayType 
 * @param {*} propertyName 
 * @returns trace,; object containing samples coordinates and tags for display function
 */
export function buildTrace3D(analysisLines, displayType, propertyName) {

	var analysisName = analysisSelect.options[analysisSelect.selectedIndex].value;

	var arr2 = Object.values(multiDimArray(analysisLines,propertyName, analysisName));
	console.log("arr2",arr2, propertyName,analysisName) ;

	let X = arr2.map(({X})=>X);
	let Y = arr2.map(({Y})=>Y);
	let Z = arr2.map(({Z})=>Z);
	let colors = arr2.map(mapColors);
	let names = arr2.map(({NAME})=>NAME);
	let text = arr2.map(({ETIQUETTE})=>ETIQUETTE);

		var trace = {
			x: X,
			y: Y,
			z: Z,
			text:text,
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

 /**
 * 
 * @param {*} lat : latitude array
 * @param {*} lon Longitude array
 * return zoom, latCenter, lonCenter
 */ 
function getBoundingBox(lat,lon) {
	var MaxLat = Math.max(...lat);
	var MaxLon = Math.max(...lon);
	var MinLat = Math.min(...lat);
	var MinLon = Math.min(...lon);

	var center = {
		'lon':(MaxLon+MinLon)/2,
		'lat':(MaxLat+MinLat)/2
	}

	var max_bound = Math.max(Math.abs(MinLon-MaxLon), Math.abs(MinLat-MaxLat)) * 111;
	var zoom = 11.5 - Math.log(max_bound);
	return [center,zoom];
}	


function buildTraceMap(analysisLines) {

	let HOLES = analysisLines.map(({A41})=>A41);
	let HOLES_LAT = analysisLines.map(({A42})=>A42);
	let HOLES_LON = analysisLines.map(({A43})=>A43);
	let colors = analysisLines.map(({COLOR})=>COLOR);

	var data = [{type: "scattermapbox",
	text:HOLES, 
    textposition:'bottom center',
	lon: HOLES_LON, 
	lat: HOLES_LAT, 
	name:HOLES, 
	mode:'markers+text', 
	marker:{size:10,color:colors }}];


	var [center, AutoZoom] = getBoundingBox(HOLES_LAT,HOLES_LON);

    var layout = {

        title: 'drillhole Map',
        font: {
            family: 'Droid Serif, serif',
            size: 6
        },
        titlefont: {
            size: 16
        },
    
        dragmode: "zoom",

        mapbox: { style: "open-street-map", center: { lat: center.lat, lon: center.lon }, zoom: AutoZoom },

        margin: { r: 0, t: 0, b: 0, l: 0 },
		autosize:true,
        annotations:{
            align:"left",
            arrowcolor:"black",
            text:"test",
            x:58.07,
            y:-104.48

        }     
	};

	var myPlot = document.getElementById('subchart31');

    Plotly.newPlot('subchart31', data, layout, {
        modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
        modeBarButtonsToAdd: [{
          name: 'toImageSVG',
          icon: Plotly.Icons.camera,
          click: function(gd) {
            Plotly.downloadImage(gd, {format: 'svg'})
          }
        }]
      });

	myPlot.on('plotly_click', function(data){

		for(var point of data.points){
				var ddh = point.text;
		}

		LinePlot(ddh);	
});	

}


/**
 * void : plot function to draw selected drillhole as a line with its samples as points
 * @param {*} ddhID String value --> drillhole id to plot
 */
 async function LinePlot(ddhID) {

	var filter1 = document.querySelectorAll('#filter1 option:checked');
	var propertyName = Array.from(filter1).map(el => el.value)[0] || "DEFAULT";

	var subfilter1 = document.querySelectorAll('#subfilter1 option:checked');
	var valueListRaw = Array.from(subfilter1).map(el => el.value);
	valueListRaw.sort();
	valueListRaw = valueListRaw.map(value => parseFloat(value)||value);


	db_jodel.transaction('rw', db_jodel.analysis, function () {
		console.log('in transaction');

		return db_jodel.analysis.where('A41').equals(ddhID).toArray();
		
	}).then (result => {

		if (propertyName != "DEFAULT") {
			initColorScale(result, propertyName, valueListRaw);
		}

		let samplesNames = result.map(({A23})=>A23);
		let samplesDepths = result.map(({A48})=>A48);
		let samplesColors = result.map(({COLOR})=>COLOR);
		let samplesHoles = result.map(({A41})=>A41);

		var trace1 = {
			x: samplesHoles,
			y: samplesDepths,
			text:samplesNames,
			mode:'lines',
			type: 'scatter',
			color: 'black'
		};

		var trace2 = {
			x: samplesHoles,
			y: samplesDepths,
			text:samplesNames,
			mode:'markers',
			type: 'scatter',
			marker:{size:12, color:samplesColors}
		};

		var layout = {
			autosize:true,
			hovermode:'closest',
			yaxis:{autorange:'reversed'}
		};
		
		var data = [trace1, trace2];
		
		Plotly.newPlot('subchart32', data, layout);
			
	})
	.catch (function (e) {
		console.error("DISPLAY SAMPLES",e);
	});

}