
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
  /* Description: Controller for the application                             */
  /***************************************************************************/

  augeo.controller('AppController', function($scope, $state, UserClientService) {

    $scope.$on('$stateChangeStart',
      function(event, toState, toParams, fromState, fromParams){

        UserClientService.getCurrentUser(function(user, status) {

          if(toState.name != 'logout') {
            if(user.firstName) {
              $scope.myStyle = 'iniitial';
            } else {
              $scope.myStyle = 'hidden';
            }
          } else {
            $scope.myStyle = 'hidden';
          }
        });
      });

      $scope.removeErrorMessage = '';
      $scope.removeUser = function(password) {
        UserClientService.removeUser(password, function(data, status) {
          if(status == 200) {
            $state.go('logout');
            $('#delete-modal').modal('toggle');
          } else {
            $scope.removeErrorMessage = data;
          }
        });
      };
  });
