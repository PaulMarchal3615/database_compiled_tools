import {colorbrewer} from './colorBrewer.js';
import { fields } from './ressources.js';
var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

export function displayMain() {

	let table = document.getElementById("file_table");
	let checkList = [];
	var trace = {};
	var traceDensity = {};

	for (var row of table.rows) {
		var fileName = row.cells[0].innerHTML;
		if (fileName != 'File') {
			if (document.getElementById('check_'+fileName).checked) {
				checkList.push(fileName);
			}
		}
	}

	// ------------------------- 3D & density view

	db_jodel.transaction('rw', db_jodel.samples, function () {
		console.log('in transaction');

		return db_jodel.samples.where('FILE_NAME').anyOf(checkList).toArray();		
	}).then (samples =>{

		initColorScale(samples, 'FILE_NAME', checkList);

		trace = buildDisplayedPointset(samples, 'scatter3d', 0);
		scatter3DPlot([trace]);
		traceDensity = makeTracesForDensity(samples);
		DensityGraph(traceDensity);

	})
	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});

	//------------------------- drillholes display



	db_jodel.transaction('rw', db_jodel.holes, function () {
		console.log('in transaction');

		return db_jodel.holes.toArray();		
	}).then (drillholes =>{

		drawMap(drillholes);
	})

	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});
					
}

