angular.module('app.search', [])

// Auth is a factory/service from app.services
.controller('searchCtrl', function ($scope, $http, $location) {
  $scope.results = [];
  $scope.loading = false;
  $scope.sortType = '';
  $scope.sortReverse = false;
  $scope.search = function() {
    $scope.loading = true;
    $http.post('/search', {
      'searchTerm': $scope.searchTerm,
      'maxId': $scope.maxId
    }).then(function(resp) {
      $scope.loading = false;
      console.log(resp);
      var tempArr = [];
      resp.data.forEach(function(tweet){
        var extract = {};
        extract.created_at = new Date(tweet.created_at);
        extract.id = tweet.id;
        extract.text = tweet.text;
        extract.username = tweet.user.screen_name;
        extract.favorite_count = tweet.favorite_count;
        extract.favorited = tweet.favorited;
        extract.retweet_count = tweet.retweet_count;
        extract.retweeted = tweet.retweeted;
        tempArr.push(extract);
      });
      $scope.results = $scope.results.concat(tempArr);
      console.log($scope.results);
    }, function(err){
      alert('Error getting data, please try again.')
      $scope.loading = false;
    });
  }
})
