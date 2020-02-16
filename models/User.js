const bcrypt = require("bcryptjs")
const usersCollection = require('../db').db().collection("users")
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
        this.data.email = ""
    }
    if (typeof(this.data.password) != "string") {
        this.data.password = ""
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
    return new Promise(async (resolve, reject) => {
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
        if (this.data.password.length > 50) {
            this.errors.push("Passwords must no more than 50 characters in length")
        }
    
        // Only if username is valid then check to see if username is in use
        if (this.data.username.length > 2 && this.data.username.length < 21 && validator.isAlphanumeric(this.data.username)) {
            // So we need to make sure the "findOne" method completes before we evaluate the result.
            // The findOne method returns a Promise so we can use the "await" feature - to make sure it completes.
            // It use the "await" feature - it must be called within an "async" function - which is why we add
            // the "async" keyword to the function definition
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if (usernameExists) {this.errors.push("Username: " + this.data.username + " is already in use")}
        }
        // Only if email is valid then check to see if email is in use
        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if (emailExists) {this.errors.push("Email: " + this.data.email + " is already in use")}
        }
        resolve()
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        // Step 1 - Validate User Data
        this.cleanUpData()
        await this.validate()
        // Step 2 - Only if no validation errors occur then store user data into db
        if (!this.errors.length) {
            // Hash the password
            let salt = bcrypt.genSaltSync(10)
            console.log(salt)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
    
            await usersCollection.insertOne(this.data)
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

User.prototype.login = function() {
    // Need to use arrow function here so that the "this.data.password" is referring to the User object
    return new Promise((resolve, reject) => {
        this.cleanUpData()
        usersCollection.findOne({username: this.data.username}).then((loginUser) => {
            if (loginUser && bcrypt.compareSync(this.data.password, loginUser.password)) {
                resolve("Login successful!")
            } else {
                reject("Invalid Username/Password")
            }
        }).catch(function() {
            reject("Login failed - please try again!")
        })
    })
}

module.exports = User