const User = require('../models/User')

exports.logout = function() {
    
}

exports.register = function(req, res) {
    let user = new User(req.body)
    user.register()
    if (user.errors.length) {
        res.send(user.errors)
    } else {
        res.send("Registration successful!")
    }
}

exports.login = function(req, res) {
    let user = new User(req.body)
    user.login().then(function(result) {
        req.session.user = {favColor: "red", username: user.data.username}
        // You do not have to explicitely call "save" method here - but we want to so that
        // we can pass a callback function (to redirect to homepage) AFTER the save is completed.
        req.session.save(function() {
            // Make sure the session has been saved before redirecting to homepage
            res.redirect('/')
        })
    }).catch(function(error) {
        res.send(error)
    })
}

exports.logout = function(req, res) {
    req.session.destroy(function() {
        // Make sure the session has been destroyed before redirecting to homepage
        res.redirect('/')
    })
}

exports.home = function(req, res) {
    if (req.session.user) { 
        res.render('home-dashboard', {username: req.session.user.username})
    } else {
        res.render('home-guest')
    }
}