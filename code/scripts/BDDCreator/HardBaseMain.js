// function and classes import fron other files
import {GeoCoordSys,ProjCoordSys,Languages,lithology,gitology,texture,countries, projectMetadata,chronostratigraphic} from './ressources.js';
import {Drillhole} from './HardbaseDrillhole.js';
import {Sample} from './Sample.js';


var db = new Dexie("database");

db.version(1).stores({
  identities:`name,
  firstName,
  mail,
  type`,
  projects:`name,
  project`,
	samples: `
	  name,
	  meta,
      lines`,
  holes:`
    name,
    samples,
    meta
    `
  });

db.open().catch(function (e) {
    console.error("Open failed: " + e.stack);
})

// clear stores if reload page 

db.identities.clear();
db.projects.clear();
db.samples.clear();
db.holes.clear();

$(document).ready(function () {
  $('td input').bind('paste', null, function (e) {
      var $txt = $(this);
      setTimeout(function () {
          var values = $txt.val().split(/\s+/);
          var currentRowIndex = $txt.parent().parent().index();
          var currentColIndex = $txt.parent().index(); 
          
          var totalRows = $('#example tbody tr').length;
          var totalCols = $('#example thead th').length;
          var count =0;
          for (var i = currentColIndex; i < totalCols; i++) {
              if (i != currentColIndex)
                  if (i != currentColIndex)
                      currentRowIndex = 0;
              for (var j = currentRowIndex; j < totalRows; j++) {                           
                  var value = values[count];
                  var inp = $('#example tbody tr').eq(j).find('td').eq(i).find('input');
                  inp.val(value);
                  count++;
                 
              }
          }


      }, 0);
  });
});

var input = document.querySelector('#HardBaseFileInput');
var input2 = document.querySelector('#HardBaseFileInput2');


// pointset input is hidden behind a pushbutton
var btn1 = document.getElementById("OpenModifyFile");
btn1.addEventListener('click', function() {input.click();});
// files input 
input.addEventListener('input',LoadFile);

// pointset input is hidden behind a pushbutton
var btn3 = document.getElementById("OpenIDFile");
btn3.addEventListener('click', function() {input2.click();});
// files input 
input2.addEventListener('input',readIdentites);

var btn2 = document.getElementById("createNewFile");
btn2.addEventListener("click",createNewFile);


//-------------------------------------------------------------


async function displayIdentities() {

  const all = await db.identities.toArray();
  var array =[];
  for (var id of all) {
    array.push([id.name,id.firstName, id.mail, id.level])

  }
  BuildTableFromArray("IDTable",array);

}


//-------------------------------------------------------------

function LoadFile() {

  readIdentites();
    var project = {};
    project.metadata = projectMetadata;
    let file = input.files[0];
    var extension =file.name.split('.').pop();

    if (extension =='csv') {

      Papa.parse(file, {
			download: true,
			complete: function(results) {
                //load general metadata
                for (var colName of Object.keys(project.metadata)) {
                    let value = findValue(results.data, colName, 2);
                    console.log(colName,value);
                    project.metadata[colName].value = value;
                }
                // load holes and samples metadata 
                var arr = LoadHolesInformation(results.data);
                project.holes = arr[0];
                project.samples = arr[1];

                // save

              db.projects.bulkPut([{ name: 1, object: project}]);
              displayLoadedData(project);    
			}
		});
    //display 
    
	}

    else {
        alert("IMPORT A CSV FILE !");
    }
}

function createNewFile() {
  var project = {};
  project.holes = {};
  project.samples = {};
  project.metadata = projectMetadata;
  db.projects.bulkPut([{ name: 1, object: project}]);
  displayLoadedData(project); 

}

