/**
 * class Drillhole used to store subpointsets by ddh for ddh view display
 */
export class Drillhole{
    constructor(name) {
        this.name = name; //String 
        this.pointset = {}; // Dict of samples : {} not used yet
        this.trace = {}; // not used yet
    }

}

/**
 * class Sample used in Study.drillholes dict : {ddh:[Sample,...,Sample],..., ddh:[...]}
 */
export class Sample {
    constructor(name, depth, ddh, dataset) {
        this.name = name;//String 
        this.depth = depth; //float
        this.ddh = ddh; //String
        this.dataset = dataset;
    }
}