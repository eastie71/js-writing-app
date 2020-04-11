const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")
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