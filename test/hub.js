
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
  /* Description: File that is ran to execute test cases. Houses all test    */
  /*              cases.                                                     */
  /***************************************************************************/

  // Required local modules
  var App = require('../src/server');
  var Helper = require('./helper/db-helper');
  var Common = require('./test-case/common');

  function importTests(name, path, app) {
    describe(name, function () {
      if(app) {
        require(path)(app);
      } else {
        require(path);
      }
    });
  };

  describe('Utility', function() {
    importTests('augeoUtility', './test-case/utility/augeo-utility');
    importTests('twitterUtility', './test-case/utility/twitter-utility');
  });

  describe('Interface', function() {
    importTests('twitterTesttInterface', './test-case/interface/twitter-test-interface');
  });

  describe('Interface Service', function() {
    importTests('twitterInterfaceService', './test-case/interface-service/twitter-interface-service');
  });

  describe('Service', function() {
    importTests('userService', './test-case/service/user-service.js')
    importTests('twitterService', './test-case/service/twitter-service.js');

    after(function(done) {
      this.timeout(Common.TIMEOUT);
      Helper.cleanAugeoDB(function() {
        done();
      });
    });
  });

  describe('Queues', function() {

    // Add Twitter users to database
    beforeEach(function(done) {
      this.timeout(Common.TIMEOUT);
      Helper.addTestUsers(function() {
        done();
      });
    });

    importTests('twitterRestQueue', './test-case/queue/twitter-rest-queue.js');
    importTests('twitterStreamQueue', './test-case/queue/twitter-stream-queue.js');

    // Clean database
    afterEach(function(done) {
      this.timeout(Common.TIMEOUT);
      Helper.cleanAugeoDB(function(){
        done();
      });
    });
  });

  describe('User API', function() {
    importTests('Add User', './test-case/api/user-api/add-user');
    importTests('Login', './test-case/api/user-api/login');
    importTests('Session', './test-case/api/user-api/session');
    importTests('Remove User', './test-case/api/user-api/remove-user', App);
  });

  describe('Twitter API', function() {
    importTests('getAuthenticationData', './test-case/api/twitter-api/get-authentication-data', App);
    importTests('callback', './test-case/api/twitter-api/callback', App);
    importTests('getActivityDisplayData', './test-case/api/twitter-api/get-activity-display-data', App);
    importTests('getCompetitors', './test-case/api/twitter-api/get-competitors', App);
    importTests('getLeaderboardDisplayData', './test-case/api/twitter-api/get-leaderboard-display-data', App);
    importTests('getProfileDisplayData', './test-case/api/twitter-api/get-profile-display-data', App);
    importTests('getSkillActivity', './test-case/api/twitter-api/get-skill-activity', App);
    importTests('getTwitterHistoryPageData & setMember', './test-case/api/twitter-api/get-twitter-history-page-data', App);
  });

  describe('Twitter', function() {
    importTests('Twitter', './test-case/twitter/twitter');
  });
