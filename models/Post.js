const postsCollection = require('../db').db().collection("posts")
// Special ObjectID type required for MongoDB IDs
const ObjectID = require('mongodb').ObjectID

let Post = function(data, userid) {
    this.data = data
    this.errors = []
    this.userid = userid
}

Post.prototype.cleanUpData = function() {
    if (typeof(this.data.title) != "string") {
        this.data.title = ""
    }
    if (typeof(this.data.body) != "string") {
        this.data.body = ""
    }
    // Get rid of any rubbish properties in the data, and remove spaces
    // Also used to add on additional properties required
    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(),
        author: ObjectID(this.userid)
    }
}

Post.prototype.validate = function() {
    if (this.data.title == "") {
        this.errors.push("Please enter a title for the post")
    }
    if (this.data.body == "") {
        this.errors.push("Please enter some content for the post")
    }
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUpData()
        this.validate()
        if (!this.errors.length) {
            // Save post into the database
            postsCollection.insertOne(this.data).then(() => {
                resolve()
            }).catch(() => {
                this.errors.push("Unexpected error occurred. Please try again.")
                reject(this.errors)
            })
        } else {
            reject(this.errors)
        }
    })
}

Post.findById = function(id) {
    return new Promise(async (resolve, reject) => {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }
        let post = await postsCollection.findOne({_id: new ObjectID(id)})
        if (post) {
            resolve(post)
        } else {
            reject()
        }
    })
}

module.exports = Post