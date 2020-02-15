const User = require('../models/User')

exports.login = function(req, res) {
    let user = new User(req.body)
    user.login().then(function(result) {
        req.session.user = {favColor: "red", username: user.data.username}
        // You do not have to explicitly call "save" method here - but we want to so that
        // we can pass a callback function (to redirect to homepage) AFTER the save is completed.
        req.session.save(function() {
            // Make sure the session has been saved before redirecting to homepage
            res.redirect('/')
        })
    }).catch(function(error) {
        // The flash package added "flash" ability on the request (req) object
        // It uses the session to add as follows: req.session.flash.loginErrors = [error]
        req.flash('loginErrors', error)
        req.session.save(function() {
            // Make sure the session has been saved with flash info before redirecting to homepage
            res.redirect('/')
        })
    })
}

exports.logout = function(req, res) {
    req.session.destroy(function() {
        // Make sure the session has been destroyed before redirecting to homepage
        res.redirect('/')
    })
}

exports.register = function(req, res) {
    let user = new User(req.body)
    user.register()
    if (user.errors.length) {
        user.errors.forEach(function(error) {
            req.flash('regErrors', error)
        })
        req.session.save(function() {
            // Make sure the session has been saved with flash info before redirecting to homepage
            res.redirect('/')
        })
    } else {
        res.send("Registration successful!")
    }
}

exports.home = function(req, res) {
    // If the "user" object exists on the session, then we must be logged in
    if (req.session.user) { 
        res.render('home-dashboard', {username: req.session.user.username})
    } else {
        // Here we leverage the flash package - accessing the "flash" object that contains 
        // "loginErrors" data if a user
        // attempted to login and failed - the flash package will automatically REMOVE
        // "loginErrors" data after accessing it.
        // Same goes for "regErrors"
        res.render('home-guest', {loginErrors: req.flash('loginErrors'), regErrors: req.flash('regErrors')})
    }
}