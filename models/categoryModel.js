const mongoose = require('mongoose')
const CategorySchema=mongoose.Schema({
    categoryName:{type:String,required:true},
    Description:{type:String,required:true},
    offer:{type:Number,default:0},
    expirationDate: { type: Date},
    OfferisActive:{type:Boolean,default:true},

    is_Active:{type:Boolean,default:true}
   
})


module.exports = mongoose.model('Category',CategorySchema);


