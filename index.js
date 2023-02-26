'use strict';
require("dotenv").config();
const express = require('express');
const bodyParser = require("body-parser")
const myDB = require("./connection")
const apiRoutes = require("./routes/api.js")
const session = require("express-session");
const passport = require("passport")
const ObjectID = require('mongodb').ObjectID;
const mongoose = require("mongoose");
const MongoStore = require('connect-mongo')(session);
const localStrategy = require("passport-local");
const URI = process.env.MONGO_URI;
const store = new MongoStore({url:URI})
const path = require("path")
const bcrypt = require("bcrypt")

const app = express();

app.use("/public", express.static( __dirname + "/public"))
//app.use("/public/list", express.static( __dirname + "/public/list"))

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure: false}
}))
app.use(passport.initialize());
app.use(passport.session());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

 //custom middlewear
  function ensureAuth(req,res,next){
    
    if(req.isAuthenticated()){
      console.log("Success authenticated")
      next();
    }
    else {
      res.redirect("/");
    }
  }
//Display the main login page screen
app.get("/", (req,res)=>{
   res.sendFile(__dirname+"/public/index.html")
  });
app.get("/app", ensureAuth, (req,res)=>{
    console.log("app being accessed...")
    res.sendFile(__dirname + "/public/list/index.html");
  })


myDB(async client =>{
  
  const myDataB = await client.db('database').collection('userz');
  
  apiRoutes(app, myDataB);
  
//routes
  
   app.post("/register", (req,res,next)=>{
     const hash = bcrypt.hashSync(req.body.password, 12);
    myDataB.findOne({username: req.body.username}, (err, user)=>{
      if(err){
        console.log("err");
        next(err);
      } else if(user){
        console.log("already user")
        res.redirect("/");
      } else {
        console.log("making new user")
        myDataB.insertOne({
          username: req.body.username,
          password: hash
        }, (err, doc)=>{
          if(err){
            console.log(err)
            res.redirect("/");
          } else{
             next(null, doc)
            }
          })
        }
    })
  }, passport.authenticate("local", {failureRedirect: "/"}), (req,res)=>{
     res.redirect("/app")
  });
  
  app.post("/login", passport.authenticate("local",{failureRedirect: "/", failureMessage: "Sorry, try again"}), (req,res)=>{
    console.log("login");
    res.redirect("/app")
  });

  app.post("/logout",(req,res)=>{
    req.logout(function(err){
      if(err){return res.next(err)}
      console.log("logout");
      res.redirect("/");
    })
  });
  
  
app.post("/api/groceritem", (req,res)=>{
  const newitem = req.body;
  myDataB.updateOne({username: req.user.username}, {$push:{items:newitem}});
})
  
app.route("/api/groceritem/:id")
  .get((req,res)=>{
    myDataB.updateOne({username: req.user.username},{$pull:{items: {_id:req.params.id}}}, (err, data)=>{
      if(err){
        console.log(err);
      } else {
        return data;
      }
    })
  })

  app.route("/refresh")
    .get((req,res)=>{
      myDataB.findOne({username: req.user.username}, "items" ,(err, items)=>{
        res.send(items.items)
      })
    })
  
  
//passport stuff
  
  

  //my strategy for authenticating users on login
  passport.use(new localStrategy((user,pass,done)=>{
    myDataB.findOne({username: user}, function(err, u){
      console.log("Looking for user....");
      if(err){
        return done(err)
      };
      if(!u){
        console.log("no user")
        return done(null, false)
      };
      if(!bcrypt.compareSync(pass, u.password)){
        console.log("wrong password")
        return done(null, false)
      }
      console.log("User found...")
      return done(null, u);
    })
  }));

passport.serializeUser((user, done) => {
    console.log("Serialize")
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    console.log("Deserialize")
    myDataB.findOne({_id: new ObjectID(id)}, (err, doc) => {
      if(err){
        return console.log(err)
      }
      console.log("Deserialize success")
      return done(null, doc);
    });
  });

  

  
  
}).catch(e =>{
  console.log(e);
})




app.listen("3000", function(){
  console.log("connected!...")
})