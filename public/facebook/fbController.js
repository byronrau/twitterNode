angular.module('app.fb', [])

.controller('fbCtrl', function ($scope, $http) {
  $scope.csvData = [];

  $scope.getFBPage = function() {
    $http.post('/fb', {
      'fbPage': $scope.fbPage
    }).then(function(resp) {
      console.log(resp);
      $scope.posts = resp.data;
      formatCSV($scope.posts);
    }, function(resp) {
      alert('error getting page');
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