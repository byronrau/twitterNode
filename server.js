var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Twitter = require('twitter');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./userModel.js');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var keys = require('./config.js');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY || keys.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET || keys.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY || keys.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || keys.TWITTER_ACCESS_TOKEN_SECRET
});

app.set('port', (process.env.PORT || 9000));

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({cookie: { path: '/', httpOnly: true, maxAge: null}, secret:'mysecret', resave: false, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

app.post('/timeline', function(req, res) {
  var tweetsArr = [];
  var count = 0;

  var params = {
    screen_name: req.body.searchTerm,
    count: 200
  };

  var nextTweets = function(params) {
    console.log('count', count, 'max_id', params.max_id);
    if(count === 16) {
      res.send(tweetsArr);
      return;
    }
    client.get('statuses/user_timeline', params, function(error, tweets, response){
    if (!error) {
      if(tweets.length > 0 && tweets[tweets.length-1].hasOwnProperty('id')){
        params.max_id = tweets[tweets.length-1].id;
      } else {
        console.log('max id not updated');
        params.max_id = params.max_id;
      }
      tweetsArr = tweetsArr.concat(tweets);
      count++;
      nextTweets(params);
    } else{
      console.log('error')
      res.status(404).send(error);
    }
    });
  }

  var getTweets = function() {
    client.get('statuses/user_timeline', params, function(error, tweets, response){
    if (!error) {
      params.max_id = tweets[tweets.length-1].id;
      tweetsArr = tweetsArr.concat(tweets);
      nextTweets(params);
    } else{
      console.log('error')
      res.status(404).send(error);
    }
    });
  }
  getTweets();
});

app.post('/search', function(req,res){
  var tweetsArr = [];
  var count = 0;

  var params = {
    q: req.body.searchTerm,
    count: 100,
    max_id: req.body.maxId
  };

  var nextTweets = function(params) {
    console.log('count', count, 'max_id', params.max_id);
    if(count === 9) {
      res.send(tweetsArr);
      return;
    }
    client.get('search/tweets', params, function(error, tweets, response){
    if (!error) {
      if(tweets.statuses.length > 0 && tweets.statuses[tweets.statuses.length-1].hasOwnProperty('id')){
        params.max_id = tweets.statuses[tweets.statuses.length-1].id;
      } else {
        console.log('max id not updated');
        params.max_id = params.max_id;
      }
      tweetsArr = tweetsArr.concat(tweets.statuses);
      count++;
      nextTweets(params);
    } else{
      console.log('error')
      res.status(404).send(error);
    }
    });
  }

  var getTweets = function() {
    client.get('search/tweets', params, function(error, tweets, response){
    if (!error) {
      params.max_id = tweets.statuses[tweets.statuses.length-1].id;
      tweetsArr = tweetsArr.concat(tweets.statuses);
      nextTweets(params);
    } else{
      console.log('error')
      res.status(404).send(error);
    }
    });
  }
  getTweets();

});

app.post('/user', function(req, res){
  console.log(req.body.screen_name);
  client.get('users/show', {screen_name: req.body.screen_name}, function(error, user, response){
    if (!error) {
      res.send(user);
    } else{
      console.log('error', error)
      res.status(404).send(error);
    }
  });
})


var io = require('socket.io').listen(app.listen(process.env.PORT || 9000));

io.on('connection', function(socket){
  console.log('user connected', io.engine.clientsCount);
  var currentStream;

  socket.on('disconnect', function(){
    if(currentStream){
      currentStream.destroy();
    }
    console.log('user disconnected', io.engine.clientsCount);
  });

  app.post('/streams', function(req,res){
    if(currentStream){
      currentStream.destroy();
    }
    res.send('ok');
    if(io.engine.clientsCount > 0) {
      client.stream('statuses/filter', {track: req.body.searchTerm},  function(stream){
        currentStream = stream;

        setInterval(function(){
          console.log('checking client counts', io.engine.clientsCount);
          if(io.engine.clientsCount === 0) {
            stream.destroy();
          }
        }, 30000);

        stream.on('data', function(tweet) {
          // console.log(tweet.text);
          io.sockets.emit('tweetStream', tweet);
        });
        stream.on('error', function(error) {
          console.log(error);
          res.status(404).send(error);
        });
      });
    }
  });
});