
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
  /* Description: Handles requests to Augeo's twitter-api                    */
  /***************************************************************************/

  // Required libraries
  var TwitterRouter = require('express').Router();

  // Required local modules
  var Logger = require('../module/logger');
  var TwitterInterfaceService = require('../interface-service/twitter-interface-service');
  var TwitterRestQueue = require('../queue/twitter-rest-queue');
  var TwitterService = require('../service/twitter-service');
  var TwitterStreamQueue = require('../queue/twitter-stream-queue');

  // Global variables
  var log = new Logger();
  var restQueue = new TwitterRestQueue();
  var streamQueue = new TwitterStreamQueue();

  /***************************************************************************/
  /* GET Requests                                                            */
  /***************************************************************************/

  TwitterRouter.get('/callback', function(request, response) {
    log.info('Creating Augeo user with Twitter data');

    var session = request.session;

    var rollback = function() {
      TwitterService.removeInvalidUser(session, function(){}); // Remove user from DB
      request.session.destroy(); // Destroy the session
      response.redirect(301, process.env.AUGEO_HOME + '/signup/error'); // Redirect to signup error page
    };

    // Get user's oauth secret token
    TwitterService.getUserSecretToken(session, function(oauthSecretToken) {

      TwitterInterfaceService.getOAuthAccessToken(request, oauthSecretToken, function(oauth_access_token, oauth_access_token_secret, screenName) {

        // Check if access token exists
        TwitterService.checkExistingAccessToken(oauth_access_token, function(accessTokenExists) {

          if(accessTokenExists === false) {

            // Initialize twitterMessenger
            var twitterMessenger = TwitterInterfaceService.createTwitterMessenger(oauth_access_token, oauth_access_token_secret);

            // Get user's Twitter information
            TwitterInterfaceService.getTwitterUser(twitterMessenger, screenName, function(userData) {

              userData.accessToken = oauth_access_token;
              userData.secretAccessToken = oauth_access_token_secret;

              if(TwitterService.isSessionUserDefined(request)) {

                // Update user's Twitter information
                TwitterService.updateTwitterInfo(request.session.user._id, userData, function() {

                  // Get queue data from user information
                  TwitterService.getQueueData(request.session.user._id, screenName, function(queueData) {

                    if(process.env.TEST != 'true') {

                      // Place user on tweet queue
                      restQueue.addUserToTweetQueue(queueData.tweetQueueData);

                      // Place user on mention queue
                      restQueue.addUserToMentionQueue(queueData.mentionQueueData);

                      if(process.env.ENV != 'local') {

                        // Connect to Twitter
                        TwitterService.connectToTwitter(restQueue, streamQueue, function() {});
                      }
                    }

                    // Set user's Twitter session data
                    request.session.user.twitter.screenName = screenName;

                    response.redirect(process.env.AUGEO_HOME + '/twitterHistory');
                  }, rollback);
                }, rollback); // End updateTwitterInfo
              } else {
                rollback();
              }
            }, rollback); // End getTwitterUser
          } else { // end accessTokenExists
            rollback();
          }
        }, rollback); // End checkExistingAccessToken
      }, rollback);
    }, rollback);
  });

  TwitterRouter.get('/getActivityDisplayData', function(request, response) {
    var isValid = false;

    var jsonResponse = {};
    if(TwitterService.isSessionScreenNameDefined(request)) {
      isValid = true;
      jsonResponse.screenName = request.session.user.twitter.screenName;
      jsonResponse.skills = TwitterService.getTwitterSkills();
    }

    if(isValid == false) {
      response.sendStatus(401);
    } else {
      response.status(200).send(jsonResponse);
    }
  });

  TwitterRouter.get('/getAuthenticationData', function(request, response) {

    var session = request.session;

    var rollback = function() {
      TwitterService.removeInvalidUser(session, function(){}); // Remove user from DB
      request.session.destroy(); // Destroy the session
      response.status(401).send('Signup Failed. Please try again.');
    };

    TwitterInterfaceService.getOAuthRequestToken(function(oauthToken, oauthTokenSecret) {
      TwitterService.addUserSecretToken(request.session, oauthTokenSecret, function() {
        response.status(200).send({token:oauthToken});
      }, rollback);
    }, rollback);
  });

  TwitterRouter.get('/getCompetitors', function(request, response) {
    var screenName = request.query.screenName;
    var startRank = request.query.startRank;
    var endRank = request.query.endRank;
    var skill = request.query.skill;

    var rollback = function() {
      response.sendStatus(400);
    };

    if(screenName) {
      TwitterService.getCompetitors(screenName, skill, function(users) {
        response.status(200).json(users);
      }, rollback);
    } else {
      TwitterService.getCompetitorsWithRank(startRank, endRank, skill, function(users) {
        response.status(200).json(users);
      }, rollback)
    }
  });

  TwitterRouter.get('/getLeaderboardDisplayData', function(request, response) {
    var isValid = false;

    // If user exists in session get leaderboard display data
    var jsonResponse = {};
    if(TwitterService.isSessionScreenNameDefined(request)) {
      isValid = true;

      TwitterService.getNumberUsers(function(numUsers) {

        jsonResponse.screenName = request.session.user.twitter.screenName;
        jsonResponse.skills = TwitterService.getTwitterSkills();
        jsonResponse.numberUsers = numUsers;
        response.status(200).json(jsonResponse);
      });
    }

    if(!isValid) {
      response.sendStatus(400);
    }
  });

  TwitterRouter.get('/getProfileDisplayData', function(request, response) {
    var inScreenName = request.query.screenName;

    var rollback = function() {
      response.sendStatus(401);
    };

    var targetScreenName;
    var userScreenName;
    if(inScreenName) {
      targetScreenName = inScreenName
    }
    if (TwitterService.isSessionScreenNameDefined(request)) { // If user exists in session get profile data
      userScreenName = request.session.user.twitter.screenName;

      TwitterService.getProfileDisplayData(userScreenName, targetScreenName, function(displayData) {

        if(displayData.errorImageUrl) {
          response.status(401).json(displayData);
        } else {
          response.status(200).json(displayData)
        }
      }, rollback);
    } else { // If the user doesn't exist in session respond with "Unauthorized" HTTP code
      rollback();
    }
  });

  TwitterRouter.get('/getSkillActivity', function(request, response) {
    var screenName = request.query.screenName;
    var skill = request.query.skill;
    var tweetId = request.query.tweetId;

    var rollback = function() {
      response.sendStatus(400);
    };

    TwitterService.getSkillActivity(screenName, skill, tweetId, function(newData) {
      response.status(200).json(newData);
    }, rollback);
  });

  TwitterRouter.get('/getTwitterHistoryPageData', function(request, response) {

    var rollback = function() {
      response.sendStatus(401);
    };

    // If user exists in session get profile data
    if(TwitterService.isSessionUserDefined(request)) {
      var userId = request.session.user._id;

      TwitterService.isMember(userId, function(isMember) {

        var pageData = {
          isMember: isMember,
          mentionWaitTime: '',
          tweetWaitTime: ''
        };

        if(isMember) {
          pageData.mentionWaitTime = restQueue.getUsersMentionWaitTime(userId);
          pageData.tweetWaitTime = restQueue.getUsersTweetWaitTime(userId);
        } else {
          pageData.mentionWaitTime = restQueue.getMentionsWaitTime();
          pageData.tweetWaitTime = restQueue.getTweetsWaitTime();
        }

        response.status(200).json(pageData);
      });
    } else { // If the user doesn't exist in session respond with "Unauthorized" HTTP code
      rollback();
    }
  });

  /***************************************************************************/
  /* POST Requests                                                           */
  /***************************************************************************/

  TwitterRouter.post('/setMember', function(request, response) {

    var jsonResponse = {};
    if(TwitterService.isSessionUserDefined(request)) {
      TwitterService.setMember(request.session.user._id, function(){
        response.sendStatus(200);
      });
    } else {
      response.sendStatus(401);
    }
  });

  module.exports = TwitterRouter;