export function displayMainFiltered(propertyName,varList) {

	if (isFloat(varList[0])) {
		varList = varList.map(parseFloat);
	}

	let table = document.getElementById("file_table");
	let checkList = [];
	var trace = {};
	var traceDensity = {};

	for (var row of table.rows) {
		var fileName = row.cells[0].innerHTML;
		if (fileName != 'File') {
			if (document.getElementById('check_'+fileName).checked) {
				checkList.push(fileName);
			}
		}
	}

	// ------------------------- 3D & density view

	db_jodel.transaction('rw', db_jodel.samples, function () {
		console.log('in transaction');

		return db_jodel.samples.where(propertyName).anyOf(varList).toArray();		
	}).then (samples =>{

		initColorScale(samples, propertyName, varList);
		trace = buildDisplayedPointset(samples, 'scatter3d', propertyName);
		scatter3DPlot([trace]);
		traceDensity = makeTracesForDensity(samples, propertyName);
		DensityGraph(traceDensity);
		let ddhList = samples.map(a => a.A41[0]);
		console.log(ddhList);

		//------------------------- drillholes display


		db_jodel.transaction('rw', db_jodel.holes.where('HOLEID').anyOf(ddhList), function () {
			console.log('in transaction');

			return db_jodel.holes.toArray();		
		}).then (drillholes =>{
			drawMap(drillholes);
			console.log(drillholes);
		})
		.catch (function (e) {
			alert("DISPLAY MAIN FILTERED1",e);
		});

		})
		.catch (function (e) {
			console.error("DISPLAY MAIN FILTERED2",e);
		});

					
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

function initColorScale(sampleList, propertyName, varList) {

	var colorNumber = document.querySelector('input[name="colorPicker"]:checked').value;

	if (propertyName != "FILE_NAME") {

		var testValue = 0;

		if (varList[0] == "") {
			testValue = 1;
		}

		if (isFloat(varList[testValue])) {

			var size = $('#num-classes').find(":selected").text();

			varList = varList.map(value=>parseFloat(value));

			var limits = chroma.limits(varList, 'e', size);

			var scale = chroma.scale([colorbrewer[colorNumber],'#DCDCDC'])
			.mode('hsl').colors(size);
		
			for (var sample of sampleList) {
				if (sample[propertyName] == NaN || sample[propertyName] =="") {
					sample.COLOR = "#000000";
				}
				else {
					var closest = limits.reduce(function(prev, curr) {
						const sum = sample[propertyName].reduce((a, b) => a + b, 0);
						const avg = (sum / sample[propertyName].length) || 0;
						return (Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev);
					  });
					sample.COLOR = scale[limits.indexOf(closest)];
				}	
			}
		
		fillCaptionTable(scale, limits);
		}

		// categorical
		else {

			var size = varList.length;

			var scale = chroma.scale(['#fafa6e','#2A4858'])
			.mode('lch').colors(size);
		
			for (var sample of sampleList) {
				for (var value of varList) {
					if (sample[propertyName] == value) {
						sample.COLOR = scale[varList.indexOf(value)];
						break;
					}
				}
			}
			fillCaptionTable(scale, varList);
		}
	}
}

export function buildDisplayedPointset(sampleList, displayType, propertyName) {

	var analysisName = analysisSelect.options[analysisSelect.selectedIndex].value;

	let X = sampleList.map(({A31})=>A31[0]);
	let Y = sampleList.map(({A32})=>A32[0]);
	let Z = sampleList.map(({A33})=>A33[0]);
	let colors = sampleList.map(({COLOR})=>COLOR);

	let names =[];

	if (propertyName != 0) {
		names = [];

		for (var sample of sampleList) {
			var name = sample.A23[0]+'\n'+fields[analysisName][propertyName]+'\n'+sample[propertyName];
			names.push(name);
		}
	}
	else {
		names = sampleList.map(({A23})=>A23[0]);
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

function drawMap(holes) {

	let holeids = holes.map(({HOLEID})=>HOLEID);
	let holes_lat = holes.map(({HOLEID_LATITUDE})=>HOLEID_LATITUDE);
	let holes_lon = holes.map(({HOLEID_LONGITUDE})=>HOLEID_LONGITUDE);
	let colors = holes.map(({COLOR})=>COLOR);


    var data = [{type: "scattermapbox",
	text:holeids, 
    textposition:'bottom center',
	lon: holes_lon, 
	lat: holes_lat, 
	name:holeids, 
	mode:'markers+text', 
	marker:{size:10,color:colors }}];

	var [center, AutoZoom] = getBoundingBox(holes_lat,holes_lon);

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
		autosize: true,
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

	var names = [];
	var depths = [];
	var colors =[];
	var etiquettes = [];


	db_jodel.transaction('rw', db_jodel.samples, function () {
		console.log('in transaction');

		return db_jodel.samples.where('A41').equals(ddhID).toArray();
		
	}).then (result => {

		for (const sample of result) {

			names.push(sample.A23);
			depths.push(sample.A48[0]);
			colors.push(sample.COLOR);
			etiquettes.push(sample.FILE_NAME);
		
		}

		var trace1 = {
			x: etiquettes,
			y: depths,
			text:names,
			mode:'lines',
			type: 'scatter',
			color: 'grey'
		};

		var trace2 = {
			x: etiquettes,
			y: depths,
			text:names,
			mode:'markers',
			type: 'scatter',
			marker:{size:12, color:colors}
		};

		var layout = {
			autosize:true,
			hovermode:'closest'
		};
		
		var data = [trace1, trace2];
		
		Plotly.newPlot('subchart32', data, layout);
			
	})
	.catch (function (e) {
		console.error("DISPLAY SAMPLES",e);
	});

}

function makeTracesForDensity(sampleList, propertyName) {

	let X = sampleList.map(({A31})=>A31);
	let Y = sampleList.map(({A32})=>A32);

	let colors = sampleList.map(({COLOR})=>COLOR);
	let names =[];

	if (propertyName != 0) {
		names = [];

		for (var sample of sampleList) {
			var name = sample.A23+'_'+propertyName+'_'+sample[propertyName];
			names.push(name);
		}
	}
	else {
		names = sampleList.map(({NAME})=>NAME);
	}


	var colorscale = ['Hot','Jet','Blackbody','Bluered','Blues','Earth','Electric','Greys','Greens','Picnic','Portland','Rainbow','RdBu',
	'Reds','Viridis','YlGnBu','YlOrRd'];

	var trace1 = {
		x: X,
		y: Y,
		mode: 'markers',
		name: 'points',
		marker: {
		  color: colors,
		  size: 10,
		  opacity: 0.9
		},
		type: 'scatter'
	  };


	  var trace2 = {
		x: X,
		y: Y,
		name: 'density',
		ncontours: 5,
		colorscale: colorscale[random(1)],
		reversescale: true,
		showscale: true,
		type: 'histogram2dcontour',
		opacity: 0.5
	  };

	  var trace3 = {
		x: X,
		name: 'x density',
		marker: {color: colors},
		yaxis: 'y2',
		type: 'histogram'
	  };

	  var trace4 = {
		y: Y,
		name: 'y density',
		marker: {color: colors},
		xaxis: 'x2',
		type: 'histogram'
	  };
	
	return [trace1,trace2,trace3,trace4];
}

/**
 * void : plot function for density graph
 * @param {*} data : Array of traces dictionnary objects 
 */
function DensityGraph(data)
{
	  var layout = {
		autosize:true,
		showlegend: false,
		margin: {t: 50},
		hovermode: 'closest',
		bargap: 0,
		barmode:"stack",
		xaxis: {
		  domain: [0, 0.85],
		  showgrid: false,
		  zeroline: false,
		  title: {
			text: "X",
			font: {
			  family: 'Courier New, monospace',
			  size: 18,
			}
		  }
		},
		yaxis: {
		  domain: [0, 0.85],
		  showgrid: false,
		  zeroline: false,
		  title: {
			text: "Y",
			font: {
			  family: 'Courier New, monospace',
			  size: 18,
			}
		  }
		},
		xaxis2: {
		  domain: [0.85, 1],
		  showgrid: false,
		  zeroline: false
		},
		yaxis2: {
		  domain: [0.85, 1],
		  showgrid: false,
		  zeroline: false
		}
	  };
	  var config = {responsive: true};
	  Plotly.newPlot('chart2', data, layout, config);

}

export function isFloat(variable) {
    return !Number.isNaN(Number.parseFloat(variable));
}


export function getColumn(colName,  array) {
    for (var i=0;i<array[0].length;i++) {
        if (array[0][i] == colName) {
            var indice =  i;
            break;
        }
    }
    var colArray = [];

    for (var j=2;j<array.length;j++) {

        var value = array[j][indice];

        if (isFloat(value)){
            value = Number.parseFloat(value);
        }
			
        colArray.push(value);

    }

    return colArray;
}

// --------------------------------------------- 

 /**
  * 
  * @param {*} number float number
  * @returns random value
  */
  function random(number) {
	return Math.floor(Math.random() * (number+1));
}
