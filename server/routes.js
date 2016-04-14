var passport = require('passport');
var User = require('./userModel.js');
var controller = require('./controller.js')

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
}