const mongoose = require('mongoose')
const SubCategorySchema=mongoose.Schema({
    subCategoryName:{type:String,required:true,unique:true},
    Description:{type:String,required:true},
    is_Active:{type:Boolean,default:true}
   
})


module.exports = mongoose.model('SubCategory',SubCategorySchema);


