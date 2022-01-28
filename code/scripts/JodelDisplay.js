import {colorbrewer} from './colorBrewer.js';
import { fields } from './ressources.js';
var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`FILE_NAME,COLOR,DISPLAY_TYPE,
	*A0,*A1,*A2,*A3,*A4,*A5,*A6,*A7,*A8,*A9,*A10,*A11,*A12,*A13,*A14,*A15,*A16,*A17,*A18,*A19,*A20,*A21,*A22,*A23,*A24,*A25,*A26,*A27,*A28,*A29,*A30,*A31,*A32,*A33,*A34,*A35,*A36,*A37,*A38,*A39,*A40,**A41,*A42,*A43,*A44,*A45,*A46,*A47,*A48,*A49,*A50,*A51,*A52,*A53,*A54,*A55,*A56,*A57,*A58,*A59,*A60,*A61,*A62,*A63,*A64,*A65,*A66,*A67,*A68,*A69,*A70,*A71,*A72,*A73,*A74,*A75,*A76,*A77,*A78,
	*B0,*B1,*B2,*B3,*B4,*B5,*B6,*B7,*B8,*B9,*B10,*B11,*B12,*B13,*B14,*B15,*B16,*B17,*B18,*B19,*B20,*B21,*B22,*B23,*B24,*B25,*B26,*B27,*B28,*B29,*B30,*B31,*B32,*B33,*B34,*B35,*B36,*B37,*B38,*B39,*B40,*B41,*B42,*B43,*B44,*B45,*B46,*B47,*B48,*B49,*B50,*B51,*B52,*B53,*B54,*B55,*B56,*B57,*B58,*B59,*B60,*B61,*B62,*B63,*B64,*B65,*B66,*B67,*B68,*B69,
	*C0,*C1,*C2,*C3,*C4,*C5,*C6,*C7,*C8,*C9,*C10,*C11,*C12,*C13,*C14,*C15,*C16,*C17,
	*D0,*D1,*D2,*D3,*D4,*D5,*D6,*D7,*D8,*D9,*D10,*D11,*D12,*D13,*D14,*D15,*D16,*D17,*D18,*D19,*D20,
	*E0,*E1,*E2,*E3,*E4,*E5,*E6,*E7,*E8,*E9,*E10,*E11,*E12,*E13,*E14,*E15,*E16,*E17,*E18,*E19,*E20,*E21,*E22,*E23,*E24,*E25,*E26,*E27,*E28,*E29,*E30,*E31,*E32,*E33,*E34,*E35,*E36,*E37,*E38,*E39,*E40,*E41,*E42,*E43,*E44,
	*F0,*F1,*F2,*F3,*F4,*F5,*F6,*F7,*F8,*F9,*F10,*F11,*F12,*F13,
	*G0,*G1,*G2,*G3,*G4,*G5,*G6,*G7,*G8,*G9,*G10,*G11,*G12,*G13,*G14,*G15,*G16,*G17,
	*I0,*I1,*I2,*I3,*I4,*I5,*I6,*I7,*I8,*I9,*I10,*I11,*I12,*I13,*I14,*I15,*I16,
	*J0,*J1,*J2,*J3,*J4,*J5,*J6,*J7,*J8,*J9,*J10,*J11,*J12,*J13,*J14,*J15,*J16,*J17,*J18,*J19,*J20,
	*H0,*H1,*H2,*H3,*H4,*H5,*H6,*H7,*H8,*H9,*H10,*H11,*H12,*H13,*H14,*H15,
	*K0,*K1,*K2,*K3,*K4,*K5,*K6,*K7,*K8,*K9,*K10,*K11,*K12,*K13,*K14,*K15,*K16,*K17,*K18,*K19,*K20,*K21,*K22,*K23,*K24,*K25,*K26,*K27,*K28,*K29,*K30,*K31,*K32,*K33,*K34,
	*L0,*L1,*L2,*L3,*L4,*L5,*L6,*L7,*L8,*L9,*L10,*L11,*L12,*L13,*L14,*L15,*L16,*L17,*L18,*L19,*L20,*L21,*L22,*L23,*L24,*L25,*L26,*L27,*L28,*L29,*L30,*L31,*L32,*L33,*L34,*L35,*L36,*L37,*L38,*L39,*L40,*L41,*L42,*L43,*L44,*L45,*L46,*L47`, 
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,A0,ARRAY,COLOR,ANALYSIS`
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

	/*

	db_jodel.transaction('rw', db_jodel.holes, function () {
		console.log('in transaction');

		return db_jodel.holes.toArray();		
	}).then (drillholes =>{

		drawMap(drillholes);
	})

	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});

		*/
					
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

		/*


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

				*/
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
