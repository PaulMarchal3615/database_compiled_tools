//---------------------------------------------
// 1. init dexie db : db_jodel with two stores : analysis (based on analysis lines of a file and datasets to store files info)

var db_BDD = new Dexie("BDD_DB");

db_BDD.version(1).stores({
	analysis:`LINE`,
	files:`FILE_NAME,ARRAY`
});

db_BDD.open().catch(function (e) {
	console.error("Open failed: " + e);
})

// clear stores if reload page 

db_BDD.analysis.clear();
db_BDD.files.clear();

//---------------------------------------------

export function convertDataToArray() {

    var assoc = readCurrentAssociation();
}


function readCurrentAssociation() {
    var assoc = {};
    var tablebody = document.getElementById("BDDQCtable").getElementsByTagName('tbody')[0];

    for (var row of tablebody.rows) {
        var select = document.getElementById("select_"+row.cells[0].innerHTML);
        var opt = select.options[select.selectedIndex].text;
        assoc[row.cells[0].innerHTML] = opt; 
    }

    return assoc;
}