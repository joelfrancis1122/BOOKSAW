

import mongoose from "mongoose"
const addressSchema= mongoose.Schema({

    userId:{type:mongoose.Schema.ObjectId,ref:"User"},
    name:{type:String,required:true},
    mobile:{type:Number,required:true},
    houseName:{type:String,required:true},
    city:{type:String,required:true},
    state:{type:String,required:true},
    pinCode:{type:Number,required:true},

})

export default mongoose.model("Address", addressSchema);