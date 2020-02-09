const express = require('express')
const app = express()
const router = require('./router')

// Make the 'public' folder accessible by the browser
app.use(express.static('public'))
// Tell express where the "views" folder is
app.set('views', 'views')
// Set the Javascript template to be EJS
app.set('view engine', 'ejs')

app.use('/', router)

app.listen(3000)
