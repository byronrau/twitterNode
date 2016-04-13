angular.module('app.userShow', [])

.controller('userShowCtrl', function ($scope, $http) {
  $scope.user = '';
  $scope.userShow = function() {
    $http.post('/user', {
      'screen_name': $scope.screen_name
    }).then(function(resp) {
      $scope.user = resp.data;
    }, function(resp) {
      alert('error finding user');
    });
  };
});


