const Post = require('../models/Post')

exports.createScreen = function(req, res) {
    res.render('create-post', {title: "Create Post"})
}

exports.editScreen = async function(req, res) {
    try {
        let post = await Post.findById(req.params.id, req.visitorId)
        if (post.isVisitorTheAuthor) {
            res.render('edit-post', {post: post, title: `Edit - ${post.title}`})
        } else {
            req.flash("generalErrors", "Permission denied.")
            req.session.save(() => res.redirect("/"))
        }
    } catch {
        res.render('404')
    }
}

exports.create = function(req, res) {
    // req.body is the data here
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function(createdId) {
        req.flash("successMessages", "New post successfully created.")
        // Redirect to View post page using the newly created post id
        req.session.save(() => res.redirect(`/post/${createdId}`))
    }).catch(function(errors) {
        errors.forEach(function(error) {
            req.flash('generalErrors', error)
        })
        req.session.save(() => res.redirect("create-post"))
    })
}

exports.apiCreate = function(req, res) {
    // req.body is the data here
    let post = new Post(req.body, req.apiUser._id)
    post.create().then(function(createdId) {
        // Need to return the createdId here to the application
        res.json("Create post successful")
    }).catch(function(errors) {
        res.json(errors)
    })
}

exports.update = function(req, res) {
    // req.body is the data here
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update().then(function() {
        // Post successfully updated
        req.flash('successMessages', "Post successfully updated")
        req.session.save(function() {
            res.redirect(`/post/${req.params.id}/edit`)
        })
    }).catch(function(errorStatus) {
        console.log(post.errors)
        // If permission error (ie. post doesn't exist or user does not have permission to update)
        // then redirect to home page with this of error messages
        // else if any other errir the redirect back to edit page - so user can fix errors
        post.errors.forEach(function(error) {
            req.flash('generalErrors', error)
        })
        if (errorStatus == "permission") {  
            req.session.save(function() {
                res.redirect("/")
            })
        } else {
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    })
}

exports.delete = function(req, res) {
    Post.delete(req.params.id, req.visitorId).then(function() {
        req.flash("successMessages", "Post deleted.")
        // Redirect to Authors Profile page after delete
        req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
    }).catch(function() {
        req.flash("generalErrors", "Permission denied.")
        req.session.save(() => res.redirect("/"))
    })
}

exports.apiDelete = function (req, res) {
    Post.delete(req.params.id, req.apiUser._id).then(function() {
        // Need to return the createdId here to the application
        res.json("Delete post successful")
    }).catch(function() {
        res.json("Delete post failed")
    })
}

exports.search = function(req, res) {
    Post.search(req.body.searchTerm).then(foundPosts => {
        res.json(foundPosts)
    }).catch(() => {
        res.json([])
    })
}

exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post, title: post.title})
    } catch {
        res.render('404')
    }
}

exports.apiGetPostsByUsername = function (req, res) {
    // console.log(req.authorDocument)
    Post.findByAuthorId(req.authorDocument._id).then((posts)=> {
        res.json(posts)
    }).catch(() => {
        res.json("Posts request failed.")
    })
}