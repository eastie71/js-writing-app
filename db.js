const mongodb = require('mongodb')
let connectionString
let local_db
if (process.env.NODE_ENV == "development") {
    local_db = 'mongodb://localhost:27017/WritingApp'
} else {
    local_db = 'heroku connect string here'
}
let external_db = 'mongodb+srv://todoapp:craig123@cluster0-jyrjz.mongodb.net/WritingApp?retryWrites=true&w=majority'

if (process.env.NODE_ENV == "development") {
    connectionString = local_db
} else {
    connectionString = external_db
}
mongodb.connect(connectionString,{useNewUrlParser: true, useUnifiedTopology: true},function(err, client) {
    module.exports = client.db()
    const app = require('./app')
    app.listen(3000)
})