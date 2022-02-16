import {sampleMetadata} from './ressources.js';

export class Sample{
    constructor(name) {
        this.name = name; //String
        this.meta = sampleMetadata;
        this.lines = [];
    }
}    