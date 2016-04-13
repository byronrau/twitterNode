angular.module('app.stream', ['app.services'])

.controller('streamCtrl', function ($scope, $http, $location, socket) {

  $scope.results = [];
  $scope.loading = false;
  $scope.sortType = '';
  $scope.sortReverse = false;

  socket.on('tweetStream', function(tweet){
    console.log('received', tweet);
    var extract = {};
    extract.created_at = new Date(tweet.created_at);
    extract.id = tweet.id;
    extract.text = tweet.text;
    extract.username = tweet.user.screen_name;
    extract.favorite_count = tweet.favorite_count;
    extract.favorited = tweet.favorited;
    extract.retweet_count = tweet.retweet_count;
    extract.retweeted = tweet.retweeted;
    console.log($scope.results.length);
    $scope.results.unshift(extract);
  });

  $scope.stream = function() {
    $scope.results = [];
    $scope.loading = true;
    $http.post('/streams', {
      'searchTerm': $scope.searchTerm
    }).then(function(resp) {
      console.log('socket',socket);
      $scope.loading = false;
    }, function(err){
      alert('Error getting data, please try again.')
      $scope.loading = false;
    });
  }
})
