/**
 * class to store load datasets and characteristics during session 
 */
export class Study{
    constructor() {
        this.datasets = {};
        this.filters = {};
        this.variables = [];
        this.drillholes = {};
    }
}

/**
 * void : add Dataset dataset to Study study
 * @param {*} study 
 * @param {*} dataset 
 */
export function addDataset(study,dataset){
    // add dataset to study if not in dict datasets
    var n = study.variables.includes(dataset);
    if (!n) {
        study.datasets[dataset.name] = dataset;
    }
    
}

/**
 * void : add string variable to study.variables if not in
 * @param {*} study Study object
 * @param {*} variable string
 */
export function addVariable(study,variable) {
        // add variable to study variable list if not in list
        var n = study.variables.includes(variable);
        if (!n) {
            study.variables.push(variable);
        }
        
    }

/**
 * void : add all variables of a dataset if not in study.variables
 * @param {*} study Study object
 */
export function fillStudyVariablesList(study){
        // fill study.variables with strings in header if not already in study.variables

        for (var key in study.datasets) {
            var dataset = study.datasets[key];
            for (var head in dataset.dict){
                addVariable(study,head);
            }
    }

}









