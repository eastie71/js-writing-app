const express = require('express')
const app = express()
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

module.exports = app
