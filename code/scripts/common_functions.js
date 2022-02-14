/**
 * 
 * @param {*} headers array of string column names
 * @param {*} rows 2D array of lines 
 * @returns array of Obj (1 by line of rows) with headers[el] as key
 */
export function rowsToObjects(headers, rows){
	return rows.reduce((acc, e, idx) =>  {
	   acc.push(headers.reduce((r, h, i)=> {r[h] = e[i]; return r; }, {}))
	   return acc;
	}, []);
}


/**
 * 
 * @returns random color value in hexadecimal
 */
export function rndHex(){return'#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);}


/**
 * 
 * @param {*} colName : column name string we want to extract
 * @param {*} array : 2D array
 * @returns array[] --> extract column from 2D array based on its name
 */
export function getColumn(colName,  array) {

    var indice; 

    for (var i=0;i<array[0].length;i++) {
        if (array[0][i] == colName) {
            indice =  i;
            break;
        }
    }
    return array.map(x => x[indice]);
}


/**
 * 
 * @param {*} variable string to test
 * @returns boolean true if variable is number stored in string 
 */
 export function isFloat(variable) {
    return !Number.isNaN(Number.parseFloat(variable));
}

// --------------------------------------------- 

 /**
  * 
  * @param {*} number float number
  * @returns random value
  */
  export function random(number) {
	return Math.floor(Math.random() * (number+1));
}