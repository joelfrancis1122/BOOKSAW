const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')
const productSchema=mongoose.Schema({
    Bookname:{type:String,required:true},
    Description:{type:String,required:true},
    Categories:{type:ObjectId,ref:'Category'},
    subCategories:{type:ObjectId,ref:'SubCategory'},
    Regularprice:{type:Number,required:true},
    saleprice:{type:Number,required:true},
    stock:{type:Number,required:true},
    Images:{type:Array,required:true},
    is_Active:{type:Boolean,default:true},
    CreatedOn:{type:Date,default:Date.now}

   
})


module.exports = mongoose.model('Product',productSchema);