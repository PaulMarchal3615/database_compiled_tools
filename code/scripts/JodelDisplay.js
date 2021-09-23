import {isFloat} from './Dataset.js';
//all display functions used to plot --> not optimal yet need changes

var db = new Dexie("database");

db.version(1).stores({
	studys: `
	  id,
	  object`,
  });



export async function displayMap() {

	var container = await db.studys.get(1);
	var study = container.object;
	
	var lat = [];
	var lon = [];
	var classes=[];
	var names = [];
	var colors = [];

	var Lat_select = document.getElementById("Lat_select");
	var Lon_select = document.getElementById("Lon_select");
	var Name_select = document.getElementById("Name_select");

	var Lat_name = Lat_select.options[Lat_select.selectedIndex].label;
	var Lon_name = Lon_select.options[Lon_select.selectedIndex].label;
	var name = Name_select.options[Name_select.selectedIndex].label;

	var table = document.getElementById('file_table');

	if ($('#filter1 option:selected').length > 0){

		var filter = document.getElementById("filter1");
		var filter_name = filter.options[filter.selectedIndex].label;
		var values = $('#subfilter1 option:selected').toArray().map(item => item.text);
	}

	for (var i = 1 ; i < table.rows.length ; i++) {

		var dataset = study.datasets[table.rows[i].cells[0].innerHTML];
		var check = document.getElementsByName(dataset.name)[0].checked;

		var m_lat = [];
		var m_lon = [];
		var m_name = [];
		var classe = [];
		var m_color = [];

		if (check) {

			var color = document.getElementsByName("color_"+dataset.name)[0].value;
	
				if ((Lat_name != '--choose a Lat variable--') & (Lon_name != '--choose a Lon variable--')& (name != '--choose a Name variable--'))
				{
					if ((Lat_name in dataset.dict) & (Lon_name in dataset.dict) &(name in dataset.dict))
					{

					if ((!$('#filter1 option:selected').length) || (filter_name == '-- display all data --') ||(values[0] == '-- display all data --')){
						
							m_lat = dataset.dict[Lat_name];
							m_lon = dataset.dict[Lon_name];
							m_name = dataset.dict[name];
							m_lat.splice(0,1);
							m_lon.splice(0,1);
							m_name.splice(0,1);
							classe = m_lat.map(function () { return dataset.name });
							m_color = m_lat.map(function () { return color });
							lat = lat.concat(m_lat);
							lon = lon.concat(m_lon);
							names = names.concat(m_name);
							classes = classes.concat(classe);
							colors = colors.concat(m_color);
					}
					else {
						for (var key in dataset.dict) {
							if (key == filter_name) {
								for (var j = 1; j <dataset.dict[key].length; j++) {
									for (var value of values) {
										if (dataset.dict[key][j] == value) {
											m_lat.push(dataset.dict[Lat_name][j]);
											m_lon.push(dataset.dict[Lon_name][j]);
											m_name.push(dataset.dict[name][j]);
										}
									}
								}
								classe = m_lat.map(function () { return dataset.name });
								m_color = m_lat.map(function () { return color });
								lat = lat.concat(m_lat);
								lon = lon.concat(m_lon);
								names = names.concat(m_name);
								classes = classes.concat(classe);
								colors = colors.concat(m_color);
							}
						}
					}
				}
			}
		}
	}

	if ((lon.length >0) & (lat.length >0)) {
		simpleMap(lon, lat, classes, names, colors);
	}

	db.studys.put({id:1, object:study});
	
}


/**
 * void : main display function --> display Datasets traces if datasets are selected in table
 */
export async function display() {
	//load study 
	var container = await db.studys.get(1);
	var study = container.object;

    var data = [];
    var data3d = [];
	var dataDensity = [];

    var x_name = X_select.options[X_select.selectedIndex].label;
	var y_name = Y_select.options[Y_select.selectedIndex].label;
    var z_name = Z_select.options[Z_select.selectedIndex].label;

	if (Object.keys(study.datasets).length >0) {
		for (var key in study.datasets) {

				var dataset = study.datasets[key];

				var check = document.getElementsByName(dataset.name)[0].checked;

				if (check) {
					data.push(dataset.trace);
					data3d.push(dataset.trace3d);
					dataDensity = dataDensity.concat(dataset.dataDensity);
				}
		}

		// call plot function with selected data
		scatter3DPlot(data3d, x_name,y_name,z_name);
		DensityGraph(dataDensity, x_name,y_name);

		// save study
		db.studys.put({id:1, object:study});

	}  
}


