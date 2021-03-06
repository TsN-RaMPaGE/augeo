
  /***************************************************************************/
  /* Augeo.io is a web application that uses Natural Language Processing to  */
  /* classify a user's internet activity into different 'skills'.            */
  /* Copyright (C) 2016 Brian Redd                                           */
  /*                                                                         */
  /* This program is free software: you can redistribute it and/or modify    */
  /* it under the terms of the GNU General Public License as published by    */
  /* the Free Software Foundation, either version 3 of the License, or       */
  /* (at your option) any later version.                                     */
  /*                                                                         */
  /* This program is distributed in the hope that it will be useful,         */
  /* but WITHOUT ANY WARRANTY; without even the implied warranty of          */
  /* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           */
  /* GNU General Public License for more details.                            */
  /*                                                                         */
  /* You should have received a copy of the GNU General Public License       */
  /* along with this program.  If not, see <http://www.gnu.org/licenses/>.   */
  /***************************************************************************/

  /***************************************************************************/
  /* Description: Unit test cases for api/twitter-api                        */
  /*              'getProfileDisplayData' requests                           */
  /***************************************************************************/

  // Required libraries
  var Assert = require('assert');
  var Request = require('supertest');
  var Should = require('should');

  // Required local modules
  var Common = require('../../common');

  module.exports = function(app) {

    var agent = Request.agent(app);

    // Invalid screen name in session
    it('should return status 401 - invalid screen name in session', function(done) {
      this.timeout(Common.TIMEOUT);

      agent
        .get('/twitter-api/getProfileDisplayData')
        .expect(401)
        .end(function(error, response) {
          Should.not.exist(error);
          done();
        });
    });

    // Valid screen name in session and invalid screenName parameter
    it('should return status 400 - valid screen name in session and invalid screenName parameter', function(done) {
      this.timeout(Common.TIMEOUT);

      // Login in user
      agent
        .post('/user-api/login')
        .send(Common.LOGIN_USER)
        .expect(200)
        .end(function(error0, response0) {
          Should.not.exist(error0);

          agent
            .get('/twitter-api/getProfileDisplayData?screenName=invalid')
            .expect(401)
            .end(function(error1, response1) {
              Should.not.exist(error1);
              Assert.strictEqual(response1.body.errorImageUrl, 'image/logo.png');
              done();
            });
        });
    });

    it('should return return 200 - valid screen name in session and valid screen name parameter', function(done) {
      this.timeout(Common.TIMEOUT);
      agent
        .get('/twitter-api/getProfileDisplayData?screenName=' + Common.USER.twitter.screenName)
        .expect(200)
        .end(function(error, response) {
          Should.not.exist(error);

          var profileData = response.body.profileData;
          Should.exist(profileData.profileImageUrl);
          Should.exist(profileData.skill);
          Should.exist(profileData.subSkills);
          Should.exist(profileData.circleRadius);

          done();
        });
    });

    it('should return return 200 - valid screen name in session and no screen name parameter', function(done) {
      this.timeout(Common.TIMEOUT);

      agent
        .get('/twitter-api/getProfileDisplayData')
        .expect(200)
        .end(function(error, response) {
          Should.not.exist(error);

          var profileData = response.body.profileData;
          Should.exist(profileData.profileImageUrl);
          Should.exist(profileData.skill);
          Should.exist(profileData.subSkills);
          Should.exist(profileData.circleRadius);

          done();
        });
    });

  };
