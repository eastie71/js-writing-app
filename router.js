const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')

// user related routes
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

// post related routes

// express router calls methods from left to right and you use "next()" move to the next method
router.get('/create-post', userController.checkLoggedIn, postController.createScreen)
router.post('/create-post', userController.checkLoggedIn, postController.create)
router.get('/post/:id', postController.viewSingle)

module.exports = router