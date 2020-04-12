const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")
const User = require('./User')
const ObjectID = require('mongodb').ObjectID

let Follow = function(followUsername, forUserId) {
    this.followUsername = followUsername
    this.forUserId = forUserId
    this.errors = []
}

Follow.prototype.cleanUpData = function() {
    if (typeof(this.followUsername) != "string") {
        this.followUsername = ""
    }
    this.followUsername = this.followUsername.trim().toLowerCase()
}

Follow.prototype.validate = async function(action) {
    // check followUsername exists in database
    let followAccount = await usersCollection.findOne({username: this.followUsername})
    if (followAccount) {
        this.followId = followAccount._id
    } else {
        this.errors.push(`Cannot find user "${this.followUsername}" to ${action == "add" ? "follow" : "unfollow"}`)
    }

    let followAlreadyExists = await followsCollection.findOne(
        {followId: new ObjectID(this.followId), forUserId: new ObjectID(this.forUserId)}
    )
    if (action == "add" && followAlreadyExists) {
        this.errors.push(`Cannot follow user "${this.followUsername}" again. You are already following.`)
    } else if (action == "remove" && !followAlreadyExists) {
        this.errors.push(`Cannot unfollow user "${this.followUsername}" you are not following`)
    }

    // You cannot follow yourself...
    if (this.followId.equals(this.forUserId)) {
        this.errors.push("You cannot follow yourself!")
    }
}

Follow.isVisitorFollowing = async function(followUserId, visitorId) {
    let followDocument = await followsCollection.findOne(
            {followId: new ObjectID(followUserId), forUserId: new ObjectID(visitorId)}
    )
    return followDocument ? true : false
}

Follow.findFollowingByAuthorId = function(authorId) {
    return new Promise(async (resolve, reject) => {
        try {
            let followingArray = await followsCollection.aggregate([
                {$match: {forUserId: new ObjectID(authorId)}},
                {$lookup: {from: "users", localField: "followId", foreignField: "_id", as: "userDocument"}},
                {$project: {
                    user: {$arrayElemAt: ["$userDocument", 0]}
                }}
            ]).toArray()

            // cleanup user object for each follow object
            followingArray = followingArray.map(function(follow) {   
                follow.user = {
                    username: follow.user.username,
                    avatar: new User(follow.user, true).avatar
                }  
                return follow
            })

            console.log(followingArray)
            resolve(followingArray)
        } catch {
            reject()
        } 
    })
}

Follow.findFollowersByAuthorId = function(authorId) {
    return new Promise(async (resolve, reject) => {
        try {
            let followersArray = await followsCollection.aggregate([
                {$match: {followId: new ObjectID(authorId)}},
                {$lookup: {from: "users", localField: "forUserId", foreignField: "_id", as: "userDocument"}},
                {$project: {
                    user: {$arrayElemAt: ["$userDocument", 0]}
                }}
            ]).toArray()

            // cleanup user object for each follower object
            followersArray = followersArray.map(function(follower) {   
                follower.user = {
                    username: follower.user.username,
                    avatar: new User(follower.user, true).avatar
                }  
                return follower
            })

            console.log(followersArray)
            resolve(followersArray)
        } catch {
            reject()
        }
    })
}

Follow.countFollowersByAuthorId = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let count = await followsCollection.countDocuments({followId: id})
            resolve(count)
        } catch {
            reject()
        }
    })
}

Follow.countFollowingByAuthorId = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let count = await followsCollection.countDocuments({forUserId: id})
            resolve(count)
        } catch {
            reject()
        }
    })
}

Follow.prototype.add = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUpData()
        await this.validate("add")
        if (!this.errors.length) {
            await followsCollection.insertOne({followId: this.followId, forUserId: new ObjectID(this.forUserId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.prototype.remove = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUpData()
        await this.validate("remove")
        if (!this.errors.length) {
            await followsCollection.deleteOne({followId: this.followId, forUserId: new ObjectID(this.forUserId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}
module.exports = Follow