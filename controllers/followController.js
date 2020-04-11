const Follow = require('../models/Follow')

exports.add = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId)
    follow.add().then(() => {
        req.flash("successMessages", `Now following ${req.params.username}`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    }).catch((errors) => {
        errors.forEach(function(error) {
            req.flash('generalErrors', error)
        })
        req.session.save(() => res.redirect('/'))
    })
}

exports.remove = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId)
    follow.remove().then(() => {
        req.flash("successMessages", `No longer following ${req.params.username}`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    }).catch((errors) => {
        errors.forEach(function(error) {
            req.flash('generalErrors', error)
        })
        req.session.save(() => res.redirect('/'))
    })
}