import { metadataNamesList } from "./ressources";

var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	samples: `NAME,FILE_NAME,HOLEID`,
	datasets: `FILE_NAME,ARRAY,TYPE,COLOR`
});

export function displayMain() {

	db_jodel.transaction('rw', db_jodel.samples, function () {
		console.log('in transaction');

		return db_jodel.samples.where('FILE_NAME').equals('QUESSANDIER_001.csv').toArray();
		
	}).then (result =>{
		var trace = buildDisplayedPointset(result);
		console.log(trace);
		scatter3DPlot([trace]);
	})
	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});


					
}



export function buildDisplayedPointset(sampleList) {

	var X = [];
	var Y = [];
	var Z = [];
	var names= [];
	var holeid =[];
	var colors = [];

	for (const sample of sampleList) {
		X.push(sample["X_NAD"]);
		Y.push(sample["Y_NAD"]);
		Z.push(sample["Z_NAD"]);
		names.push(sample['NAME']);
		colors.push(document.getElementsByName("color_"+sample.FILE_NAME)[0].value);
	}


	var trace = {
		 x: X,
		 y: Y,
		 z: Z,
		 name:names,
		mode: 'markers',
		marker: {
			size: 12,
			color:colors,
			line: {
			color:colors,
			width: 0.5},
			opacity: 0.8},
		type: 'scatter3d'
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
 function scatter3DPlot(data)
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