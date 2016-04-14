angular.module('app.services',[])
.factory('Auth', function($http, $location, $rootScope){
  var auth = {};
  auth.checkLoggedIn = function() {
    return $http.get('/loggedin').then(function(user) {
      if (user) {
        $rootScope.user = user;
      }
    }, function(err) {
      console.log('error authentcating user', err);
      $location.path('/signin');
    });
  };
  return auth;
})
.factory('socket', function($rootScope){
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
})