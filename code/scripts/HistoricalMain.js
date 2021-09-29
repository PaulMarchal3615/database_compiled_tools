// init Dexie database to store files

var db = new Dexie("database");


db.version(1).stores({
  files:`name,
  object,
  arrays,
  ext,
  test1,
  test2,
  test3`
  });


  // filter configuration for file filtering
var filtersConfig = {
    // instruct TableFilter location to import ressources from
    base_path: 'https://unpkg.com/tablefilter@latest/dist/tablefilter/',
    col_1: 'select',
    col_2: 'select',
    col_3: 'select',
    col_4: 'select',
    alternate_rows: true,
    rows_counter: true,
    btn_reset: true,
    loader: true,
    mark_active_columns: true,
    highlight_keywords: true,
    no_results_message: true,
    col_types: [
      'string', 'string', 'boolean',
      'boolean', 'boolean'],

    extensions: [{
      name: 'sort',
      images_path: 'https://unpkg.com/tablefilter@latest/dist/tablefilter/style/themes/'
    }]
  };


  // folder input 
var input = document.querySelector('#folderInput');


// folder input is hidden behind a pushbutton
var btn1 = document.getElementById("chooseFolder");
btn1.addEventListener('click', function() {input.click();});

input.addEventListener('input',LoadFiles);

// second input : text input for Sample Name example
var input2 = document.querySelector('#SampleName');
input2.addEventListener('input',parseName);

/**
 * convert text input (input 2 #Sample Name) into Format string (A stands for Alphabetical X for Number)
 * and display it into #parseExample
 */
function parseName() {
    var format = convertStringToFormat(input2.value);
    document.getElementById('parseExample').value = format;
}
/**
 * convert  String into format String
 * @param {*} string 
 * @returns format String A for alphabetical; X for number; '.' ',' is '.'; -/_ is -; everything else *
 */
function convertStringToFormat(string) {
    var format = "";
    var special = ['&','#','$','@','*','é','+']
    for (var ch of string) {
        if (isNumeric(ch)) {
            format += 'X';
        }
        else if ((ch =='-') ||(ch =='_')){
            format += '-';
        }
        else if ((ch =='.') || (ch ==',')){
            format += '.';
        }
        else if (special.includes(ch)){
            format += '*';
        }
        else {
            format += 'A';
        }
        
    }
    return format;
}

/**
 * 
 * @param {*} s String
 * @returns bool; true if s is numeric
 */
function isNumeric(s) {
    return !isNaN(s - parseFloat(s));
}

/**
 * update loading bar using int i 
 * @param {*} i 
 */
function move(i) {
  if (i == 0) {
    i = 1;
    var elem = document.getElementById("myBar");
    var width = 1;
    var id = setInterval(frame, 10);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
        i = 0;
      } else {
        width++;
        elem.style.width = width + "%";
      }
    }
  }
} 

/**
 * called on "Choose a folder" button --> load all files in selected folder and subdirs
 * Store all Spreadsheets files (xlsx, xls, xlsm, csv)
 * Display files in table
 */
async function LoadFiles() {
    var tableFiles = [];
    let files = input.files;

  
    var i = 0;
    for (var file of files) {
        move(i/files.length*100);
        var extension =file.name.split('.').pop();
        if ((extension =='csv') ||(extension =='xls') || (extension =='xlsx') || (extension =='xlsm') || (extension =='CSV')) {
            db.files.bulkPut([{ name: file.name, object: file,arrays:{}, ext:extension}]);
            tableFiles.push([file.name, extension, '', '', '']);
        }
        
        i+=1;
        
    }
    //const all = await db.files.toArray();
    BuildTableFromArray("FileTable", tableFiles);
}

var buttonTest1 = document.getElementById("launchTest1");
buttonTest1.addEventListener("click",openTest);


/**
 * First test : test if file is openable 
 * if openable store all pages as {pageName : {property:array, ...}, ...}
 */
