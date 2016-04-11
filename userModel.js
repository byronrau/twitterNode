var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/twitterNode');


var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: String
});

module.exports = mongoose.model('User', UserSchema);