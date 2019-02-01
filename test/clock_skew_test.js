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
    
define(['lib/clock_skew', 'chai'], function(clockSkewLib, chai) {
  describe('clock skew', function() {
    let expect, clockSkew, now = 0;
    beforeEach(function() {
      clockSkew = clockSkewLib({smear: 5000});
      expect = chai.expect;
      clockSkew.resetForTest();
      now = 0;
      clockSkew.enterTestingMode(() => now);
    });
    
    function advanceTime(opt_amount) {
      now += opt_amount || 1;
    };
    it('returns a 0 time until a reference is set', function() {
      expect(clockSkew.getTime()).to.equal(0);
      advanceTime();
      expect(clockSkew.getTime()).to.equal(0);
    });
    it('reports reference time if no time elapses', function() {
      advanceTime(10);
      clockSkew.adjustTimeByReference(10);
      expect(clockSkew.getTime()).to.equal(10);
    });
    it('smears any skew over 5 seconds', function() {
      clockSkew.adjustTimeByReference(0);
      clockSkew.adjustTimeByReference(1000);
      // Local time is still 0, reference is 1000.
      expect(clockSkew.getTime()).to.equal(0);
      advanceTime(1000);
      // Pretend a second has elapsed. Reference is still 1000, but that was a
      // whole second ago. Our local time is playing catchup, and is 1/5th of 
      // the way there.
      expect(clockSkew.getTime()).to.equal(1200);
      advanceTime(1000);
      // Another second, 2/5th.
      expect(clockSkew.getTime()).to.equal(2400);
      advanceTime(1000);
      // Another second, 3/5th.
      expect(clockSkew.getTime()).to.equal(3600);
      // But now, we sync with the server, and the server has sent a time of
      // 5000.
      clockSkew.adjustTimeByReference(5000);
      // Our clock should still report 3600
      expect(clockSkew.getTime()).to.equal(3600);
      // When we tick another 1000, our ideal skew is 1400, so we'll advance an
      // extra 1/5 of that = 280
      advanceTime(1000);
      expect(clockSkew.getTime()).to.equal(4880);
      advanceTime(1000);
      expect(clockSkew.getTime()).to.equal(6160);
      advanceTime(1000);
      expect(clockSkew.getTime()).to.equal(7440);
      advanceTime(1000);
      expect(clockSkew.getTime()).to.equal(8720);
      advanceTime(1000);
      expect(clockSkew.getTime()).to.equal(10000);
      // Holy camole! The server is WAY slower than us, and sent a time of 0.
      clockSkew.adjustTimeByReference(0);
      // We immediately fix our skew.
      expect(clockSkew.getTime()).to.equal(0);
      // When we advance, time goes forward again.
      advanceTime(1000);
      expect(clockSkew.getTime()).to.equal(1000);
      advanceTime(4000);
      expect(clockSkew.getTime()).to.equal(5000);
      // Until we are again in lockstep
      advanceTime(1000);
      expect(clockSkew.getTime()).to.equal(6000);
    });
    it('doesn\'t smear initial skew', function() {
      advanceTime(1000);
      clockSkew.adjustTimeByReference(2000);
      expect(clockSkew.getTime()).to.equal(2000);
      advanceTime(1000);
      // Lock step.
      expect(clockSkew.getTime()).to.equal(3000);
    });
  });
});