/**
 * void : update traces data when parameters are changed 
 */
export async function changeTrace(){

	var container = await db.studys.get(1);
	var study = container.object;

	var X_select = document.getElementById("X_select");
	var Y_select = document.getElementById("Y_select");
	var Z_select = document.getElementById("Z_select");

	var x_name = X_select.options[X_select.selectedIndex].label;
	var y_name = Y_select.options[Y_select.selectedIndex].label;
	var z_name = Z_select.options[Z_select.selectedIndex].label;

	// if filters are enabled 
	if ($('#filter1 option:selected').length > 0){

		var filter = document.getElementById("filter1");
		var filter_name = filter.options[filter.selectedIndex].label;

		// store an array containing sufilters values 
		var values = $('#subfilter1 option:selected').toArray().map(item => item.text);

	}

	// update traces  in two steps : update x, y, z array and then build traces for display functions 
	for (var key in study.datasets) {
        var dataset = study.datasets[key];
		var color = document.getElementsByName("color_"+dataset.name)[0].value;

		color = hexToRgb(color);
	
		if ((x_name != '--choose a X variable--') & (y_name != '--choose a Y variable--') & (z_name != '--choose a Z variable--')){

			if ((x_name in dataset.dict) & (y_name in dataset.dict) &(z_name in dataset.dict)) {
	
				var x = [];
				var y = [];
				var z = [];

				if ((!$('#filter1 option:selected').length) || (filter_name == '-- display all data --') ||(values[0] == '-- display all data --')){
					x = dataset.dict[x_name];
					y = dataset.dict[y_name];
					z = dataset.dict[z_name];
				}

				else {
					for (var key2 in dataset.dict) {
						if (key2 == filter_name) {
							for (var i = 0; i <dataset.dict[key2].length; i++) {
								for (var value of values) {
									if (dataset.dict[key2][i] == value) {
										x.push(dataset.dict[x_name][i]);
										y.push(dataset.dict[y_name][i]);
										z.push(dataset.dict[z_name][i]);
									}
								}
							}
						}
					}
				}
				
				// build traces fron x, y, z arrays
				if  (dataset.type == "Pointset") {

					dataset.trace = {
						x:x, y:y, z:z,
						mode: 'markers',
						marker: {
							color:color,
							size: 12,
							opacity: 1},
						type: 'scatter'
					};

					dataset.trace3d = {
						x:x, y:y, z:z,
						mode: 'markers',
						marker: {
							size: 12,
							color: color,
							line: {
							color: color,
							width: 0.5},
							opacity: 1},
						type: 'scatter3d'
					};

					dataset.dataDensity = makeTracesForDensity(x,y,color, i);
				}

				else if (dataset.type == "Surface") {
					var a=[]; var b=[]; var c=[];

					for(var j=1 ; j<x.length ; j++)
					{
						a.push(parseFloat(x[j]));
						b.push(parseFloat(y[j]));
						c.push(parseFloat(z[j]));
					}


					dataset.trace3d = {
						opacity:1,
						color:color,
						type: 'mesh3d',
						x: a,
						y: b,
						z: c,
					};
				}	

			}
		}
	}

	db.studys.put({id:1, object:study});


	display();
}

/**
 * void : plot function for 2D scatterplot 
 * @param {*} data Array[dict] containing traces as dict
 * @param {*} x_name String
 * @param {*} y_name String
 */
