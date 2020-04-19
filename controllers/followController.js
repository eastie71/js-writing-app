const Follow = require('../models/Follow')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

exports.add = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId)
    follow.add().then(() => {
        // console.log(follow.followEmail)
        try {
            let followerName = req.session.user.username
            // console.log(followerName)
            // Sent an email to the user being followed
            sendgrid.send({
                to: follow.followEmail,
                from: process.env.FROMEMAIL,
                subject: `${followerName} is now following you!`,
                text: 'Keep up the great work! People are following you',
                html: `<p>Congrats, <strong>${followerName}</strong> has started following you! Keep up the great work and more people will follow you!</p>
                        <p>Perhaps you can follow ${followerName} back? :)</p><p>Here is a link to their Profile Page: <a href="${process.env.PROFILEURL}/${followerName}">${followerName}'s Profile</a></p>`
            })
            // console.log("Follow email sent!")
        } catch (error) {
            console.log(error)
            if (error.response) {
                console.log(error.response.body)
            }
        } 
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