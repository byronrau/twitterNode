var Twitter = require('twitter');
//remove for production
// var keys = require('./config.js');
var sentiment = require('sentiment');
var moment = require('moment')

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY || keys.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET || keys.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY || keys.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || keys.TWITTER_ACCESS_TOKEN_SECRET
});

var prevStream;

var graph = require('fbgraph');


module.exports = {
  timeline: function(req, res) {
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
        // console.log(tweets)
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
  },

  search: function(req, res) {
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
        tweetsArr.forEach(function(tweet){
          tweet.sentiment = sentiment(tweet.text);
        });
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
      console.log('getting tweets')
      client.get('search/tweets', params, function(error, tweets, response){
        if (!error) {
          if(tweets.statuses.length) {
            params.max_id = tweets.statuses[tweets.statuses.length-1].id;
            tweetsArr = tweetsArr.concat(tweets.statuses);
            nextTweets(params);
          } else {
            res.status(404).send(error);
          }
        } else{
          console.log('error')
          res.status(404).send(error);
        }
      });
    }
    getTweets();
  },

  user: function(req, res) {
    console.log(req.body.screen_name);
    client.get('users/show', {screen_name: req.body.screen_name}, function(error, user, response){
      if (!error) {
        res.send(user);
      } else{
        console.log('error', error)
        res.status(404).send(error);
      }
    });
  },

  stream: function(req, res, io) {
    io.on('connection', function(socket){
      console.log('user connected', io.engine.clientsCount);
      socket.on('disconnect', function(){
        if(prevStream){
          prevStream.destroy();
        }
        console.log('user disconnected', io.engine.clientsCount);
      });
    });

    if(prevStream){
      prevStream.destroy();
    }
    if(io.engine.clientsCount > 0) {
      client.stream('statuses/filter', {track: req.body.searchTerm},  function(stream){
        prevStream = stream;
        setInterval(function(){
          console.log('checking client counts', io.engine.clientsCount);
          if(io.engine.clientsCount === 0) {
            stream.destroy();
          }
        }, 30000);

        stream.on('data', function(tweet) {
          io.sockets.emit('tweetStream', tweet);
        });
        stream.on('error', function(error) {
          console.log('stream error!',error);
          stream.destroy();
          res.status(500).send(error);
        });
        //needed to throttle too many stream request.
        setTimeout(function(){
          res.send('stream started');
        }, 5000);
      });
    }
  },

  fb: function(req, res) {
    var posts = [];
    var count = 0;

    //http://stackoverflow.com/questions/17755753/how-to-get-likes-count-when-searching-facebook-graph-api-with-search-xxx
    //AmericanWomenVeterans/feed?fields=message,comments.summary(true){message,from,likes.limit(0).summary(true)},likes.limit(1).summary(true),shares

    var pageURL = req.body.fbPage.split('/').slice(-1)[0];
    var until = req.body.until;
    var untilTime = moment(until).unix()

    var getPosts = function(err, result) {
      count++
      //request to fb api takes longer than 30 secs which times out on free Heroku for count > 20
      if(result.paging && result.paging.previous && count<20) {
        // console.log('calling me', result.paging.previous)
        graph.get(result.paging.next, function(err, resultult){
          // console.log('inside recursive grah.get', result);
          if(err) {
            console.log('err', err);
          } else {
            posts = posts.concat(result.data);
            console.log('total posts', posts.length);
            // console.log('paging inside recursive graph',result);
            getPosts(err, result);
          }
        })
      } else {
        // console.log('exiting', count);
        res.send(posts);
        return;
      }
    };

    var postsStr = '';

    if (until) {
      postStr = '/' + pageURL + '/feed?fields=message,comments.summary(true){message,from,likes.limit(0).summary(true),created_time},likes.limit(1).summary(true),shares,created_time' + '&until=' + untilTime;
    } else {
      postStr = '/' + pageURL + '/feed?fields=message,comments.summary(true){message,from,likes.limit(0).summary(true),created_time},likes.limit(1).summary(true),shares,created_time';
    }

    graph.get(postStr, function(err, result) {
      if (err) {
        console.log('Error getting initial posts', err)
        res.status(500).send(err)
      } else {
        posts = posts.concat(result.data);
        console.log(posts.length);
        getPosts(err, result);
      }
    });
  }
}