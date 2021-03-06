const postsCollection = require('../db').db().collection("posts")
const followsCollection = require('../db').db().collection("follows")
// Special ObjectID type required for MongoDB IDs
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

let Post = function(data, userid, requestPostId) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestPostId = requestPostId
}

Post.prototype.cleanUpData = function() {
    if (typeof(this.data.title) != "string") {
        this.data.title = ""
    }
    if (typeof(this.data.body) != "string") {
        this.data.body = ""
    }
    // Get rid of any rubbish properties in the data, and remove spaces
    // Also remove ANY HTML from within the title and body.
    // Also used to add on additional properties required
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
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
            postsCollection.insertOne(this.data).then((info) => {
                // Resolve with the newly created id (Note: element 0 - because we are only creating ONE post)
                resolve(info.ops[0]._id)
            }).catch(() => {
                this.errors.push("Unexpected error occurred. Please try again.")
                reject(this.errors)
            })
        } else {
            reject(this.errors)
        }
    })
}

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        let status
        try {
            // As the "findById" returns a promise, if it rejects it will 
            // automatically fall to the "catch" section below
            let post = await Post.findById(this.requestPostId, this.userid)
            if (post.isVisitorTheAuthor) {
                // Logged in User matches the Posts User - so can perform update
                this.performUpdate().then(()=> {
                    resolve()
                }).catch(() => {
                    status = "failure"
                    reject(status)
                })            
            } else {
                status = "permission"
                this.errors.push("Permission denied.")
                reject(status)
            } 
        } catch {
            // Post doesn't exist (or some other error) - just show permission denied error.
            let status = "permission"
            this.errors.push("Permission denied.")
            reject(status)
        }
    })
}

Post.prototype.performUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUpData()
        this.validate()
        if (!this.errors.length) {
            // Update post into the database
            postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestPostId)}, {$set: {title: this.data.title, body: this.data.body}}).then(() => {
                resolve()
            }).catch(() => {
                this.errors.push("Unexpected error occurred. Please try again.")
                reject()
            })
        } else {
            reject()
        }
    })
}

Post.delete = function(idToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findById(idToDelete, currentUserId)
            if (post.isVisitorTheAuthor) {
                // As this call to delete is in a try-catch block, if it fails
                // it will fall to the catch section below (hence reject)
                await postsCollection.deleteOne({_id: new ObjectID(idToDelete)})
                resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Post.postQuery = function(operations, visitorId) {
    return new Promise(async (resolve, reject) => {
        // Join the operations passed in for the aggregate method call
        let aggOperations = operations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])
        let postArray = await postsCollection.aggregate(aggOperations).toArray()
        // cleanup author object for each post object
        postArray = postArray.map(function(post) {
            post.isVisitorTheAuthor = post.authorId.equals(visitorId)
            // remove the authorID - its not needed to be exposed
            post.authorId = undefined
            
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })

        //console.log(postArray)
        resolve(postArray)
    })
}

Post.findById = function(id, visitorId) {
    return new Promise(async (resolve, reject) => {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }
        
        let postArray = await Post.postQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        if (postArray.length) {
            resolve(postArray[0])
        } else {
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId, visitorId) {
    return Post.postQuery([
        {$match: {author: authorId}},
        // sort in descending order (-1)
        {$sort: {createdDate: -1}}
    ], visitorId)
}

Post.search = function(searchTerm) {
    return new Promise(async (resolve, reject) => {
        if (typeof(searchTerm) == "string") {
            // sort by search score (or relevancy to search string)
            let posts = await Post.postQuery([
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {score: {$meta: "textScore"}}}
            ])
            resolve(posts)
        } else {
            reject()
        }
    })
}

Post.countPostsByAuthorId = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let count = await postsCollection.countDocuments({author: id})
            resolve(count)
        } catch {
            reject()
        }
    })
}

Post.getUsersFeed = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            // create array of user ids the current user is following
            let followedUsers = await followsCollection.find({forUserId: ObjectID(id)}).toArray()
            followedUsers = followedUsers.map(function(followedUser) {
                return followedUser.followId
            })
            // console.log(followedUsers)
            // look for all the posts from the users being followed (above array)
            posts = await Post.postQuery([
                {$match: {author: {$in: followedUsers}}},
                {$sort: {createdDate: -1}}
            ])
            // console.log(posts)
            resolve(posts)
        } catch {
            reject()
        }
        
    })
    
}

module.exports = Post