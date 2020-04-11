const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsOwnProfile = false
    let isFollowing = false

    if (req.session.user) {
        isVisitorsOwnProfile = req.profileUser._id.equals(req.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    }
    req.isVisitorsOwnProfile = isVisitorsOwnProfile
    req.isFollowing = isFollowing
    next()
}

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
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}

exports.checkUserExists = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument) {
        req.profileUser = userDocument
        next()
    }).catch(function() {
        res.render('404')
    })
}

// This method relies on checkUserExists and sharedProfileData methods
exports.profilePostsScreen = function(req, res) {
    // Ask the post model for posts by a particular author id
    Post.findByAuthorId(req.profileUser._id, req.visitorId).then(function(posts) {
        res.render('profile', {
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsOwnProfile: req.isVisitorsOwnProfile
        })
    }).catch(function() {
        res.render('404')
    })
    
}