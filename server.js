var express = require('express');
var app = express();
var bodyParser = require('body-parser');
// var fs = require('fs');
var Twitter = require('twitter');

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
  //get term
  // console.log(req.body);
  var params = {
    screen_name: req.body.searchTerm,
    count: 200,
    max_id: req.body.max_id
  };
  client.get('statuses/user_timeline', params, function(error, tweets, response){
  if (!error) {
    // console.log(tweets);
    res.send(tweets);
  } else{
    res.send(error);
  }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});