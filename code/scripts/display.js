var db = new Dexie("database");

db.version(1).stores({
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


/**
 * bool : returns false if tested value is in the options of a select
 * @param {*} value tested string value
 * @returns 
 */
 HTMLSelectElement.prototype.contains = function( value ) {

    for ( var i = 0, l = this.options.length; i < l; i++ ) {

        if ( this.options[i].label == value ) {
            return true;
        }
    }
    return false;
}

function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
       selectElement.remove(i);
    }
 }


/**
 * void : update a combobox with an Array
 * @param {*} selectName String containing combobox name to update
 * @param {*} list Array of string value to put in the combobox
 */
 export function updateSelect(selectName, list) {

    removeOptions(document.getElementById(selectName));
	let select = document.getElementById(selectName);
    var i =0;

    for (var name of list) {
        i++;

        if (!select.contains(name)) {
            var option = new Option(name,i);
            select.options[select.options.length] = option;
        }
    }
}

export function buildMultipleSelect(NameList, propertydict, level) {

    let select = document.getElementById(NameList[0]);

    updateSelect(NameList[0],Object.keys(propertydict));

    select.addEventListener("change", function() {

        let select2 = document.getElementById(NameList[1]);
        let label = select.options[document.getElementById(NameList[0]).selectedIndex].label;

        if (label != "SELECT A "+NameList[0]) {
        
            if (Object.keys( propertydict[label]).length >0) {

                if (level == 2) {
                    
                    updateSelect(NameList[1],propertydict[label]);
                }

                if (level == 3) {

                updateSelect(NameList[1],Object.keys(propertydict[label]));

                select2.addEventListener("change", function() {

                    let subdict =  propertydict[document.getElementById(NameList[0]).options[document.getElementById(NameList[0]).selectedIndex].label];
                    let subsublist = subdict[document.getElementById(NameList[1]).options[document.getElementById(NameList[1]).selectedIndex].label];
                    if (subsublist.length >0) {
                        updateSelect(NameList[2],subsublist);
                    }
                    
                });

                }
        }
    }

    });

}


/**
 * 
 * @param SelectName
 * @param sample 
 */
 export function initselect(SelectName, value) {
    let select = document.getElementById(SelectName);

    const options = Array.from(select.options);
    options.forEach((option, i) => {

        if (option.text === value) {
            select.selectedIndex = i;
            select.dispatchEvent(new Event('change'));
        }
    });
}

export function fillSelect(id,array,cell,value) {

    //Create and append select list

    var testData = !!document.getElementById(id);
    let select = 0;

    if (testData) {
        select = document.getElementById(id);
    }
    else {

        select = document.createElement("select");
        select.id = id;
    } 

    //Create and append the options
    for (var i = 0; i < array.length; i++) {
        var option = document.createElement("option");
        option.value = array[i];
        option.text = array[i];
        select.appendChild(option);
    }

    const options = Array.from(select.options);
    options.forEach((option, i) => {
    if (option.value === value) select.selectedIndex = i;
    });
    
    cell.appendChild(select);  
}

export function findColumnIndice(colName,  array) {
    for (var i=0;i<array[0].length;i++) {
        if (array[0][i] == colName) {
            return i;
        }
    }
}

/**
 * 
 * @param {*} array : 2d array
 * @param {*} colName String column name
 * @param {*} i line number
 * @returns 
 */
export function findValue(array,colName, i) {
    for (var j = 0; j<array[0].length; j++) {
        if (array[0][j] == colName) {
            if (array.length > i) {
                return array[i][j];
            }  
        }
    }
}









