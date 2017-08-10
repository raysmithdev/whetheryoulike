var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the schema for our user model
const tempUserSchema = mongoose.Schema({

    email: String,
    password: String,
    url: String

});

// create the model for users and expose it to our app
module.exports = mongoose.model('TempUser', tempUserSchema);