function displayLoadedData(project) {

  buildComplexTable("GeneralMetadata", project.metadata);
  buildMultipleSelect(["PROJECT_COUNTRY","PROJECT_PROVINCE"],countries,2);
  initselect("PROJECT_COUNTRY", project.metadata.PROJECT_COUNTRY.value);
  initselect("PROJECT_PROVINCE", project.metadata.PROJECT_PROVINCE.value);

  updateSelect("SAMPLING_POINT-COORDINATE_SYSTEM",GeoCoordSys);
  initselect("SAMPLING_POINT-COORDINATE_SYSTEM", project.metadata["SAMPLING_POINT-COORDINATE_SYSTEM"].value);
  updateSelect("COORDINATE_SYSTEM_NAD",ProjCoordSys);
  initselect("COORDINATE_SYSTEM_NAD", project.metadata.COORDINATE_SYSTEM_NAD.value);
  updateSelect("LANGUAGE",Languages);
  initselect("LANGUAGE", project.metadata.LANGUAGE.value);
  
  buildSimpleTable("HolesTable",Object.keys(project.holes), displayHoleMetadata);
  var buildingList = getStorageInformation(Object.values(project.samples));
  
  buildSimpleTable("StorageBuildingsTable",buildingList,displayBuildingContent);

}

function getStorageInformation(sampleList) {
  var buildingList = [];
  for (var sample of sampleList) {
    var buildingName = sample.meta["SAMPLE_LOCATION_BUILDING"].value;
    if (!buildingList.includes(buildingName)) {
      buildingList.push(buildingName);
    }
  }
  return buildingList;
}

async function displayBuildingContent(event) {

  var cell = $(event.target);
  var buildingName = cell[0].innerHTML;

  var container = await db.projects.get(1);
  var project = container.object;
  var samples = Object.values(project.samples);
  var request = RequestOnPropertyValue(samples,"SAMPLE_LOCATION_BUILDING",buildingName);

  var rooms = [];

  for (var sample of request) {
    var room = sample.meta["SAMPLE_LOCATION_ROOM"].value;
    if (!rooms.includes(room)) {
      rooms.push(room);
    }
  }

  buildSimpleTable("StorageRoomsTable",rooms, displayRoomContent);


}

async function displayRoomContent(event) {

  var cell = $(event.target);
  var roomName = cell[0].innerHTML;

  var container = await db.projects.get(1);
  var project = container.object;
  var samples = Object.values(project.samples);
  var request = RequestOnPropertyValue(samples,"SAMPLE_LOCATION_ROOM",roomName);

  var shelves = [];

  for (var sample of request) {
    var shelf = sample.meta["SAMPLE_LOCATION_SHELF"].value;
    if (!shelves.includes(shelf)) {
      shelves.push(shelf);
    }
  }

  buildSimpleTable("StorageShelvesTable",shelves, displayShelfContent);


}

async function displayShelfContent(event) {

  var cell = $(event.target);
  var shelfName = cell[0].innerHTML;

  var container = await db.projects.get(1);
  var project = container.object;
  var samples = Object.values(project.samples);
  var request = RequestOnPropertyValue(samples,"SAMPLE_LOCATION_SHELF",shelfName);

  var boxes = [];

  for (var sample of request) {
    var box = sample.meta["SAMPLE_LOCATION_BOX"].value;
    if (!boxes.includes(box)) {
      boxes.push(box);
    }
  }

  buildSimpleTable("StorageBoxesTable",boxes, displayBoxContent);


}

async function displayBoxContent(event) {

  var cell = $(event.target);
  var boxName = cell[0].innerHTML;

  var container = await db.projects.get(1);
  var project = container.object;
  var samples = Object.values(project.samples);
  var request = RequestOnPropertyValue(samples,"SAMPLE_LOCATION_BOX",boxName);

  var samplesName = [];

  for (var sample of request) {
    if (!samplesName.includes(sample.name)) {
      samplesName.push(sample.name);

    }
  }
  buildSimpleTable("StorageSamplesTable",samplesName);


}


function RequestOnPropertyValue(Objlist,propertyName,requestValue) {
  var request = [];
  for (var object of Objlist) {
    if (object.meta[propertyName].value == requestValue) {
      request.push(object);
    }
  }
  return request;

}



