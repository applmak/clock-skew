// Copyright 2014 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
    
define([], function() {
  return function(config) {
    let now = () => {
      return window.performance.now();
    };
  
    const SMEAR_DURATION = config.smear !== undefined ? config.smear : 5000; // ms
  
    function lerp(a, b, alpha) {
      return (1-alpha) * a + alpha * b;
    }
  
  
    let currentSkew = 0;
    let skewAtLastReference = 0;
    // Returns current time, adjusted by reference time.
    const getTime = function() {
      if (lastReferenceUpdateInLocal == -1) {
        return 0.0;
      }
      // What skew should we report?
      // Well, if we are between lastReferenceUpdate and lastReferenceUpdate + 
      // SMEAR_DURATION, we need to lerp the skew. If we are beyond, we should
      // assume a skew of 0.
      const localNow = now();
      const alpha = Math.min(Math.max((localNow - lastReferenceUpdateInLocal) / SMEAR_DURATION, 0), 1.0);
      currentSkew = lerp(skewAtLastReference, mostRecentSkew, alpha);
    
      return localNow + currentSkew;
    };

    // Updates internal model with new reference time. Smears skew over subsequent
    // updates.
    let mostRecentSkew = 0;
    let lastReferenceUpdateInLocal = -1;
  
    const adjustTimeByReference = function(referenceNow) {
      const localNow = now();
      mostRecentSkew = referenceNow - localNow;
      
      // If skew is older than smear amount, just jump.
      if (mostRecentSkew < -SMEAR_DURATION) {
        currentSkew = mostRecentSkew;
      } else {
        if (lastReferenceUpdateInLocal == -1) {
          // Initialize skew.
          currentSkew = mostRecentSkew;
        }
      }
      lastReferenceUpdateInLocal = localNow;
      skewAtLastReference = currentSkew;
    };
   
    const originalNow = now;
    return {
      getTime,
      adjustTimeByReference,
      resetForTest: function() {
        currentSkew = 0;
        skewAtLastReference = 0;
        mostRecentSkew = 0;
        lastReferenceUpdateInLocal = -1;
        now = originalNow;
      },
      enterTestingMode: function(fakeNow) {
        now = fakeNow;
      },
    };
  };
});
