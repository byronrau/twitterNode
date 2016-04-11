var bcrypt = require('bcrypt-nodejs');

exports.hashPassword = function(password, cb) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, null, function(err, hash) {
      cb (hash);
    });
  });
};

exports.comparePassword = function(password, hash, cb) {
  bcrypt.compare(password, hash, function(err, matched) {
    cb(matched);
  });
};