function LoadHolesInformation(array)
{ var samples = {};
  var holes = {};

  for (var i = 2 ; i < array.length; i++)
  {
    
    var holeName = findValue(array, 'HOLEID', i);
    var sampleName = findValue(array,'SAMPLING_POINT-NAME',i);

    if (Object.keys(samples).includes(sampleName)) {

      samples[sampleName].lines.push(array[i]);
    }
    else {
      var sample = new Sample(sampleName);
      sample.lines.push(array[i]);
      sample.meta = getValues(array,sample.meta,i);
      if  (Object.keys(holes).includes(holeName)) {

        if (!holes[holeName].samples.includes(sampleName) )
        {
          holes[holeName].samples.push(sampleName);
        }
        
      }
      else {
        var hole = new Drillhole(holeName);
        var meta = getValues(array,hole.meta,i);
        hole.meta = meta;
        hole.samples.push(sample);
        holes[holeName] = hole;
      }
      samples[sampleName] = sample;
    }

  }
  return [holes,samples];
}

function getValues(array, metaDict, i) {

  // deep copy to avoid to change the same object
  var meta = JSON.parse(JSON.stringify(metaDict));

  for (var colName of Object.keys(metaDict)) {
    let val = findValue(array,colName,i);
    meta[colName].value = val;
  }
  return meta;
}


async function displayHoleMetadata(event) {
  var cell = $(event.target);
  var holeid = cell[0].innerHTML;

  var container = await db.projects.get(1);
  var project = container.object;

  buildComplexTable("HoleMetadataTable",project.holes[holeid].meta);
  buildSimpleTable("SamplesTable",project.holes[holeid].samples, displaySampleMetadata);
}

async function displaySampleMetadata(event) {
  var container = await db.projects.get(1);
    var project = container.object;
  var cell = $(event.target);
  var sample = cell[0].innerHTML;
  buildComplexTable("SampleMetadataTable",project.samples[sample].meta);
  buildMultipleSelect(["LITHOLOGY","LITHOLOGY_2","LITHOLOGY_3"],lithology,3);
  buildMultipleSelect(["TEXTURE_STRUCTURE","TEXTURE_STRUCTURE_2"],texture,2);
  buildMultipleSelect(["ORE_TYPE","ORE_TYPE_2","ORE_TYPE_3"],gitology,3);
  buildMultipleSelect(["CHRONOSTRATIGRAPHIC_AGE","CHRONOSTRATIGRAPHIC_AGE_2",
  "CHRONOSTRATIGRAPHIC_AGE_3"],chronostratigraphic,3);
}


function clearTable(tableName) {
  var old_tbody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
  var new_tbody = document.createElement('tbody');
  old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
}

function buildSimpleTable(tableName,array,fonct) {

  clearTable(tableName);
  var fonction = fonct || 0; // if no fonction to link

  var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
  for (var value of array) {
      var row = tablebody.insertRow(-1);
  var cell1 = row.insertCell(0);
      cell1.innerHTML = value;
      if (fonction != 0) {
          cell1.addEventListener("click",fonction);
      }
  }
}


function buildComplexTable(tableName, dict) {

  clearTable(tableName);

  var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
  for (var key of Object.keys(dict)) {

      var row = tablebody.insertRow(-1);
      var cell1 = row.insertCell(0);
      var cell3 = row.insertCell(2);

      cell1.innerHTML = key;

      if (dict[key].htmlContent != 0) {
          cell3.innerHTML = dict[key].htmlContent;
      }
      else {
        const patternText1 = new String("[A-Za-z]+[-|_]+|[0-9]+");
        console.log("init",patternText1);
        console.log("pattern",dict[key].requiredPattern);
      cell3.innerHTML = '<input type="text" value="'+dict[key].value+'"placeholder="'+dict[key].placeholder+'" title="'+dict[key].description+'" class="TextInput" id="name" name="name" required minlength="1" maxlength="15" size="10" style="width: 100%" required pattern="'+dict[key].requiredPattern+'">';
      } 
  }
}

function BuildTableFromArray(tableName,array) {

  clearTable(tableName);
  var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];

  for (var line of array) {
      var row = tablebody.insertRow(-1);

      for (var i = 0; i < line.length; i++) {

        var cell = row.insertCell(i);
        cell.innerHTML = line[i];

      }
      
  }

}
