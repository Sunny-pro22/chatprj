if(process.env.NODE_ENV !="production"){
    require("dotenv").config();
}

const express=require("express")
const app=express()
const session=require("express-session")
const passport=require("passport")
const localstart=require("passport-local")
const mongoStore=require("connect-mongo")
app.use(express.urlencoded({extended:true}))
const mongoose = require('mongoose');
const dburl=process.env.ATLAS_URL;
async function main(){
    await mongoose.connect(dburl)
}
main()
.then(()=>{
    console.log("connected")
})
.catch((err)=>{
    console.log(err)
})
const upload=require("./multer.js")
const Store=mongoStore.create({
    mongoUrl:dburl,
    crypto:{
        secret:process.env.SECRET,
        touchAfter:24*3600
    }
})
// Store.on("error",()=>{
//     console.log("err in store")
// })
app.use(session({
    Store,
    resave:false,
    saveUninitialized:false,
    secret:process.env.SECRET
}))
const userModel=require("./user.js")
const profileModel=require("./profile.js")
app.listen(3080)
const flash=require("connect-flash")
app.set("view engine","ejs");
app.use(express.static("./public"))

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localstart(userModel.authenticate()))
passport.serializeUser(userModel.serializeUser())
passport.deserializeUser(userModel.deserializeUser())
const msgModel=require("./msg.js")

app.get("/",(req,res,next)=>{
    res.render("indexd.ejs")
})
app.get("/sign",(req,res)=>{
    res.render("indexd.ejs")
})
c=0
app.get("/profile",isLoggedin,async (req,res)=>{
    const user=await userModel.findOne({
        username:req.session.passport.user
    })
    let allchatboxes=await userModel.find({})
    
    let id=req.user._id
    if(c==0){let msgcrtd=await msgModel.create({
        msg:`${user.username} joined the chat`,
        id:"join"
    })}
    let allmsgs=await msgModel.find({})
    
    res.render("profile",{user,allchatboxes,allmsgs,id})
})
app.get("/login",(req,res,next)=>{
    res.render("login",{error:req.flash("error")})

})
app.post("/register",async(req,res)=>{
    userData=await new userModel({
        username:req.body.username,
email:req.body.email,
fullname:req.body.fullname,
    })
    userModel.register(userData,req.body.password)
    .then((ruser)=>{
        passport.authenticate("local")(req,res,()=>{
            res.redirect("/profile")
        })
    })
})
app.post("/login",passport.authenticate("local",{
    successRedirect:"/profile",
    failureRedirect:"/login",
    failureFlash:true
}),(r)=>{

})
app.get("/logout",async(req,res,next)=>{
   
    req.logout((err)=>{
        if(err) return next(err);
       
        res.redirect("/")
       
    })
})

async function isLoggedin(req,res,next){
    if(req.isAuthenticated()){
        
        return next()
    }
   
    res.redirect("/")
}
//upload files

app.get("/profile/:id",async(req,res)=>{
    let {id}=req.params;

    let chatMate=await userModel.findById(id)
    console.log("hell")
    res.render("chatting.ejs",{chatMate})
})

app.post("/profile/msg",async(req,res)=>{
    let msgs=req.body.msgs;
    crtdmsgs=await msgModel.create({
        msg:msgs,
        id:req.user._id 
    })
    c=1;
    res.redirect("/profile")
})
