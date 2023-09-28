proj4.defs([
    ['EPSG:4326','+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
    ['EPSG:2151','+proj=utm +zone=13 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'],
    ['EPSG:2152','+proj=utm +zone=12 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs']
]);
  
var NAD83_Z13_Projection = proj4('EPSG:2151');
var NAD83_Z12_Projection = proj4('EPSG:2152');
var WGS84_Projection = proj4('EPSG:4326');
var RGNC9193_Projection = proj4('EPSG:3163');

console.log(proj4(NAD83_Z13_Projection,WGS84_Projection).inverse([-104.5419199,58.07132686]));
// [242075.00535055372, 750123.32090043]
console.log(proj4(NAD83_Z13_Projection,WGS84_Projection).forward([527023.6,6436742]));

WGStoNAD83(RGNC9193_Projection, WGS84_Projection)

function WGStoNAD83(in_coord, out_coord) {

    for (var sample of Object.keys(allMetadata.SAMPLES_METADATA)) {
        // do something on sample object 
        var sampleInfo = allMetadata.SAMPLES_METADATA[sample]; 
        // ie you can change sample["HOLEID"] 
    
        var latitude = parseFloat(sampleInfo["SAMPLING_POINT-LATITUDE"]);
        var longitude = parseFloat(sampleInfo["SAMPLING_POINT-LONGITUDE"]);
    
        var X_NAD, Y_NAD = proj4(i_coord,out_coord).inverse([longitude, latitude]);
        sampleInfo["X_NAD"].value = X_NAD;
        sampleInfo["Y_NAD"].value = Y_NAD;
    }

}
