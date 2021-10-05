/**
 * class Dataset used to store a input file 
 */
export class Dataset{
    constructor(name,array,color,type){
        this.FILE_NAME = name; // String
        this.ARRAY = array; //Array[String]
        this.ISDISPLAYED  = true; //bool --> change if checkbox for file not checked
        this.TYPE = type; // String "Pointset" or "Surface" (and "Line" later)
        this.COLOR = color;
    }
}
/**
 * 
 * @param {*} variable String to test
 * @returns true is float else false
 */
export function isFloat(variable) {
    return !Number.isNaN(Number.parseFloat(variable));
}

/**
 * 
 * @param {*} arr 2d array
 * @param {*} columnName columnName as string
 * @returns 1D array containing column value
 */
 function extractColumn(arr, columnName) {
    return arr.map(x => x[columnName]);
}