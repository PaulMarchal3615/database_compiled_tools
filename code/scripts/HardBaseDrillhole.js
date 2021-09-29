import {holeMetadata} from './ressources.js';

export class Drillhole{
    constructor(name) {
        this.name = name; //string
        this.meta = holeMetadata; //dict of metadata at drillhole scale
        this.samples = []; // string sample list 
    }

}