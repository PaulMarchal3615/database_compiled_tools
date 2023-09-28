import {isFloat} from '../Common/common_functions.js';
import { holesTraces ,litho_colors} from '../Common/ressources.js';
var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE,A41`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

// -------------------------------------
// Plotly display functions 

/**
 * main display function : load data to display, filter it based on filter1 and subfilter1 and display it
 */
export function displayMain() {


    var checkList = getFileListToDisplay().SCATTER;

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

        if (propertyName != "DEFAULT") {
			analysis = analysis.filter(analysisLine => valueListRaw.includes(analysisLine[propertyName]));

		}

        initColorScale(analysis, propertyName, valueListRaw);

		var surfaceCheckList = getFileListToDisplay().SURFACE;

		db_jodel.transaction('r', db_jodel.datasets, function () {
				return db_jodel.datasets.where('FILE_NAME').anyOf(surfaceCheckList).toArray();
		}).then (surfaces =>{

			var traces = buildTrace3D(analysis, propertyName, surfaces);
			scatter3DPlot(traces);
			buildTraceMap(analysis);
			var densityData = makeTracesForDensity(analysis, propertyName);
			DensityGraph(densityData);
		})
		.catch (function (e) {
			console.error("DISPLAY MAIN 1",e);
			console.log("error is ",e);
		});	

	})
	.catch (function (e) {
		console.error("DISPLAY MAIN 2",e);
	});		
	
	

}


/**
 * 
 * @returns list of files which are checked to display in file_table
 */
export function getFileListToDisplay() {
    let table = document.getElementById("file_table");
	let ScatterList = [];
	let SurfaceList = [];

	for (var row of table.rows) {
		var fileName = row.cells[0].innerHTML;
		if (fileName != 'File') {
			if (document.getElementById('check_'+fileName).checked) {
				var strUser = row.cells[4].innerHTML;
				if (strUser=='scatter3d') {
					ScatterList.push(fileName);
				}
				else{
					SurfaceList.push(fileName);
				}
				
			}
		}
	}
    return {SCATTER:ScatterList, SURFACE:SurfaceList};
}



/**
 * 
 * @param {*} colorList Array of string containing colors used in display
 * @param {*} valueList Array of values (float or string) associated with colors of valueList
 * returns void : called when dipslay data with filter on, change color_table element with new legend 
 */
function fillCaptionTable(colorList, valueList) {

	$("#color_table tr").remove();

	if (colorList[0] != "DEFAULT") {
		let multiCol = document.getElementById("multiCol").value;

		var tablebody = document.getElementById("color_table").getElementsByTagName('tbody')[0];
		var row1 = tablebody.insertRow(0);
		var cell11 = row1.insertCell(0);
		var cell12 = row1.insertCell(1);
		cell11.bgColor = multiCol;
		cell11.style.width = '25px';
		cell12.innerHTML = "Multiple Values"; 
	
		for (var i=0;i<colorList.length; i++) {
			var row = tablebody.insertRow(0);
			var cell1 = row.insertCell(0);
			var cell2 = row.insertCell(1);
			cell1.bgColor = colorList[i];
			cell1.style.width = '25px';
			cell2.innerHTML = Math.round((valueList[i] + Number.EPSILON) * 100) / 100 || valueList[i];
		}
	}
		
}

/**
 * 
 * @param {*} analysisLines : array[analysisObj from db_jodel.analysis]
 * @param {*} propertyName : string containing property to display in colors
 * @param {*} varList : array[float/string] all values existing for propertyName on all analysis 
 * returns void : build a color scale and change color param in analysisLines (temporary not changed in dexie DB) based on properties;
 */
function initColorScale(analysisLines, propertyName, varList) {

	// we get choosen values for color scales from input[type=color] lowCol and highCol
	var size = document.getElementById("num-classes").value;

	var scale_name = document.getElementById("color-id").text;
	var scale_name = $('#color-id').find(":selected").text();
	var size = 0;
	//var scale = [];

	// if we choose to display a certain property from filters
	if ((propertyName != "DEFAULT") && (varList.length >0)) {

		// if property is a continuous property (float values)
		if (isFloat(varList[0])) {

			//size = $('#num-classes').find(":selected").text();
			size = document.getElementById("num-classes").value;
			var limits = chroma.limits(varList, 'e', size-1);



			//scale = chroma.scale([colorLow,colorHigh])
			//.mode('hsl').colors(size);

			var scale = chroma.scale(scale_name).mode('hsl').colors(size);

			//chroma.scale(['lightyellow', 'navy']).domain([1, 100000], 7, 'log');

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

		// categorical property
		else {

			size = varList.length;
			scale = chroma.scale(scale_name).mode('hsl').colors(size);
		
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
	// default case --> use default colors (no changes) and erase color_table
	else {
		fillCaptionTable(["DEFAULT"], varList);
	}
}


/**
 * 
 * @param {*} arrLines 
 * @param {*} propertyName 
 * @param {*} request
 * @returns Obj containing samples to display with X, Y, Z, text and colors
 */
function multiDimArray(arrLines, propertyName, request) {
	var sampleCol={};
	for (var line of arrLines) {
		if (!Object.keys(sampleCol).includes(line.A23)){
			let sample = {NAME:line.A23,ETIQUETTE:[line.A23], X:line[request[0]], Y:line[request[1]], Z:line[request[2]], COLOR:[line.COLOR] };
			sampleCol[line.A23] = sample ;
		}
		else if (!sampleCol[line.A23].COLOR.includes(line.COLOR)){
			sampleCol[line.A23].COLOR.push(line.COLOR);	
		}
		if (propertyName != "DEFAULT")  {
			sampleCol[line.A23].ETIQUETTE.push(line[propertyName]);
		}
	}
	return sampleCol;
}


/**
 * 
 * @param {*} obj sample object with obj.COLOR = [strings]
 * @returns a single color if one color; a default color (multiCol) if several colors ie several values on point
 */
function mapColors(obj) {

	var colorMulti = document.getElementById("multiCol").value;
	if (obj.COLOR.length > 1) {
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
export function buildTrace3D(analysisLines, propertyName, surfaces) {



	var traces =[];

	var request =['A31','A32','A33'] // 3 properties to request

	var arr2 = Object.values(multiDimArray(analysisLines,propertyName, request));

	console.log(arr2);

	// create one traces for all analysis points

	let Xvals1 = arr2.map(({X})=>X);
	let Yvals1 = arr2.map(({Y})=>Y);
	let Zvals1 = arr2.map(({Z})=>Z);
	let colors = arr2.map(mapColors);
	let text = arr2.map(({ETIQUETTE})=>JSON.stringify(ETIQUETTE.filter((v, i, a) => a.indexOf(v) === i)));

	var Xvals = Xvals1.filter(function( element ) {
		return element !== undefined;
		});

	var Yvals = Yvals1.filter(function( element ) {
		return element !== undefined;
		});

	var Zvals = Zvals1.filter(function( element ) {
		return element !== undefined;
		});

	let minX = Math.min(...Xvals);
	let maxX = Math.max(...Xvals);

	let minY= Math.min(...Yvals);
	let maxY= Math.max(...Yvals);

	var Xmul= Xvals.map(function(x) { return (x-minX)/(maxX-minX); });
	var Ymul = Yvals.map(function(x) { return(x-minY)/(maxY-minY); });

	console.log(Xmul, Ymul);

	var traceScatter = {
		x: Xmul,
		y: Ymul,
		z: Zvals,
		text:text,
		mode: 'markers',
		opacity:1,
		marker: {
			size: 12,
			color:colors,
			line: {
			color:colors,
			width: 0.4},
			opacity: 1},
		type: 'scatter3d'
	};

	traces.push(traceScatter);

	// create several traces for each surfaces

	if (surfaces != []) {

		for (var surface of surfaces) {

			let Xsurf = surface.X_NAD.map(function(x) { return (x-minX)/(maxX-minX); });
			let Ysurf = surface.Y_NAD.map(function(x) { return (x-minY)/(maxY-minY); });

			traces.push({
				x: Xsurf,
				y: Ysurf,
				z: surface.Z_NAD,
				color: surface.COLOR,
				opacity : 0.8,
				type: 'mesh3d'
			});
		}
		
	}

	if ($("#dispTraces").is(":checked")) {

		var wellraw = analysisLines.map(({A41})=>A41);
		var wellList = wellraw.filter((v, i, a) => a.indexOf(v) === i);

		var wells = addWellTraces(wellList, minX, maxX, minY, maxY);
		traces = traces.concat(wells);

	}
	return traces;	
	
}

/**
 * 
 * @param {*} wellList array of well string names
 * @returns array of traces object (plotly format for scatter lines) 
 */
function addWellTraces(wellList, minX, maxX, minY, maxY) {

	var tracesWells = [];

	for (var well of wellList) {

		if (Object.keys(holesTraces).includes(well)) {

			let Xwell = holesTraces[well].X.map(function(x) { return (x-minX)/(maxX-minX);});
			let Ywell = holesTraces[well].Y.map(function(x) { return (x-minY)/(maxY-minY);});	

			var traceWell = {

				x: Xwell,
				y: Ywell,
				z: holesTraces[well].Z,
				text:holesTraces[well].X.map(x => well),
				mode: 'lines',
				type: 'scatter3d',
				opacity:0.8,
				line: {
					width: 4,
					color: '#AF1F00'}
			};

			tracesWells.push(traceWell);

		}
		else {
			//alert (well, ' not in BDD');
		}
	}

	return tracesWells;

    
}

/**
 * void 3d plot function 
 * @param {*} data : Array[dict] containing traces as dict
 */
 function scatter3DPlot(data){

	var ratio = {
		x:document.getElementById("X_input").value,
		y:document.getElementById("Y_input").value,
		z:document.getElementById("Z_input").value
	};

	 var layout = {
		 showlegend:false,
		 showgrid:false,
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
			   text: "Longitude",
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
			   text: "Latitude",
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
			   text: "Z",
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

 
	 var config = {responsive: true, 
		width:"5000px",
		height:"5000px",
		modeBarButtonsToRemove:['toImage', 'sendDataToCloud'],
		modeBarButtonsToAdd:[{
		name: 'toImage2',
		icon: Plotly.Icons.camera,
		click: function(gd) {
		  Plotly.downloadImage(gd, {format: 'svg'})
		}
	  }]};
 
	Plotly.newPlot('chart1', data, layout, config);
 }

 /**
 * 
 * @param {*} lat : latitude array
 * @param {*} lon Longitude array
 * return zoom, latCenter, lonCenter : use to center mapview on data
 */ 
function getBoundingBox(lat1,lon1) {

	var lat = lat1.filter(function( element ) {
		return element !== undefined;
		});

	var lon = lon1.filter(function( element ) {
	return element !== undefined;
	});

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


/**
 * void : build the map display 
 * @param {*} analysisLines : array[analysis Obj]
 */
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
	
	marker: {

		color: colors,
		size: 20,
		line: {
		  color: 'rgb(0, 0, 0)',
		  width: 2
		}
	
	  },
	}];

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
        mapbox: { style: "stamen-terrain", center: { lat: center.lat, lon: center.lon }, zoom: AutoZoom },

        margin: { r: 0, t: 0, b: 0, l: 0 },
        annotations:{
            align:"left",
            arrowcolor:"black",
            text:"test",
            x:58.07,
            y:-104.48

        }     
	};

	var myPlot = document.getElementById('subchart31');

	var config = {responsive: true, 
		width:"5000px",
		height:"5000px",
		modeBarButtonsToRemove:['toImage', 'sendDataToCloud'],
		modeBarButtonsToAdd:[{
		name: 'toImage2',
		icon: Plotly.Icons.camera,
		click: function(gd) {
		  Plotly.downloadImage(gd, {format: 'svg'})
		}
	  }]};

    Plotly.newPlot('subchart31', data, layout, config);

	myPlot.on('plotly_click', function(selectedData){

		for(var point of selectedData.points){
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
		var text2 = document.getElementById("miniInfoDisp2");
		text2.innerHTML = ddhID+' has : '+result.length+' samples.';

		if (propertyName != "DEFAULT") {
			result = result.filter(analysisLine => valueListRaw.includes(analysisLine[propertyName]));
		}
		
		initColorScale(result, propertyName, valueListRaw);

		var request =['A41','A48','A33'] // 3 properties to request

		var arr2 = Object.values(multiDimArray(result,propertyName,request));

		let samplesHoles = arr2.map(({X})=>X);
		let samplesDepths = arr2.map(({Y})=>Y);
		let samplesColors = arr2.map(mapColors);
		let text = arr2.map(({ETIQUETTE})=>JSON.stringify(ETIQUETTE.filter((v, i, a) => a.indexOf(v) === i)));

		var trace1 = {
			x: samplesHoles,
			y: samplesDepths,
			text:text,
			mode:'lines',
			type: 'scatter',
			color: 'black'
		};

		var trace2 = {
			x: samplesHoles,
			y: samplesDepths,
			text:text,
			mode:'markers',
			type: 'scatter',
			marker:{size:12, color:samplesColors}
		};

		var layout = {
			hovermode:'closest',
			yaxis:{autorange:'reversed'},
			showlegend: false
		};
		
		var data = [trace1, trace2];
		
		Plotly.newPlot('subchart32', data, layout , {
			responsive:true,
			width:"100%",
			height:"100%",
			modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
			modeBarButtonsToAdd: [{
			  name: 'toImageSVG',
			  icon: Plotly.Icons.camera,
			  click: function(gd) {
				Plotly.downloadImage(gd, {format: 'svg'})
			  }
			}]
		  });
	})
	.catch (function (e) {
		console.error("DISPLAY SAMPLES",e);
	});

}


/**
 * 
 * @param {*} analysisLines : array[analysis Obj]
 * @param {*} propertyName : string containing current used property
 * @returns array of traces for density map
 */
function makeTracesForDensity(analysisLines, propertyName) {

	var selectX = document.getElementById("densityX");
	var XCode = selectX.options[selectX.selectedIndex].value;

	var selectY = document.getElementById("densityY");
	var YCode = selectY.options[selectY.selectedIndex].value;

	var request =[XCode,YCode,'A28'];

	var arr2 = Object.values(multiDimArray(analysisLines,propertyName, request));

	// create one traces for all analysis points

	let Xvalues = arr2.map(({X})=>X);
	let Yvalues = arr2.map(({Y})=>Y);

	let colors = arr2.map(mapColors);

	var colorscale = ['Hot','Jet','Blackbody','Bluered','Blues','Earth','Electric','Greys','Greens','Picnic','Portland','Rainbow','RdBu',
	'Reds','Viridis','YlGnBu','YlOrRd'];

	var trace1 = {
		x: Xvalues,
		y: Yvalues,
		mode: 'markers',
		name: 'points',
		marker: {
		  color: colors,
		  size: 10,
		  opacity: 0
		},
		type: 'scatter'
	  };


	  var trace2 = {
		x: Xvalues,
		y: Yvalues,
		name: 'density',
		ncontours: 20,
		colorscale: colorscale[0],
		contours: {

			showlabels: false,

			labelfont: {
			  family: 'Raleway',
			  color: 'white'
			}
		  },
		reversescale: true,
		showscale: false,
		type: 'histogram2dcontour',
		opacity: 1
	  };

	  var trace3 = {
		x: Xvalues,
		name: 'x density',
		marker: {color: colors},
		yaxis: 'y2',
		type: 'histogram'
	  };

	  var trace4 = {
		y: Yvalues,
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
	var selectX = document.getElementById("densityX");
	var Xtext = selectX.options[selectX.selectedIndex].text;

	var selectY = document.getElementById("densityY");
	var Ytext = selectY.options[selectY.selectedIndex].text;

	var layout = {
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
		text: Xtext,
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
		text: Ytext,
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

	var config = {
		responsive: true,
		width:"5000px",
		height:"5000px",
		modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
		modeBarButtonsToAdd: [{
			name: 'toImageSVG',
			icon: Plotly.Icons.camera,
			click: function(gd) {
				Plotly.downloadImage(gd, {format: 'svg'})
			}
		}]
	};

	Plotly.newPlot('chart2', data, layout, config);

}