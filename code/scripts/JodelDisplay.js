
var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	samples:`NAME,FILE_NAME,HOLEID,DISPLAY_TYPE,COLOR`,
	datasets:`FILE_NAME,ARRAY,TYPE,COLOR`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	var:`VARLIST`
});

export function displayMain() {

	let table = document.getElementById("file_table");
	let checkList = [];
	var trace = {};

	for (var row of table.rows) {
		var fileName = row.cells[0].innerHTML;
		if (fileName != 'File') {
			if (document.getElementById('check_'+fileName).checked) {
				checkList.push(fileName);
			}
		}
	}


	var ratio = {
		x:document.getElementById("X_input").value,
		y:document.getElementById("Y_input").value,
		z:document.getElementById("Z_input").value};

	db_jodel.transaction('rw', db_jodel.samples, function () {
		console.log('in transaction');

		return db_jodel.samples.where('FILE_NAME').anyOf(checkList).toArray();		
	}).then (result =>{
		trace = buildDisplayedPointset(result, 'scatter3d');
		scatter3DPlot([trace], ratio);
	})
	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});

// drillholes

	db_jodel.transaction('rw', db_jodel.holes, function () {
		console.log('in transaction');

		return db_jodel.holes.toArray();		
	}).then (result =>{

		console.log("ddh",result);

		drawMap(result);
	})
	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});
					
}


export function buildDisplayedPointset(sampleList, displayType) {

	var X = [];
	var Y = [];
	var Z = [];
	var names= [];
	var colors = [];

	for (const sample of sampleList) {
		X.push(sample["X_NAD"]);
		Y.push(sample["Y_NAD"]);
		Z.push(sample["Z_NAD"]);
		names.push(sample['NAME']);
		colors.push(sample['COLOR']);
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
 function scatter3DPlot(data, ratio)
 {
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



function drawMap(holes) {

	var holeids = [];
	var holes_lat = [];
	var holes_lon = [];

	for (var hole of holes) {
		holeids.push(hole.HOLEID);
		holes_lat.push(hole.HOLEID_LATITUDE);
		holes_lon.push(hole.HOLEID_LONGITUDE);
		var col = hole.COLOR;	
	}


    var data = [{type: "scattermapbox",
	text:holeids, 
    textposition:'bottom center',
	lon: holes_lon, 
	lat: holes_lat, 
	name:holeids, 
	mode:'markers+text', 
	marker:{size:10,color:col }}];


    var layout = {

        title: 'drillhoel Map',
        font: {
            family: 'Droid Serif, serif',
            size: 6
        },
        titlefont: {
            size: 16
        },
    
        dragmode: "zoom",
        mapbox: { style: "open-street-map", center: { lat: 57.99, lon: -104.5 }, zoom: 10 },

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

	var names = [];
	var depths = [];
	var colors =[];
	var etiquettes = [];


	db_jodel.transaction('rw', db_jodel.samples, function () {
		console.log('in transaction');

		return db_jodel.samples.where('HOLEID').equals(ddhID).toArray();
		
	}).then (result => {

		for (const sample of result) {
			console.log(sample);

			names.push(sample.NAME);
			depths.push(parseFloat(sample.SAMPLE_DEPTH_FROM));
			colors.push(sample.COLOR);
			etiquettes.push(sample.HOLEID);

		//Samples.map(x => {return ddhID;});
		//textDisp.innerText = String(etiquette.length+" samples in well "+ddhID);

		console.log("depths",depths);

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
			
		}
	})
	.catch (function (e) {
		console.error("DISPLAY SAMPLES",e);
	});

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