import mongoose from "mongoose"
const SubCategorySchema=mongoose.Schema({
    subCategoryName:{type:String,required:true,unique:true},
    Description:{type:String,required:true},
    is_Active:{type:Boolean,default:true}
   
})




export default mongoose.model('SubCategory',SubCategorySchema);