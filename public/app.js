var app = angular.module('nodeTwitter', ['ui.router', 'ngSanitize', 'ngCsv']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('app', {
      url: '/',
      templateUrl: 'app.html',
      controller: 'ntCtrl'
    })

  $urlRouterProvider.otherwise('/');
});

app.controller('ntCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.results = [];
  $scope.loading = false;
  $scope.sortType = '';
  $scope.sortReverse = false;
  $scope.search = function() {

    console.log($scope.searchTerm)
    $scope.loading = true;
    $http.post('/search', {
      'searchTerm': $scope.searchTerm,
      'max_id': $scope.max_id
    }).then(function(resp) {
      console.log(resp.data);
      $scope.loading = false;
      var tempArr = [];
      resp.data.forEach(function(currItem){
        var extract = {};
        extract.created_at = new Date(currItem.created_at);
        extract.id = currItem.id;
        extract.text = currItem.text;
        extract.username = currItem.user.screen_name;
        extract.favorite_count = currItem.favorite_count;
        extract.favorited = currItem.favorited;
        extract.retweet_count = currItem.retweet_count;
        extract.retweeted = currItem.retweeted;
        tempArr.push(extract);
      });
      $scope.results = $scope.results.concat(tempArr);
    }, function(err){
      alert('Error getting data, please try again.')
      $scope.loading = false;
    });
  }
  $scope.download = function(){

  }
}]);