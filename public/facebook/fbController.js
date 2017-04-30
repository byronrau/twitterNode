angular.module('app.fb', [])

.controller('fbCtrl', function ($scope, $http) {
  $scope.csvData = [];
  $scope.loading = false;


  $scope.getFBPage = function() {
    $scope.loading = true;

    //trim trailing slash
    // var strArr = $scope.fbPage.split('');
    if ($scope.fbPage.slice(-1) === '/') {
      $scope.fbPage = $scope.fbPage.split('').slice(0,-1).join('');
      // console.log($scope.fbPage);
    }
    $http.post('/fb', {
      'fbPage': $scope.fbPage,
      'until': $scope.until
    }).then(function(resp) {
      console.log(resp);
      $scope.posts = resp.data;
      formatCSV($scope.posts);
      $scope.loading = false;
    }, function(err) {
      try{
        alert('error getting page: ' + err.data.message);
      } catch(e) {
        console.log(e)
      }
      console.log(err)
      $scope.loading = false;
    });
  };

  var formatCSV = function(data) {
    //array of posts, with comments as array of objects, need to flatten
    //id, created_time, message, type(post/comment), name
    //id, created_time, message, type(post/comment), name
    $scope.csvData = [];
    data.forEach(function(currPost){
      var post = {}
      post.id = currPost.id;
      post.created_time = currPost.created_time;
      try {
        post.message = currPost.message;
      } catch (e) {
      }
      post.type = 'Post';
      post.name = 'Posted by Page';
      try {
        post.likes = currPost.likes.summary.total_count;
      } catch(e) {
      }
      if (currPost.hasOwnProperty('shares')) {
        post.shares = currPost.shares.count;
      } else {
        post.shares = 0
      }
      $scope.csvData.push(post);

      // console.log(currPost.message);

      currPost.comments.data.forEach(function(comment) {
        var comm = {};
        comm.id = comment.id;
        comm.created_time = comment.created_time;
        comm.message = comment.message;
        comm.type = 'Comment';
        comm.name = comment.from.name;
        comm.likes = comment.likes.summary.total_count;
        $scope.csvData.push(comm);
      });
    });
  };
});