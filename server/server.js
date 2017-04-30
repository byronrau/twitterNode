var express = require('express');
var timeout = require('connect-timeout');
var app = express();
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./userModel.js');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bugsnag = require("bugsnag");

app.set('port', (process.env.PORT || 9000));

app.use(timeout('1000s'));
app.use(express.static(__dirname + '/../public'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({cookie: { path: '/', httpOnly: true, maxAge: null}, secret:'mysecret', resave: false, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

bugsnag.register("a6da8451f4fe4c5741863413806ae738");

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var io = require('socket.io').listen(app.listen(process.env.PORT || 9000));

require('./routes.js')(app, express, io);
