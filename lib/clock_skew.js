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
    var testingMode = false;
    var nowForTesting = 0;
  
    function now() {
      return testingMode ? nowForTesting : window.performance.now();
    }
  
    var SMEAR_DURATION = config.smear !== undefined ? config.smear : 5000; // ms
  
    function lerp(a, b, alpha) {
      return (1-alpha) * a + alpha * b;
    }
  
  
    var currentSkew = 0;
    var skewAtLastReference = 0;
    // Returns current time, adjusted by reference time.
    var getTime = function() {
      if (lastReferenceUpdateInLocal == -1) {
        return 0.0;
      }
      // What skew should we report?
      // Well, if we are between lastReferenceUpdate and lastReferenceUpdate + 
      // SMEAR_DURATION, we need to lerp the skew. If we are beyond, we should
      // assume a skew of 0.
      var localNow = now();
      var alpha = Math.min(Math.max((localNow - lastReferenceUpdateInLocal) / SMEAR_DURATION, 0), 1.0);
      currentSkew = lerp(skewAtLastReference, mostRecentSkew, alpha);
    
      var timeToReport = localNow + currentSkew;
      return timeToReport;
    };

    // Updates internal model with new reference time. Smears skew over subsequent
    // updates.
    var mostRecentSkew = 0;
    var lastReferenceUpdateInLocal = -1;
  
    var adjustTimeByReference = function(referenceNow) {
      var localNow = now();
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
   
    return {
      getTime: getTime,
      adjustTimeByReference: adjustTimeByReference,
      resetForTest: function() {
        currentSkew = 0;
        skewAtLastReference = 0;
        mostRecentSkew = 0;
        lastReferenceUpdateInLocal = -1;
      },
      enterTestingMode: function() {
        testingMode = true;
      },
      getNowForTesting: function() {
        if (!testingMode) {
          throw new Error('Can\'t get now when not in testing mode!');
        }
        return nowForTesting;
      },
      setNow: function(t) {
        if (!testingMode) {
          throw new Error('Can\'t set now when not in testing mode!');
        }
        nowForTesting = t;
      }
    };
  };
});
