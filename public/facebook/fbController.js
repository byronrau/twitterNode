angular.module('app.fb', [])

.controller('fbCtrl', function ($scope, $http) {
  $scope.csvData = [];
  $scope.loading = false;

  $scope.getFBPage = function() {
    $scope.loading = true;
    $http.post('/fb', {
      'fbPage': $scope.fbPage,
      'until': $scope.until
    }).then(function(resp) {
      console.log(resp);
      $scope.posts = resp.data;
      formatCSV($scope.posts);
      $scope.loading = false;
    }, function(err) {
      alert('error getting page');
      console.log(err)
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
      post.message = currPost.message;
      post.type = 'Post';
      post.name = 'Posted by Page';
      $scope.csvData.push(post);

      // console.log(currPost.message);

      currPost.comments.forEach(function(comment) {
        var comm = {};
        comm.id = comment.id;
        comm.created_time = comment.created_time;
        comm.message = comment.message;
        comm.type = 'Comment';
        comm.name = comment.from.name;
        $scope.csvData.push(comm);
      });
    });
  };
});