//---------------------------------------------
// 1. init dexie db : db_BDD with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis_files:`FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT`,
    metadata:`ID,PROJECT_METADATA,HOLES_METADATA,SAMPLES_METADATA`,
    rawMetadata_files:`FILE_NAME,RAW_ARRAY,TYPE,CORRECT_DICT,IS_READ`
});

db_BDD.open().catch(function (e) {
	console.error("Open failed: " + e);
})

// clear stores if reload page 

db_BDD.analysis_files.clear();
db_BDD.metadata.clear();
db_BDD.rawMetadata_files.clear();

//---------------------------------------------



export function exportData() {

    console.log('protiprouta');

    return 0;

}

export function showData() {

    console.log('prout');

    db_BDD.transaction('r', db_BDD.rawMetadata_files, function() {
        return db_BDD.rawMetadata_files.toArray();
    }).then(rawFiles => {

        db_BDD.transaction('r', db_BDD.analysis_files, function() {
            return db_BDD.analysis_files.toArray();
        }).then(analysis_files => {

            updateExportTable(rawFiles, analysis_files);
    
        })
        .catch (function (e) {
            console.error("Load ANALYSIS FILES ERROR : ",e);
        });	


    })
    .catch (function (e) {
        console.error("Load RAW FILES ERROR : ",e);
    });	



}

function updateExportTable(metadataFiles, analysisFiles) {

    console.log(metadataFiles, analysisFiles);


    var tablebody = document.getElementById("ExportTable").getElementsByTagName('tbody')[0];
    $("#ExportTable tr").remove();
    
    for (var file of metadataFiles) {
        var row = tablebody.insertRow(0);
        var cell1 = row.insertCell(0);  
        cell1.innerHTML = file.FILE_NAME;

        var cell2 = row.insertCell(0);  
        cell2.innerHTML = file.TYPE;
    }

    for (var file of analysisFiles) {
        var row = tablebody.insertRow(0);
        var cell1 = row.insertCell(0);  
        cell1.innerHTML = file.FILE_NAME;

        var cell2 = row.insertCell(0);  
        cell2.innerHTML = file.TYPE;
    }
}