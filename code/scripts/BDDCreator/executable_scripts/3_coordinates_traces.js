// simple script computing X,Y,Z coordinates for survey traces using collar and dip, dipdir
// we iterate on every hole referenced in database 
for (var hole of Object.keys(allMetadata.HOLES_TRACES)) {
    
    // we get all infos on the current sample in sampleInfo object
    var holeTraceInfo = allMetadata.HOLES_TRACES[hole];
    var holeCollarInfo = allMetadata.HOLES_METADATA[hole];

    var x = holeCollarInfo["HOLEID_X_NAD"].value;
    var y = holeCollarInfo["HOLEID_Y_NAD"].value;
    var z = holeCollarInfo["HOLEID_Z_NAD"].value;

    var previous = 0;
    var dip = holeTraceInfo[0]["DIP"];
    var dipDir = holeTraceInfo[0]["DIP_DIRECTION"];


    for (var depth of Object.keys(holeTraceInfo)) {

        var delta = depth - previous;

        x -= delta*m.cos(m.radians(90+dipDir))*m.sin(m.radians(90+dip));

        y += delta*m.sin(m.radians(90+dipDir))*m.sin(m.radians(90+dip));

        z -= delta*m.cos(m.radians(90+dip));

        holeTraceInfo[depth]["TRACE_X"] = x;
        holeTraceInfo[depth]["TRACE_Y"] = y;
        holeTraceInfo[depth]["TRACE_Z"] = z;
        var dip = holeTraceInfo[depth]["DIP"];
        var dipDir = holeTraceInfo[depth]["DIP_DIRECTION"];
        previous = depth;
    }
  

  allMetadata.HOLES_TRACES[hole] = holeTraceInfo;
}