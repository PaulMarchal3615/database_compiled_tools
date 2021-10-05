var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	samples: `NAME,FILE_NAME,HOLEID`,
	datasets: `FILE_NAME,ARRAY,TYPE,COLOR`
});





export async function buildDisplayedPointset(property, value) {

	var X = [];
	var Y = [];
	var Z = [];
	var name= [];
	var holeid =[];
	var color = document.getElementsByName("color_"+value)[0].value;

	const samples = await db_jodel.samples.where(property).equals(value).toArray();
	for (const sample of samples) {
		X.push(sample["X_NAD"]);
		Y.push(sample["Y_NAD"]);
		Z.push(sample["Z_NAD"]);
		name.push(sample['SAMPLING_POINT-NAME']);
	}

	var colors = name.map(function () { return color });

	var trace = {
		 x: X,
		 y: Y,
		 z: Z,
		mode: 'markers',
		marker: {
			size: 12,
			line: {
			color: color,
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