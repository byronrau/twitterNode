var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/twitterNode');

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);