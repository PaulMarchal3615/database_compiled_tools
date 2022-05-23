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

    var indice = getColumnIndice(colName, array);
    return array.map(x => x[indice]);
}


export function getColumnIndice(colName, array) {

    var indice; 

    for (var i=0;i<array[0].length;i++) {
        if (array[0][i] == colName) {
            indice =  i;
            break;
        }
    }

    return indice;

}


/**
 * 
 * @param {*} variable string to test
 * @returns boolean true if variable is number stored in string 
 */
 export function isFloat(variable) {
    return !Number.isNaN(Number.parseFloat(variable));
}

 /**
  * 
  * @param {*} number float number
  * @returns random value
  */
  export function random(number) {
	return Math.floor(Math.random() * (number+1));
}

/**
 * 
 * @param {*} arr : array[string/float]
 * @param {*} val : val to find
 * @returns [indexes] of val in arr
 */
export function getAllIndexes(arr, val) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

/**
 * 
 * @param {*} object : dict structure object
 * @param {*} value : string/float
 * @returns key in dict based on value 
 */
 export function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}