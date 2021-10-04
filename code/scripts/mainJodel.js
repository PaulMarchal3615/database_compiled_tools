var db = new Dexie("database");

db.version(1).stores({
	samples: `
    name,
	HOLEID`
});


var inputPointset = document.querySelector('#fileInput');
var inputSurface = document.querySelector('#fileInput2');

// pointset input is hidden behind a pushbutton
document.getElementById('addPointset').addEventListener('click', function() {input.click();});

// surface input is hidden behind a pushbutton
document.getElementById('addSurface').addEventListener('click', function() {input2.click();});

// files input 
inputPointset.addEventListener('input',parseData);
inputSurface.addEventListener('input',parseData);



function parseData(event) {

    for (let file of FileInput.files) {

        var extension = file.name.split('.').pop();

        if (extension =='csv'){

            if (event.target == inputPointset) {
                Papa.parse(file, {
                    download: true,
                    complete: function(results) {

                        for (var line of results.data) {

                        }

                    }
                });
            }
        }
    }
}