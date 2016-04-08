var express = require('express');
var app = express();
var bodyParser = require('body-parser');
// var fs = require('fs');
var Twitter = require('twitter');
var async = require('async');

var client = new Twitter({
  consumer_key: 'dPLhneMsOJ7ZTG1mVN4IsJfnq',
  consumer_secret: 'JmgH4A2WL6f6v0wGOkEdJng3fWfg4M1sOc2dpDXUToeZgJxtzb',
  access_token_key: '39523457-35v8lNljbizoOT6RNwOsjZe7zDhYe42nWpjWh1Wma',
  access_token_secret: 'OFfyQO9svROI3clM8nG3jdZfa5XGs01JW9V39QlsRWyxe'
});

app.set('port', (process.env.PORT || 9000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());


app.post('/search', function(req, res) {
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
      res.send(error);
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
      res.send(error);
    }
    });
  }
  getTweets();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});