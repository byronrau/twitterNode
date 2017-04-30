var Twitter = require('twitter');
//remove for production
var keys = require('./config.js');

var sentiment = require('sentiment');
var moment = require('moment');
var csvWriter = require('csv-write-stream');
var fs = require('fs');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY || keys.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET || keys.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY || keys.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || keys.TWITTER_ACCESS_TOKEN_SECRET
});

var prevStream;

var graph = require('fbgraph');

var writeCSV = function(tweetsArr, user) {
    var writer = csvWriter({ headers: ['Tweet ID','Username','Tweet Time','Tweet','Number of Retweets','Hashtags','Mentions','Name','Location','Web','Bio','Number of Tweets','Number of Followers','Number Following','Location Coordinates']})
    writer.pipe(fs.createWriteStream('tweets.csv', {'flags': 'a'}));
    tweetsArr.forEach(function(currTweet){
      // console.log(JSON.stringify(currTweet));
      var hashtagsStr = '';
      var userMentionsStr = '';
      if(currTweet.entities.hashtags.length > 0) {
        currTweet.entities.hashtags.forEach(function(currHash, index) {
          if(index !== currTweet.entities.hashtags.length-1) {
            hashtagsStr += currHash.text + ','
          } else {
            hashtagsStr += currHash.text
          }
          hashtagsStr += currHash.text + ','
        });
        hashtagsStr = '\"' + hashtagsStr + '\"'
      }
      if(currTweet.entities.user_mentions.length > 0) {
        currTweet.entities.user_mentions.forEach(function(currMention, index) {
          if(index !== currTweet.entities.user_mentions.length-1) {
            userMentionsStr += currMention.screen_name + ','
          } else {
            userMentionsStr += currMention.screen_name
          }
        });
        userMentionsStr = '\"' + userMentionsStr + '\"'
      }
      writer.write([currTweet.id_str, currTweet.user.screen_name,currTweet.created_at, currTweet.text, currTweet.retweet_count, hashtagsStr, userMentionsStr, currTweet.user.name, currTweet.user.location, currTweet.user.url, currTweet.user.description, currTweet.user.statuses_count, currTweet.user.followers_count, currTweet.user.friends_count])
    });
    writer.end()
  }

var writeFBCSV = function(posts) {
  console.log('Writing FBCSV', posts.length);
  //array of posts, with comments as array of objects, need to flatten
  //id, created_time, message, type(post/comment), name
  //id, created_time, message, type(post/comment), name
  var csvData = [];
  posts.forEach(function(currPost){
    // console.log('currPost', currPost)
    var post = {}
    post.id = currPost.id;
    post.created_time = currPost.created_time;
    try {
      post.message = currPost.message.trim();
    } catch (e){
      // console.log(e)
      post.messge ='';
    }
    post.type = 'Post';
    post.name = 'Posted by Page';
    try {
      post.likes = currPost.likes.summary.total_count;
    } catch(e) {
      post.likes = 0;
    }
    if (currPost.hasOwnProperty('shares')) {
      post.shares = currPost.shares.count;
    } else {
      post.shares = 0
    }
    csvData.push(post);

    // console.log(currPost.message);
    if(currPost.hasOwnProperty('comments')) {
      if (currPost.comments.hasOwnProperty('data')) {
        currPost.comments.data.forEach(function(comment) {
          var comm = {};
          comm.id = comment.id;
          comm.created_time = comment.created_time;
          try {
            comm.message = comment.message.trim();
          } catch(e){
            comm.message = '';
          }
          comm.type = 'Comment';
          comm.name = comment.from.name;
          try {
            comm.likes = comment.likes.summary.total_count;
          } catch (e) {
            comm.likes = 0;
          }
          if (comment.hasOwnProperty('shares')) {
            comm.shares = comment.shares.count;
          } else {
            comm.shares = 0
          }
          csvData.push(comm);
        });
      }
    }
  });
  var writer = csvWriter({ headers: ['Id','created_time','message','type','name','likes','shares']})
  var dateStr = moment().format('MM-DD-YY-HH-mm-ss')
  writer.pipe(fs.createWriteStream('posts-' +dateStr+ '.csv', {'flags': 'a'}));
  csvData.forEach(function(currPost){
    writer.write([currPost.id, currPost.created_time,currPost.message,currPost.type,currPost.name,currPost.likes,currPost.shares])
  })
  writer.end()
}

module.exports = {


  timeline: function(req, res) {
    var tweetsArr = [];
    var count = 0;

    var params = {
      screen_name: req.body.searchTerm,
      count: 200
    };

    var content = fs.readFileSync('input.csv', 'utf-8');
    var usersArr = [];
    content.toString().split(/\n/).forEach(function(line, index){
      // do something here with each line
      console.log(index, line)
      usersArr.push(line.trim());
    });

    var nextTweets = function(params) {
      console.log('count', count, 'max_id', params.max_id, 'params', params);
      if(count === 90 || (moment(tweetsArr[tweetsArr.length-1].created_at) < moment("20160101", "YYYYMMDD")) || (tweetsArr[tweetsArr.length-1].id == tweetsArr[tweetsArr.length-2].id) ) {
        //write to file
        writeCSV(tweetsArr, params.screen_name);
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
      } else {
        console.log('error')
        res.status(404).send(error);
      }
      });
    }

    var getTweets = function() {
      client.get('users/show', {screen_name: params.screen_name}, function(error, user, response) {
        if (!error) {
          client.get('statuses/user_timeline', params, function(error, tweets, response) {
            console.log('tweets',tweets);
            if (!error) {
              params.max_id = tweets[tweets.length-1].id;
              tweetsArr = tweetsArr.concat(tweets);
              nextTweets(params);
            } else {
              console.log('error', error)
              res.status(404).send(error);
            }
          });
          // res.send(user);
        } else{
          console.log('error', error)
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
      if(result.paging && result.paging.previous && count<300) {
        // console.log('calling me', result.paging.previous)
        graph.get(result.paging.next, function(err, result){
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
        console.log('total posts exiting', posts.length);
        res.send(posts);
        // console.log(posts);
        writeFBCSV(posts);
        return
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
        getPosts(err, result)
      }
    });
  }
}