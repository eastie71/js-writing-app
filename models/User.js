const usersCollection = require('../db').collection("users")
const validator = require('validator')

let User = function(data) {
    this.data = data
    this.errors = []
}

User.prototype.cleanUpData = function() {
    if (typeof(this.data.username) != "string") {
        this.data.username = ""
    }
    if (typeof(this.data.email) != "string") {
        this.data.username = ""
    }
    if (typeof(this.data.password) != "string") {
        this.data.username = ""
    }
    // Get rid of any rubbish properties in the data, and remove spaces
    // Convert username and email to all lowercase
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    if (this.data.username == "") {
        this.errors.push("You must provide a username.")
    }
    if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
        this.errors.push("Username can only contain letters or numbers")
    }
    if (!validator.isEmail(this.data.email)) {
        this.errors.push("You must provide a valid email address.")
    }
    if (this.data.password == "") {
        this.errors.push("You must provide a password.")
    }
    if (this.data.username.length > 0 && this.data.username.length < 3) {
        this.errors.push("Usernames must be at least 3 characters in length")
    }
    if (this.data.username.length > 20) {
        this.errors.push("Usernames must be no more than 20 characters in length")
    }
    if (this.data.password.length > 0 && this.data.password.length < 8) {
        this.errors.push("Passwords must be at least 8 characters in length")
    }
    if (this.data.password.length > 100) {
        this.errors.push("Passwords must no more than 100 characters in length")
    }
}

User.prototype.register = function() {
    // Step 1 - Validate User Data
    this.cleanUpData()
    this.validate()
    // Step 2 - Only if no validation errors occur then store user data into db
    if (!this.errors.length) {
        usersCollection.insertOne(this.data)
    }
}

module.exports = User