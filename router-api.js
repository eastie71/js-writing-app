const apiRouter = require('express').Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')
const cors = require('cors')

// This sets up any routes BELOW this line to set the CORS policy to be allowed from any domain
apiRouter.use(cors())

// All API routes fall under /api/<something>
// User related routes
apiRouter.post('/login', userController.apiLogin)
// Post related routes
apiRouter.post('/create-post', userController.apiCheckLoggedIn, postController.apiCreate)
apiRouter.delete('/post/:id', userController.apiCheckLoggedIn, postController.apiDelete)
apiRouter.get('/postsByAuthor/:username', userController.apiCheckUsernameExists, postController.apiGetPostsByUsername)

module.exports = apiRouter