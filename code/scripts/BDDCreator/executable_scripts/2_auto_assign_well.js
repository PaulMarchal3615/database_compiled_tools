// simple script filling the HOLEID property and DEPTH using parsing on SAMPLE_NAME
// we iterate on every sample referenced in database 
for (var sample of Object.keys(allMetadata.SAMPLES_METADATA)) {
  
  // we get all infos on the current sample in sampleInfo object
  var sampleInfo = allMetadata.SAMPLES_METADATA[sample];
  var infos = sampleInfo["SAMPLE_NAME"].value.split('-');
  
  var holeList = Object.keys(allMetadata.HOLES_METADATA);
  
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