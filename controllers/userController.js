const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')
const webToken = require('jsonwebtoken')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsOwnProfile = false
    let isFollowing = false

    if (req.session.user) {
        isVisitorsOwnProfile = req.profileUser._id.equals(req.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    }
    req.isVisitorsOwnProfile = isVisitorsOwnProfile
    req.isFollowing = isFollowing
    // Retrieve Counts for Posts, Followers and Following
    // All calls to retrieve the counts are independent - ie. dont rely on one another
    // Therefore each call can return a Promise and we can await ALL of their results using Promise.all
    // As they will all return a number, and Promise.all will return an array of these numbers we can 
    // use the "Array destructure" feature to get the counts into separate count variables
    let postCountPromise = Post.countPostsByAuthorId(req.profileUser._id)
    let followerCountPromise = Follow.countFollowersByAuthorId(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingByAuthorId(req.profileUser._id)
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount
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

exports.apiCheckLoggedIn = function(req, res, next) {
    try {
        // verify method will throw an error if an invalid token is passed in
        // setup "apiUser" so its available in "next" method
        req.apiUser = webToken.verify(req.body.token, process.env.WEBTOKENSECRET)
        console.log(req.apiUser)
        next()
    } catch {
        res.json("You must provide a valid token")
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

exports.apiLogin = function(req, res) {
    let user = new User(req.body)
    user.login().then(function(result) {
        res.json(webToken.sign({_id: user.data._id}, process.env.WEBTOKENSECRET, {expiresIn: '7d'}))
    }).catch(function(error) {
        res.json(error)
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
        try {
            // Send a welcome email to the user just registered
            sendgrid.send({
                to: user.data.email,
                from: process.env.FROMEMAIL,
                subject: `Welcome to WriteApp ${user.data.username} !`,
                text: 'Welcome to the WriteApp for you! Start Writing TODAY!',
                html: `<p>Welcome, <strong>${user.data.username}</strong> to <strong><a href="${process.env.MAINURL}">WriteApp!</a></strong>, where you can rediscover the joy of writing again.</p>
                        <p>Checkout our list of features</p>
                        <ul>
                            <li>Live <strong>Chat</strong> with fellow Writers.</li>
                            <li><strong>Search</strong> for any Posts that interest you.</li>
                            <li>Checkout the <strong>Profile</strong> and Posts of other Writers</li>
                            <li>Choose to <strong>Follow</strong> Writers you like and see their Posts in your Feed.</li>
                            <li>Have other Writers follow you back - and see who is following you!</li>
                            <li>And of course, start Writing by creating your first Post</li>
                            <li>For your Posts, feel free to use <strong>Markdown</strong> for Styling - see https://guides.github.com/features/mastering-markdown </li>
                        </ul>
                        <p>
                            <button><a href="${process.env.MAINURL}/create-post" 
                            style="background-color: #007bff;
                                border: none;
                                color: #111;
                                padding: 15px 32px;
                                text-align: center;
                                text-decoration: none;
                                display: inline-block;
                                font-size: 16px;
                                margin: 10px 12px;
                                cursor: pointer;" 
                            >CREATE YOUR FIRST POST</a></button>
                        </p>
                        <p>We really hope you enjoy using our App and we would love to hear from you.</p>
                        <p>Have fun!</p>
                        <p>Craig @ <strong><a href="${process.env.MAINURL}">WriteApp</a></p>`
            })
            console.log("Register email sent!")
        } catch (error) {
            console.log(error)
            if (error.response) {
                console.log(error.response.body)
            }
        }
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

exports.home = async function(req, res) {
    // If the "user" object exists on the session, then we must be logged in
    if (req.session.user) { 
        // fetch the feed of posts for the current user
        let posts = await Post.getUsersFeed(req.session.user._id)
        res.render('home-dashboard', {posts: posts, title: `${req.session.user.username}'s Latest Feed`})
    } else {
        // Here we leverage the flash package - accessing the "flash" object that contains 
        // "loginErrors" data if a user
        // attempted to login and failed - the flash package will automatically REMOVE
        // "loginErrors" data after accessing it.
        // Same goes for "regErrors"
        res.render('home-guest', {regErrors: req.flash('regErrors'), title: "Register or Sign In"})
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

exports.checkUsernameExists = function(req, res) {
    User.findByUsername(req.body.username).then(function() {
        // Although findByUsername returns a user document - we dont need it and dont need to pass it here
        res.json(true)
    }).catch(function() {
        res.json(false)
    })
}

exports.apiCheckUsernameExists = async function(req, res, next) {
    try {
        req.authorDocument = await User.findByUsername(req.params.username)
        next()
    } catch {
        res.json("Invalid Username requested.")
    }
}

exports.checkEmailExists = function(req, res) {
    User.findByEmail(req.body.email).then(function() {
        // Although findByEmail returns a user document - we dont need it and dont need to pass it here
        res.json(true)
    }).catch(function() {
        res.json(false)
    })
}

// This method relies on checkUserExists and sharedProfileData methods
exports.profilePostsScreen = function(req, res) {
    // Ask the post model for posts by a particular author id
    Post.findByAuthorId(req.profileUser._id, req.visitorId).then(function(posts) {
        res.render('profile', {
            title: `${req.profileUser.username}'s Profile`,
            postCount: req.postCount,
            followerCount: req.followerCount,
            followingCount: req.followingCount,
            currentTab: "posts",
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

// This method relies on checkUserExists and sharedProfileData methods
exports.profileFollowingScreen = function(req, res) {
    // Ask the follow model for follows of a particular author id
    Follow.findFollowingByAuthorId(req.profileUser._id).then(function(follows) {
        res.render('profile-following', {
            title: `${req.profileUser.username} is Following`,
            postCount: req.postCount,
            followerCount: req.followerCount,
            followingCount: req.followingCount,
            currentTab: "following",
            follows: follows,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsOwnProfile: req.isVisitorsOwnProfile
        })
    }).catch(function() {
        res.render('404')
    })
    
}

// This method relies on checkUserExists and sharedProfileData methods
exports.profileFollowersScreen = function(req, res) {
    // Ask the follow model for followers of a particular author id
    Follow.findFollowersByAuthorId(req.profileUser._id).then(function(followers) {
        res.render('profile-followers', {
            title: `${req.profileUser.username}'s Followers`,
            postCount: req.postCount,
            followerCount: req.followerCount,
            followingCount: req.followingCount,
            currentTab: "followers",
            followers: followers,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsOwnProfile: req.isVisitorsOwnProfile
        })
    }).catch(function() {
        res.render('404')
    })
}