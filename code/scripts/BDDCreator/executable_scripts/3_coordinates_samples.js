// simple script filling the HOLEID property and DEPTH using parsing on SAMPLE_NAME
// we iterate on every sample referenced in database 
for (var sample of Object.keys(allMetadata.SAMPLES_METADATA)) {
    
    // we get all infos on the current sample in sampleInfo object
    var sampleInfo = allMetadata.SAMPLES_METADATA[sample];
    
    var depth = sampleInfo["SAMPLE_DEPTH_FROM"];
    var hole = sampleInfo["HOLEID"];

    var trace = allMetadata.HOLES_TRACES[hole];

    if (typeof trace !== 'undefined') {

        var depthList = Object.keys(trace);

        var top = findTopValues(depthList, depth);
        var btm = findBottomValue(depthList, depth);
    
        var topInfo = trace[top];
        var btmInfo = trace[btm];
    
        var ratio = 1 - (btmInfo['DEPTH'] - depth)/ (btmInfo['DEPTH'] - topInfo['DEPTH']);
    
        sampleInfo['X_NAD'] = topInfo['TRACE_X'] + (btmInfo['TRACE_X'] - topInfo['TRACE_X'])*ratio;
        sampleInfo['Y_NAD'] = topInfo['TRACE_Y'] + (btmInfo['TRACE_Y'] - topInfo['TRACE_Y'])*ratio;
        sampleInfo['Z_NAD'] = topInfo['TRACE_Z'] + (btmInfo['TRACE_Z'] - topInfo['TRACE_Z'])*ratio;

    }

    
    
    allMetadata.SAMPLES_METADATA[sample] = sampleInfo;
}