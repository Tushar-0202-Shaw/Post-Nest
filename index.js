const express = require('express')
const app = express()
const path = require('path')
const cookieParser = require('cookie-parser')
const userModel = require('./models/user')
const postModel = require('./models/post')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
dotenv.config();


app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/register', async (req, res) => {
    let user = await userModel.findOne({email: req.body.email})
    if(user) return res.status(500).send('User already registered')
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.password, salt, (err, hash) => {
            let user = userModel.create({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: hash,
                age: req.body.age
            })
            let token = jwt.sign({email: req.body.email, userid: user._id}, 'shhhh')
            res.cookie('token', token)
            res.send('registered')
        })
    })
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => {
    let user = await userModel.findOne({email: req.body.email})
    if(!user) return res.status(500).send('Something went wrong')
    
    bcrypt.compare(req.body.password, user.password, (err, result) => {
        if(result){
            let token = jwt.sign({email: req.body.email, userid: user._id}, 'shhhh')
            res.cookie('token', token)
            res.status(200).redirect('/profile')
        } 
        else res.redirect('/login')
    })
})

app.get('/logout', (req, res) => {
    res.cookie('token', '')
    res.redirect('/login')
})

app.get('/profile', isLoggedin, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}).populate('posts')
    res.render('profile', {user})
})

app.post('/post', isLoggedin, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email})
    let post = await postModel.create({
        user: user._id,
        content: req.body.content
    })
    user.posts.push(post._id)
    await user.save()
    res.redirect('/profile')
})

app.get('/like/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate('user')
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid)
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
    }
    await post.save()
    res.redirect('/profile')
})

app.get('/edit/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate('user')
    res.render('edit', {post})
})

app.post('/update/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content})
    res.redirect('/profile')
})

function isLoggedin(req, res, next) {
    if(req.cookies.token === '') res.redirect('/login')
    else{
        let data = jwt.verify(req.cookies.token, 'shhhh')
        req.user = data
        next()
    }
}

const PORT = process.env.PORT 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))