function scatter2DPlot(data,x_name,y_name)
{


	var layout = {
		autosize:true,
		xaxis: {
		  automargin:true,
		  title: {
			text: x_name,
			font: {
			  family: 'Courier New, monospace',
			  size: 18,
			}
		  },
		},
		yaxis: {
		  automargin:true,
		  title: {
			text: y_name,
			font: {
			  family: 'Courier New, monospace',
			  size: 18,
			}
		  }
		}
	  };

	
	Plotly.newPlot('chart0', data, layout);

}

/**
 * void 3d plot function 
 * @param {*} data : Array[dict] containing traces as dict
 * @param {*} x_name String
 * @param {*} y_name String 
 * @param {*} z_name String
 */
function scatter3DPlot(data, x_name, y_name,z_name)
{
	var layout = {
		scene:{
			aspectmode:'manual',
			aspectratio: {x:1, y:1, z:1},
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
			  text: x_name,
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
			  text: y_name,
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
			  text: z_name,
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
 * @param {*} lat Array[string] : column of Latitude
 * @param {*} lon Array[string] : column of Latitude
 * @param {*} classes Array[string] : labels
 * @param {*} names Array[string] : labels
 * @param {*} colors Array[string] : points color
 */
function simpleMap(lon,lat,classesList, namesList, colorsList)
{

	var lat_nb = [];
	var lon_nb = [];
	var names = [];
	var classes = [];
	var colors = [];

	for (var i=0 ; i<lat.length ; i++) {
		if ((isFloat(lat[i])) & (isFloat(lon[i])) & !lat_nb.includes(lat[i])) {
			lat_nb.push(Number.parseFloat(lat[i]));
			lon_nb.push(Number.parseFloat(lon[i]));
			names.push(namesList[i]);
			classes.push(classesList[i]);
			colors.push(colorsList[i]);
		}

	}

	var data = [{type: "scattermapbox",
	text:names, 
	lon: lon_nb, 
	lat: lat_nb, 
	name:classes, 
	mode:'markers+text', 
	marker:{size:10, color:colors}}];

	var layout = {
		dragmode: "zoom",
		mapbox: { style: "open-street-map", center: { lat: 57.99, lon: -104.5 }, zoom: 10 },
		margin: { r: 0, t: 0, b: 0, l: 0 },
		height:800,
		width:800
	};

	var myPlot = document.getElementById('subchart31');

	Plotly.newPlot('subchart31', data, layout);

	myPlot.on('plotly_click', function(data){

		for(var point of data.points){
				var ddh = point.text;
		}

		LinePlot(ddh);	

});	
}

/**
 * 
 * @param {*} x : Array, 1st variable
 * @param {*} y : ZArray : second variable 
 * @param {*} color : String color
 * @param {*} number 
 * @returns Array data containing traces for x, y variables, used for 2D density display
 */
function makeTracesForDensity(x,y,color,number) {

	var colorscale = ['Hot','Jet','Blackbody','Bluered','Blues','Earth','Electric','Greys','Greens','Picnic','Portland','Rainbow','RdBu',
	'Reds','Viridis','YlGnBu','YlOrRd'];

	var trace1 = {
		x: x,
		y: y,
		mode: 'markers',
		name: 'points',
		marker: {
		  color: color,
		  size: 10,
		  opacity: 0.7
		},
		type: 'scatter'
	  };


	  var trace2 = {
		x: x,
		y: y,
		name: 'density',
		ncontours: 20,
		colorscale: colorscale[number],
		reversescale: true,
		showscale: true,
		type: 'histogram2dcontour',
		opacity: 0.5
	  };

	  var trace3 = {
		x: x,
		name: 'x density',
		marker: {color: color},
		yaxis: 'y2',
		type: 'histogram'
	  };

	  var trace4 = {
		y: y,
		name: 'y density',
		marker: {color: color},
		xaxis: 'x2',
		type: 'histogram'
	  };
	
	return [trace1,trace2,trace3,trace4];
}

/**
 * void : plot function for density graph
 * @param {*} data : Array of traces dictionnary objects 
 * @param {*} x_name : String 1st variable name
 * @param {*} y_name : String 2nd variable name
 */
function DensityGraph(data, x_name, y_name)
{
	  var layout = {
		autosize:true,
		showlegend: false,
		margin: {t: 50},
		hovermode: 'closest',
		bargap: 0,
		xaxis: {
		  domain: [0, 0.85],
		  showgrid: false,
		  zeroline: false,
		  title: {
			text: x_name,
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
			text: y_name,
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

/**
 * general function calling BarGraph and PieChart on selected columns
 */
export async function displayStats() {

	var container = await db.studys.get(1);
	var study = container.object;
	var stat_name = Stat_select.options[Stat_select.selectedIndex].label;

	var column = [];

	for (var key in study.datasets) {
        var dataset = study.datasets[key];
		if ((stat_name in dataset.dict) & (dataset.type != 'Surface')) {
		column = column.concat(dataset.dict[stat_name]);
		}
		
	}
	BarGraph(column);
	PieChart(column);
	db.studys.put({id:1, object:study});
}

/**
 * void : plot function draw a bargraph of selected column 
 * @param {*} column array containing selected column
 */
function BarGraph(column){	

	var dict = {};

	for ( var i = 1 ; i < column.length ; i++) {
			if (column[i] in dict)  {
				dict[column[i]] += 1;
			}
			else {
				dict[column[i]] = 1;
				}
	}

	var values = [];
	var labels = [];

	for (var key in dict) {
		labels.push(key);
		values.push(dict[key]);
	}


	var data = [{
		x: labels,
		y: values,
		type: 'bar'
	  }];
	  
	  var layout = {
		height: 400,
		width: 500
	  };
	  
	  Plotly.newPlot('chart5', data, layout);

}

/**
 * void : plot function draw a piechart of selected column 
 * @param {*} column : array containing selected column
 */
function PieChart(column) {

	var dict = {};

	for ( var i = 1 ; i < column.length ; i++) {
			if (column[i] in dict)  {
				dict[column[i]] += 1;
			}
			else {
				dict[column[i]] = 1;
				}
	}

	var values = [];
	var labels = [];

	for (var key in dict) {
		labels.push(key);
		values.push(dict[key]);
	}

	var data = [{
		values: values,
		labels: labels,
		type: 'pie'
	  }];
	  
	  var layout = {
		height: 400,
		width: 500
	  };
	  
	  Plotly.newPlot('chart4', data, layout);

}


/**
 * void : plot function to draw selected drillhole as a line with its samples as points
 * @param {*} ddhID String value --> drillhole id to plot
 */
async function LinePlot(ddhID) {
	var container = await db.studys.get(1);
	var study = container.object;
	var textDisp = document.getElementById("sample_nb");

	let keys = Object.keys(study.drillholes);

	if (keys.includes(ddhID)) {
		var Samples = study.drillholes[ddhID];
		var names = [];
		var depth = [];
		var colors = [];

		for (var sample of Samples) {
			names.push(sample.name);
			depth.push(sample.depth);

			var color = document.getElementsByName('color_'+sample.dataset.name)[0].value;
			colors.push(color);

		}

		var etiquette = Samples.map(x => {return ddhID;});

		textDisp.innerText = String(etiquette.length+" samples in well "+ddhID);

		var trace1 = {
			x: etiquette,
			y: depth,
			text:names,
			mode:'lines',
			type: 'scatter',
			color: 'grey'
		};

		var trace2 = {
			x: etiquette,
			y: depth,
			text:names,
			mode:'markers',
			type: 'scatter',
			marker:{size:12, color:colors}
		};

		var layout = {
			height:850,
			width:200,
			hovermode:'closest'
		};
		
		var data = [trace1, trace2];
		
		Plotly.newPlot('subchart32', data, layout);
		db.studys.put({id:1, object:study});
		}
	else {
		alert("not in dataset.");
	}
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

/**
 * 
 * @param {*} h hexadecimal string containing color value
 * @returns string rgb value
 */
function hexToRgb(h){
    h.replace('"','');
    var arr = ['0x'+h[1]+h[2]|0,'0x'+h[3]+h[4]|0,'0x'+h[5]+h[6]|0];
    return 'rgb('+arr[0]+','+arr[1]+','+arr[2]+')';
}