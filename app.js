const express = require('express')
const session1 = require('express-session')
const MongoStore = require('connect-mongo')(session1)
const flash = require('connect-flash')
const markdown = require('marked')
const app = express()

// BOILERPLATE CODE for Session package
let sessionOptions = session1({
    secret: "I dont think you will ever guess this!!",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    // maxAge is in milliseconds
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})
app.use(sessionOptions)

// Install the flash package for flash messages
app.use(flash())

app.use(function(req, res, next) {
    // Make markdown function available across all ejs templates
    res.locals.filterUserEnteredHTML = function(content) {
        return markdown(content)
    }

    // Make all general errors and success flash messages available from every ejs view templates
    // Access as "generalErrors" and "successMessages" variables
    res.locals.generalErrors = req.flash("generalErrors")
    res.locals.successMessages = req.flash("successMessages")

    // Make current user id available on the req object
    if (req.session.user) {
        req.visitorId = req.session.user._id
    } else {
        // This is a guest user (not logged in)
        req.visitorId = 0
    }

    // Setup global access to session user data from every ejs view templates (access as "user" variable)
    res.locals.user = req.session.user
    next()
})

const router = require('./router')

// BOILERPLATE CODE
// Automatically take submitted form data and add to body object that lives on request object
app.use(express.urlencoded({extended: false}))
// Automatically add to body object for asyncronous requests
app.use(express.json())

// Make the 'public' folder accessible by the browser
app.use(express.static('public'))
// Tell express where the "views" folder is
app.set('views', 'views')
// Set the Javascript template to be EJS
app.set('view engine', 'ejs')

app.use('/', router)

// create a server that uses the express "app" as its handler
const server = require('http').createServer(app)
// add in the socket functionality to our "server"
const io = require('socket.io')(server)

module.exports = server
