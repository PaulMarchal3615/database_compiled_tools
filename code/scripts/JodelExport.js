var db_jodel = new Dexie("jodelDB");

db_jodel.version(1).stores({
	analysis:`LINE,FILE_NAME,COLOR,TYPE`,
	holes:`HOLEID,HOLEID_LATITUDE,HOLEID_LONGITUDE,COLOR,FILE_NAME`,
	datasets:`FILE_NAME,COLOR,TYPE`
});


export function exportSamples() {

    var checkList = getFileListToDisplay();
	var selected2 = document.querySelectorAll('#filter1 option:checked');
	var propertyName = Array.from(selected2).map(el => el.value);

	var selected = document.querySelectorAll('#subfilter1 option:checked');
	var valueListRaw = Array.from(selected).map(el => el.value);
	valueListRaw.sort();
	valueListRaw = valueListRaw.map(value => parseFloat(value)||value);

	// ------------------------- 3D & density view

	db_jodel.transaction('rw', db_jodel.analysis, function () {
			return db_jodel.analysis.where('FILE_NAME').anyOf(checkList).toArray();
	}).then (analysis =>{
        if (propertyName != "DEFAULT") {
			const filteredAnalysis = analysis.filter(analysisLine => valueListRaw.includes(analysisLine[propertyName]));
            //WriteData(filteredAnalysis);
        }
        else {
            //WriteData(analysis);
        }
	})
	.catch (function (e) {
		console.error("DISPLAY MAIN",e);
	});				
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