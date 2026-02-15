const express = require('express')
const app = express()
const userModel=require('./models/user');
const postModel=require('./models/post')
const cookieParser = require('cookie-parser');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken')
const upload=require("./config/multerconfig")
const path=require("path");

app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")));


app.get('/', (req, res) => {
       res.render('index')
})

app.get('/profile/upload', (req, res) => {
       res.render('profileupload')
})

// app.get('/test', (req, res) => {
//        res.render('test')
// })

app.post('/upload',isLoggedIn, upload.single("image"), async (req, res) => {
       //console.log(req.file);//in this multer add body and file
      let user= await userModel.findOne({email: req.user.email})
      user.profilepic=req.file.filename;
      await user.save();
      res.redirect("/profile");
})

app.post('/register', async (req, res) => {
       let{email,username,name,password,age}=req.body;

      let user=await userModel.findOne({email})

       if (!email || !username || !name || !password || !age) {
      return res.status(400).send("Please fill all fields");
       }

      if(user) return res.status(500).send("user Already Registered");

      bcrypt.genSalt(10,(err,salt)=>
{
       bcrypt.hash(password,salt,async (err,hash)=>{
             let user = await userModel.create({
                     email,
                     name,
                     username,
                     age,
                     password:hash
              })
              
              let token=jwt.sign({email, userid: user._id},"shhhh");
              res.cookie("token",token);
              
              res.send("registered")
       })
})
    
})


app.post('/login', async (req, res) => {
     let{email,password}=req.body;
      let user=await userModel.findOne({email})

      
       
      if(!user) return res.status(500).send("Something Went Wrong!");

      bcrypt.compare(password,user.password, function(err,result)
     {
       if(result) res.status(200).redirect('/profile')
       else res.redirect("/login");
     })
     let token=jwt.sign({email, userid: user._id},"shhhh");
              res.cookie("token",token);
    
})
app.get('/login' ,(req,res)=>{
       res.render('login');
})

app.get('/profile',isLoggedIn , async(req,res)=>{
    
      let user= await userModel.findOne({email: req.user.email}).populate("posts")
     
       res.render('profile',{user});
})


app.get('/like/:id',isLoggedIn , async(req,res)=>{
    
      let post= await postModel.findOne({_id: req.params.id}).populate("user")
      if(post.likes.indexOf(req.user.userid)===-1)//when user not like
      {
            post.likes.push(req.user.userid)
      }
      else
       {
          
          post.likes.splice(post.likes.indexOf(req.user.userid),1)//splice means remove krna 
      }
      await post.save();
      res.redirect('/profile')

})

app.get('/edit/:id',isLoggedIn , async(req,res)=>{
    
      let post= await postModel.findOne({_id: req.params.id}).populate("user")
      
     res.render("edit",{
       post
     });
})

app.post('/update/:id',isLoggedIn , async(req,res)=>{
    
      let post= await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content})
      
     res.redirect("/profile");
})


app.post('/post',isLoggedIn , async(req,res)=>{
    let{content}=req.body;
      let user= await userModel.findOne({email: req.user.email})

     let post= await postModel.create({
       user: user._id,
       content,
     })

     user.posts.push(post._id);
     await user.save();
     res.redirect('/profile')
})


app.get('/logout' ,(req,res)=>{
       res.cookie("token","")
       res.redirect('/login');
})

function isLoggedIn(req, res, next)
{
       if(req.cookies.token==="") res.render('login')
              else{
       let data=jwt.verify(req.cookies.token, "shhhh")
       req.user=data;
       next();
        }
       
}


app.listen(3000)