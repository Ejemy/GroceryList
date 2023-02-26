'use strict';
const mongoose    = require("mongoose");
const passport    = require("passport");
const localStrategy = require("passport-local");
const ObjectID = require('mongodb').ObjectID;
const path = require("path")


require('dotenv').config();

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });


///////////////////////////////////////////////////////////////////

  

module.exports = function (app, myDataB){


 


  
};