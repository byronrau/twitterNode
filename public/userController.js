angular.module('app.users', [])

.controller('UserController', function ($scope, $http, $location) {

  $scope.signIn = function() {
    $http.post('/signin', {
      'username': $scope.username,
      'password': $scope.password
    }).then(function(resp) {
      $location.path('/');
    }, function(resp) {
      alert('Invalid username or password');
      $scope.username = '';
      $scope.password = '';
      $location.path('/signin');
    });

  };
  $scope.signUp = function() {
    $http.post('/signup', {
      'username': $scope.username,
      'password': $scope.password
    }).then(function(resp) {
      $location.path('/#');
    });
  };

});


