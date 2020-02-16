const User = require('../models/User')

exports.checkLoggedIn = function(req, res, next) {
    if (req.session.user) {
        next()
    } else {
        req.flash('generalErrors', "Please login to perform that action.")
        req.session.save(function() {
            // Make sure the session has been saved with flash info before redirecting to homepage
            res.redirect('/')
        })
    }
}

exports.login = function(req, res) {
    let user = new User(req.body)
    user.login().then(function(result) {
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
        // You do not have to explicitly call "save" method here - but we want to so that
        // we can pass a callback function (to redirect to homepage) AFTER the save is completed.
        req.session.save(function() {
            // Make sure the session has been saved before redirecting to homepage
            res.redirect('/')
        })
    }).catch(function(error) {
        // The flash package added "flash" ability on the request (req) object
        // It uses the session to add as follows: req.session.flash.generalErrors = [error]
        req.flash('generalErrors', error)
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
    user.register().then(() => {
        // Successful register - so log the new user in.
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
    }).catch((regErrors) => {
        regErrors.forEach(function(error) {
            req.flash('regErrors', error)
        })
    }).finally(() => {
        req.session.save(function() {
            // Make sure the session has been saved with flash info before redirecting to homepage
            res.redirect('/')
        })
    })
}

exports.home = function(req, res) {
    // If the "user" object exists on the session, then we must be logged in
    if (req.session.user) { 
        res.render('home-dashboard')
    } else {
        // Here we leverage the flash package - accessing the "flash" object that contains 
        // "loginErrors" data if a user
        // attempted to login and failed - the flash package will automatically REMOVE
        // "loginErrors" data after accessing it.
        // Same goes for "regErrors"
        res.render('home-guest', {generalErrors: req.flash('generalErrors'), regErrors: req.flash('regErrors')})
    }
}