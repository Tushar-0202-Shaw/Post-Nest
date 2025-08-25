const mongoose = require('mongoose')
require('dotenv').config()
mongoose.connect(process.env.DB_URL)

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }]
})

module.exports = mongoose.model('user', userSchema)