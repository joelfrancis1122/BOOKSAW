const mongoose = require('mongoose')
const userSchema=mongoose.Schema({
    name:{type:String,required:false},
    email:{type:String,},
    mobile:{type:String,required:false},
    password:{type:String,required:false},
    referralCode:{type:String,unique:true},
    alreadyReffered:{type:Boolean,require:true,default:false},
    is_admin:{type:Boolean,required:false,default:false},
    is_active:{type:Boolean,required:false,default:true},
})


module.exports = mongoose.model('User',userSchema);


