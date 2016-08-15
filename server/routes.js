var passport = require('passport');
var User = require('./userModel.js');
var controller = require('./controller.js')
var graph = require('fbgraph');

var conf = {
  client_id: '315720118774609',
  client_secret: 'c4cad02829ff4a9ac6f8d79454059cfe',
  scope: 'email, public_profile, user_friends',
  redirect_uri: 'http://localhost:9000/auth/facebook'
};


module.exports =  function(app, express, io) {
  app.post('/signin', passport.authenticate('local'), function(req, res) {
    res.status(200).send();
  });

  app.get('/loggedin', function(req, res){
    if (req.isAuthenticated()) {
      res.send(req.user);
    } else {
      res.redirect('/login');
    }
  });

  app.post('/signup', function(req, res) {
    User.register(new User({username: req.body.username}), req.body.password, function(err, usr){
      if(err) {
        return err;
      }
      passport.authenticate('local')(req, res, function(){
        res.status(200).send();

      });
    });
  });

  app.post('/timeline', controller.timeline);

  app.post('/search', controller.search);

  app.post('/user', controller.user);

  app.post('/streams', function(req, res, next){
    controller.stream(req, res, io);
  });

  app.get('/auth/facebook', function(req, res) {

    // we don't have a code yet
    // so we'll redirect to the oauth dialog
    if (!req.query.code) {
      var authUrl = graph.getOauthUrl({
          "client_id":     conf.client_id
        , "redirect_uri":  conf.redirect_uri
        , "scope":         conf.scope
      });

      if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
        res.redirect(authUrl);
      } else {  //req.query.error == 'access_denied'
        res.send('access denied');
      }
      return;
    }

    // code is set
    // we'll send that and get the access token
    graph.authorize({
        "client_id":      conf.client_id
      , "redirect_uri":   conf.redirect_uri
      , "client_secret":  conf.client_secret
      , "code":           req.query.code
    }, function (err, facebookRes) {
      req.isAuthenticated();
      res.redirect('/#/facebook');
    });
  });

  app.post('/fb', controller.fb);
}