const mongoose=require('mongoose');

mongoose.connect("mongodb://localhost:27017/MiniProject");
const userSchema=mongoose.Schema({
    username: String,
    age: Number,
    email: String,
    name: String,
    password: String,
    profilepic:{
         type: String,
         default: "default.png"
    },
    posts:[
        { type:mongoose.Schema.Types.ObjectId ,ref:"post"}
    ]
})

module.exports=mongoose.model("user",userSchema);