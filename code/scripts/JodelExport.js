var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});

export function exportSamples() {

	console.log("in export");

	const selected = document.querySelectorAll('#subfilter1 option:checked');
	const valueList = Array.from(selected).map(el => el.label);

	const selected2 = document.querySelectorAll('#filter1 option:checked');
	const propertyName = Array.from(selected2).map(el => el.label);

	if (valueList[0] != "-- display all data --") {

        const data = [];

		db_jodel.transaction('rw', db_jodel.samples, function () {
			console.log('in transaction');
			return db_jodel.samples.where(propertyName[0]).anyOf(valueList).toArray();		
		}).then (samples =>{

            const results = processSampleArray(samples);
            console.log(results);

            WriteData(results);     

        }).catch (function (error) {
			console.error("EXPORT ERROR",error);
		});

	}

	else {
		data = [
			["Bonjour", "c'est", "Nicolas","Sarkozy"],
			["et", "j'ai", "le","plaisir"],
			["de", "lire", "le","Temps des Tempetes"],
			["_", "pour", "Audible","_"],
		];
        WriteData(data);
	}		
    
}

async function processSampleArray(samples) {
    const properties = Object.keys(samples[0]);
    const promises =[];

    for (var sample of samples) {
        console.log(sample);
        var line =[];
        for (var property of properties) {
            line.push(sample[property]);
        }
        promises.push(line);
    }

    const result = await Promise.all(promises);
    console.log('Done!');
    return result;
  }


function WriteData(data) {

    let csvContent = "data:text/csv;charset=utf-8,"
            + data.map(e => e.join(",")).join("\n");
            
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "EXPORTED_data.csv");
            document.body.appendChild(link); 
            link.click();

}