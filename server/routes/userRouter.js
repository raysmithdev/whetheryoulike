const User = require('./models/user');
const TempUser = require('./models/tempUserModel')
const mongoose = require('mongoose')
var crypto = require('crypto');
var sendgrid = require('sendgrid')(YOUR_SENDGRID_USERNAME, YOUR_SENDGRID_PASSWORD);

module.exports = function (app, passport, nev) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/api', function (req, res, next) {
        if (err) {
            res.status(500).send(err);
        }
        res.status(200).send() // load the index.ejs file
    });

    app.get('/api/email-verification', function (req, res) {
        console.log('verify_email token: ', req.query.token);

        User.findOne({ authToken: req.query.token }, function (err, user) {
            if (err) { return console.error(err); }
            console.dir(user);

            user.isAuthenticated = true;
            user.save(function (err) {
                if (err) return console.error(err);
                console.log('succesfully updated user');
                console.log(user);

                sendgrid.send({
                    to: user.email,
                    from: 'phoebusapollotest@gmail.com',
                    subject: 'Email confirmed!',
                    html: '<p>Your account has been successfully verified. If you haven\'t already, you may <a href="http://localhost:8080/api/login">log in here.</a></p>'
                }, function (err, json) {
                    if (err) { return console.error(err); }
                    console.log(json);
                });

                res.send(user);
            });
        });
    });

    // app.get('/api/email-verification/:URL', function (req, res) {
    //     console.log("Email VERIFICATION route")
    //     var url = req.params.URL;

    //     nev.confirmTempUser(url, function (err, user) {
    //         if (user) {
    //             nev.sendConfirmationEmail(user.email, function (err, info) {
    //                 if (err) {
    //                     return res.status(404).send('ERROR: sending confirmation email FAILED');
    //                 }
    //                 res.send('Your email has been confirmed! Thank you! <a href="http://localhost:3000/login">Click here to log in!</a>')
    //             });
    //         } else {
    //             return res.status(404).send('ERROR: confirming temp user FAILED');
    //         }
    //     });
    // });

    app.post('/api/signup', function (req, res) {
        console.log('user email: ', req.body.email);

        //generate authentication token
        var seed = crypto.randomBytes(20);
        var authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');

        var newUser = new User({
            email: req.body.email,
            authToken: authToken,
            isAuthenticated: false
        });

        newUser.save(function (err, newUser) {
            if (err) {
                return console.error(err);
            }
            console.dir(newUser);

            var authenticationURL = 'http://localhost:8080/verify_email?token=' + newUser.authToken;
            sendgrid.send({
                to: newUser.email,
                from: 'phoebusapollotest@gmail.com',
                subject: 'Confirm your email',
                html: '<a target=_blank href=\"' + authenticationURL + '\">Confirm your email</a>'
            }, function (err, json) {
                if (err) { return console.error(err); }
                console.log(json);
            });
        });


    });

    // app.post('/api/signup', function (req, res) {
    //     const username = req.body.username
    //     const email = req.body.email;
    //     const pw = req.body.password;
    //     const newUser = new User({
    //         username: username,
    //         email: email,
    //         password: pw
    //     });

    //     nev.createTempUser(newUser, (err, existingPersistentUser, newTempUser) => {

    //         if (err) {
    //             return res.status(404).send(`ERROR: creating temp user FAILED ${err}`);
    //         }

    //         if (existingPersistentUser) {
    //             return res.json({
    //                 msg: `You have already signed up and confirmed your account. Did you forget your password?`
    //             });
    //         }

    //         if (newTempUser) {
    //             var URL = newTempUser[nev.options.URLFieldName];

    //             nev.sendVerificationEmail(email, URL, function (err, info) {
    //                 console.log(info)
    //                 if (err) {
    //                     console.error(err);
    //                     return res.status(500).send(`ERROR: sending verification email FAILED ${err}`);
    //                 }
    //                 res.json({
    //                     email: info.accepted[0],
    //                     status: 'uncomfirmed'
    //                 });
    //             });

    //         } else {
    //             res.json({
    //                 msg: 'You have already signed up. Please check your email to verify your account.'
    //             });
    //         }
    //     })
    // })



    app.post('/api/login',
        passport.authenticate('local-login', { session: true }),
        function (req, res) {
            if (!req.user) {
                return res.status(500).send(err);
            } else {
                res.status(201).json({
                    email: req.user.email,
                    status: 'confirmed',
                    settings: req.user.settings
                });
            }
        });

    app.post('/api/saveSettings', function (req, res, next) {
        User.find({
            email: req.body.email
        }, (err, user) => {
            if (err) {
                res.status(400).send(err)
            } else {
                console.log(user)
                user[0].settings = req.body.settings

                user[0].save((err, user) => {
                    if (err) {
                        throw err
                    }
                    res.status(200).json(user);
                })
            }
        })
    })


    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/api/logout', function (req, res, next) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}