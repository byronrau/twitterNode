var app = angular.module('nodeTwitter', ['ui.router', 'ngSanitize', 'ngCsv', 'app.users', 'app.services', 'app.search', 'app.stream','app.userShow', 'app.fb']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('signin', {
      url: '/signin',
      templateUrl: '/user/signin.html',
      controller: 'UserController'
    })
    .state('signup', {
      url: '/signup',
      templateUrl: '/user/signup.html',
      controller: 'UserController'
    })
    .state('app', {
      url: '/',
      templateUrl: '/app/app.html',
      controller: 'ntCtrl',
      authenticate: true
    })
    .state('search', {
      url: '/search',
      templateUrl: '/search/search.html',
      controller: 'searchCtrl',
      authenticate: true
    })
    .state('stream', {
      url: '/stream',
      templateUrl: '/stream/stream.html',
      controller: 'streamCtrl',
      authenticate: true
    })
    .state('usershow', {
      url: '/usershow',
      templateUrl: '/userShow/userShow.html',
      controller: 'userShowCtrl',
      authenticate: true
    })
    .state('facebook', {
      url: '/facebook',
      templateUrl: '/facebook/facebook.html',
      controller: 'fbCtrl'
      // authenticate: true
    })
  $urlRouterProvider.otherwise('/signin');
});

app.run(function ($rootScope, $state, Auth) {
  $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
    if (toState.authenticate && !Auth.checkLoggedIn()){
      // User isn’t authenticated
      $state.transitionTo("signin");
      event.preventDefault();
    }
  });
});

app.controller('ntCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.results = [];
  $scope.loading = false;
  $scope.sortType = '';
  $scope.sortReverse = false;

  $scope.clear = function() {
    $scope.results = [];
  };


  $scope.timeline = function() {
    $scope.loading = true;
    $http.post('/timeline', {
      'searchTerm': $scope.searchTerm,
      'max_id': $scope.max_id
    }).then(function(resp) {
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
      $scope.results = tempArr;
    }, function(err){
      alert('Error getting data, please try again.')
      $scope.loading = false;
    });
  }

}]);