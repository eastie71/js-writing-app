import axios from 'axios'

export default class RegistrationForm {
    constructor() {
        // Select all fields: for username, email and password
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        this.insertValidationElements()
        this.username = document.querySelector("#username-register")
        this.username.previousValue = ""
        this.email = document.querySelector("#email-register")
        this.email.previousValue = ""
        this.password = document.querySelector("#password-register")
        this.password.previousValue = ""
        this.events()
    }

    // Events
    events() {
        this.username.addEventListener("keyup", () => {
            this.isValueDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener("keyup", () => {
            this.isValueDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener("keyup", () => {
            this.isValueDifferent(this.password, this.passwordHandler)
        })
    }

    // Methods
    isValueDifferent(el, handler) {
        if (el.previousValue != el.value) {
            // Need to call the handler function with the correct "this" context. ie. out registrationForm object in this case
            handler.call(this)
        }
        el.previousValue = el.value
    }

    usernameHandler() {
        this.username.errors = false
        this.usernameImmediateValidate()
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(() => this.usernameDelayValidate(), 800)
    }

    usernameImmediateValidate() {
        if (this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
            this.showValidationError(this.username, "Usernames can only contain letters and numbers")
        }
        if (this.username.value.length > 20) {
            this.showValidationError(this.username, "Usernames must be less than 20 characters long")
        }

        if (!this.username.errors) {
            this.hideValidationError(this.username)
        }
    }

    usernameDelayValidate() {
        if (this.username.value != "" && this.username.value.length < 3) {
            this.showValidationError(this.username, "Usernames must be at least 3 characters long")
        }

        if (!this.username.errors) {
            axios.post("/checkUsernameExists", {username: this.username.value}).then((response) => {
                if (response.data) {
                    this.showValidationError(this.username, "Username has already been taken.")
                    this.username.isUnique = false
                } else {
                    this.username.isUnique = true
                }
            }).catch(() => {
                console.log("Unexpected error occurred. Please try again later.")
            })
        }
    }

    emailHandler() {
        this.email.errors = false
        clearTimeout(this.email.timer)
        this.email.timer = setTimeout(() => this.emailDelayValidate(), 800)
    }

    emailDelayValidate() {
        if (!/^\S+@\S+$/.test(this.email.value)) {
            this.showValidationError(this.email, "Please enter a valid email address")
        }

        if (!this.email.errors) {
            axios.post("/checkEmailExists", {email: this.email.value}).then((response) => {
                if (response.data) {
                    this.showValidationError(this.email, "An account already exists with that email.")
                    this.email.isUnique = false
                } else {
                    this.hideValidationError(this.email)
                    this.email.isUnique = true
                }
            }).catch(() => {
                console.log("Unexpected error occurred. Please try again later.")
            })
        }
    }

    passwordHandler() {
        this.password.errors = false
        this.passwordImmediateValidate()
        clearTimeout(this.password.timer)
        this.password.timer = setTimeout(() => this.passwordDelayValidate(), 800)
    }

    passwordImmediateValidate() {
        if (this.password.value.length > 30) {
            this.showValidationError(this.password, "Passwords must be less than 30 characters long")
        }

        if (!this.password.errors) {
            this.hideValidationError(this.password)
        }
    }

    passwordDelayValidate() {
        if (this.password.value != "" && this.password.value.length < 8) {
            this.showValidationError(this.password, "Passwords must be at least 8 characters long")
        }
    }

    hideValidationError(el) {
        el.nextElementSibling.classList.remove("liveValidateMessage--visible")
        // No need to clear out the error message - otherwise it gives a poor visual effect
        // el.nextElementSibling.innerHTML = ""
    }

    showValidationError(el, message) {
        el.nextElementSibling.innerHTML = message
        el.nextElementSibling.classList.add("liveValidateMessage--visible")
        el.errors = true
    }

    insertValidationElements() {
        this.allFields.forEach(function(el) {
           el.insertAdjacentHTML("afterend", '<div class="alert alert-danger small liveValidateMessage"></div>') 
        })
    }
}