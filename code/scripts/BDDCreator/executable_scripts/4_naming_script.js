// simple script filling the SAMPLING_POINT-NAME property with HOLEID and SAMPLE_DEPTH_FROM
// we iterate on every sample referenced in database 



for (var sample of Object.keys(allMetadata.SAMPLES_METADATA)) {
    
        // we get all infos on the current sample in sampleInfo object
        var sampleInfo = allMetadata.SAMPLES_METADATA[sample]; 
    
        // we get holeid and depth as string 
        var holeid = sampleInfo["HOLEID"].value;
        var depth = sampleInfo["SAMPLE_DEPTH_FROM"].value;

        console.log(holeid, depth);
    
        // we format as we desire the text
        holeid  = holeid.replaceAll("_","");
        holeid = holeid.replaceAll('WC','WC-');
        depth = depth.replaceAll(".","-");
       depth = depth.replaceAll(",","-");
    
        // we fill the SAMPLING_POINT-NAME property ! string must be stored in Object.value
        sampleInfo["SAMPLING_POINT-NAME"].value = holeid+"--"+depth;
        allMetadata.SAMPLES_METADATA[sample] = sampleInfo;
    
    }



