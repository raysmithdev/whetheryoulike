// set up

const express = require('express');
const app = express();
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const morgan = require('morgan');
const MongoStore = require('connect-mongo')(session);
mongoose.Promise = global.Promise;
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const { PORT, DATABASE_URL, TEST_DATABASE_URL } = require('./config/database.js');
const nev = require('email-verification')(mongoose);
const User = require('./routes/models/user');
const nodemailer = require('nodemailer');
var bcrypt = require('bcrypt-nodejs');

app.use(express.static(path.join(__dirname, 'public')));

require('./config/passport')(passport)

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(session({
  name: 'Session',
  resave: true,
  saveUninitialized: true,
  secret: 'forty-two',
  store: new MongoStore({
    url: DATABASE_URL,
    autoReconnect: true
  })
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


//////////////// nev
var myHasher = function (password, tempUserData, insertTempUser, callback) {
  console.log(arguments);
  var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  return insertTempUser(hash, tempUserData, callback);
};

function setUpNev() {

  nev.configure({
    verificationURL: 'http://localhost:8080/email-verification/${URL}',
    URLLength: 48,

    // mongo-stuff
    persistentUserModel: User,
    // tempUserModel: TempUser,
    // tempUserCollection: 'temporary_users',
    emailFieldName: 'email',
    passwordFieldName: 'password',
    URLFieldName: 'GENERATED_VERIFYING_URL',
    expirationTime: 86400,
    hashingFunction: myHasher,
    // emailing options
    transportOptions: {
      service: 'Gmail',
      auth: {
        user: 'phoebusapollotest@gmail.com',
        pass: 'Sup3rS3cr3t'
      }
    },
    verifyMailOptions: {
      from: 'Do Not Reply <phoebusapollotest@gmail.com>',
      subject: 'Confirm your account',
      html: '<p>Please verify your account within 24 hours by clicking <a href="${URL}">this link</a>. If you are unable to do so, copy and ' +
                'paste the following link into your browser:</p><p>${URL}</p>',
      text: 'Please verify your account by clicking the following link, or by copying and pasting it into your browser: ${URL}'
    },
    shouldSendConfirmation: true,
    confirmMailOptions: {
      from: 'Do Not Reply <phoebusapollotest@gmail.com>',
      subject: 'Successfully verified!',
      html: '<p>Your account has been successfully verified. If you haven\'t already, you may <a href="http://localhost:3000/login">log in here.</a></p>',
      text: 'Your account has been successfully verified.'
    },

    // hashingFunction: null,
    smtpTransport: nodemailer.createTransport({
      from: 'phoebusapollotest@gmail.com',
      options: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'phoebusapollotest@gmail.com',
          pass: 'Sup3rS3cr3t'
        }
      }
    })
  }, function (error, options) {
  });

  nev.generateTempUserModel(User, function (err, tempUserModel) {
    if (err) {
      console.log(err);
      return;
    }
    
    console.log('generated temp user model: ' + (typeof tempUserModel === 'function'));
  });

}
////////////////// end nev

require('./routes/userRouter.js')(app, passport, nev);

let server;

function runServer(database = DATABASE_URL, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(database, err => {
      if (err) {
        return reject(err);
      }
      setUpNev();
      server = app.listen(PORT, () => {
        console.log(`Your app is listening on port ${PORT}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
};

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          console.log(`closeServer error, ${err}`);
          return reject(err);
        }
        resolve();
      });
    });
  });
};

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = { app, runServer, closeServer };