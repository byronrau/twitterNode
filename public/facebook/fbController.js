angular.module('app.fb', [])

.controller('fbCtrl', function ($scope, $http) {
  $scope.getFBPage = function() {
    $http.post('/fb', {
      'fbPage': $scope.fbPage
    }).then(function(resp) {
      console.log(resp);
      $scope.posts = resp.data;
    }, function(resp) {
      alert('error getting page');
    });
  };
});