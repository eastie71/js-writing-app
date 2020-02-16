const Post = require('../models/Post')

exports.createScreen = function(req, res) {
    res.render('create-post')
}

exports.create = function(req, res) {
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function() {
        res.send("New post created OK")
    }).catch(function(errors) {
        res.send(errors)
    })
}

exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findById(req.params.id)
        res.render('single-post-screen', {post: post})
    } catch {
        res.send("404 page not found goes here!")
    }
}