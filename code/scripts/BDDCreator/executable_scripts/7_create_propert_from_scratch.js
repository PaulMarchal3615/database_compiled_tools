for (var sample of Object.keys(allMetadata.SAMPLES_METADATA)) {

    
    var max = 0;
    var closest = null;
    
    for (var hole of holeList) {
  
      var dist = JaroWrinker(hole, infos[0]);

      if (dist > max) {
        
        max = dist;
        closest = hole;
        if (dist ==1) {
            break;
        }
      }
    }
  
    sampleInfo["HOLEID"].value = closest;
    sampleInfo["SAMPLE_DEPTH_FROM"].value = infos[1];
  
    allMetadata.SAMPLES_METADATA[sample] = sampleInfo;
  }