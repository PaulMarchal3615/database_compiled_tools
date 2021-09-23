/**
 * class Dataset used to store a input file 
 */
export class Dataset{
    constructor(name,array, type){
        this.name = name; // String
        this.array = array; //Array[String]
        this.isDisplayed  = true; //bool --> change if checkbox for file not checked
        this.dict = {}; // dict containing array data  {"column_name":[colunn_values, ...]} 
        this.type = type; // String "Pointset" or "Surface" (and "Line" later)
        this.trace = {}; // Dict format for 2d display
        this.trace3d = {}; // Dict format for 3d display
        this.dataDensity = {}; // Dict format for 2D density display
        this.mapData = {};
    }

    /**
     * void : build Dataset.dict from Dataset.array
     */
    BuildDict() {
        for (var i=0; i<this.array[0].length; i++) {

            var column = extractColumn(this.array, i);
            for (var j = 0; j<column.length; j++) {
                if (isFloat(column[j])) {
                    column[j] = parseFloat(column[j]);
                }
            }
            this.dict[this.array[0][i]] = column;
            
        }
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
 * @param {*} column columnName as string
 * @returns 1D array containing column value
 */
 function extractColumn(arr, column) {
    return arr.map(x => x[column]);
}