async function openTest() {
    var tableFiles = [];
    var FileArray = {};

    const files  = await db.files
    .where('ext').anyOf('csv', 'xlsx', 'xls','xlsm','CSV')
    .toArray();

    var j = 0;

    //console.log(files);

    if (files.length == 0) {
        alert("No files detected !");
    }

    for (var file of files) {
        move(j/files.length*100);
        console.log("Found: " + file.name + ". extension: " + file.ext);
        var content = parseFile(file.object, file.ext);
        console.log(content);
        if (content instanceof Error) {

            tableFiles.push([file.name,file.ext, 'Failed', '', '']);
            FileArray[file]= None;

        }
        else {
            tableFiles.push([file.name, file.ext, 'Passed', '', '']);
            FileArray[file] = content;

        }
        j+=1;
        
    }

    for (var file of Object.keys(FileArray)) {
        db.files.update(file.name, {name:file.name, arrays: FileArray[file],ext:file.ext,object:file}).then(function (updated) {
            if (updated)
              console.log ("updated");
            else
              console.log ("Nothing was updated");
          });
    }


    BuildTableFromArray("FileTable", tableFiles, displaySelectedFile);
    var tf = new TableFilter('FileTable', filtersConfig);
    tf.init();
    console.log('Test 1 : Done');

}


function parseFile(file, extension) {
    var arrays = {};

    if ((extension =='csv') ||(extension =='CSV')) {
        var value = csvToJson(file);
        if  (value instanceof Error) {
            return value;
        }
        else {
            arrays[file.name] = csvToJson(file);
            return arrays;
        }
        
    }

    else if ((extension ='xlsx')||(extension ='xls')||(extension ='xlsm')){
        
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var workbook = XLSX.read(reader.result, {
                    type: 'binary'
                });
            } catch (err) {
                //alert("Something is wrong with this xlsx file");
                return new Error(err);
            }
            var sheetNames = workbook.SheetNames;

            for (var sheetName of sheetNames) {
                arrays[sheetName] = xlsxToJson(workbook, sheetName);
            }
            console.log(arrays);
            return arrays;
        }

        reader.onerror = function(err) {

            return new Error(err);
        };

        reader.readAsBinaryString(file);
    }
    else {
        return new Error('no csv');			
    }
}

function xlsxToJson(workbook, sheetName) {
    var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    var results = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    });
    if (results.errors.length != 0) {
        //alert("Something doesn't work with this file");
        return new Error(results.error);
    }
    return (results.data);
}

function csvToJson(csv) {

    Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
            console.log(results);
            if ((results.errors.length != 0)) {
                //alert("Something doesn't work with this file");
        
                return new Error(results.error);
            }
            return (results.data);
        }
    });


}

async function displaySelectedFile(event) {
    var cell = $(event.target);
    var fileName = cell[0].innerHTML;

    var container = await db.files.get(fileName);
    console.log(container);
    var contentPages = container.arrays;
    console.log(contentPages);

    if (contentPages.length >0) {
        BuildTableFromArray("SelectedFileTable",Object.values(contentPages)[0]);
        console.log(fileName);
    }
    

}

function clearTable(tableName) {
    var old_tbody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
    var new_tbody = document.createElement('tbody');
    old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
}

function BuildTableFromArray(tableName,array,fonct) {

    clearTable(tableName);
    var tablebody = document.getElementById(tableName).getElementsByTagName('tbody')[0];
    var fonction = fonct || 0;
  
    for (var line of array) {
        
        var row = tablebody.insertRow(-1);
  
        for (var i = 0; i < line.length; i++) {
  
          var cell = row.insertCell(i);
          if ((i ==0) & (fonction != 0)) {
              cell.addEventListener('click',fonction);
          }


          cell.innerHTML = line[i];
            if (line[i] == 'Not Tested'){
                cell.style.backgroundColor = 'rgb(247,220,111)';
            }
            if (line[i] == 'Failed'){
                cell.style.backgroundColor = 'rgb(241, 148, 138 )';
            } 
            if (line[i] == 'Passed'){
                cell.style.backgroundColor = 'rgb(171,235,198)';
            }
        }
    }
}
