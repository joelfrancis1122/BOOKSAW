const mongoose = require('mongoose')

const {Schema} = mongoose;

const cartSchema = new mongoose.Schema({

    userId:{ type:Schema.Types.ObjectId,required:true},

     product:[
        {
            productId:{type:Schema.Types.ObjectId,ref:'Product',required:true},
            price:{type:Number},

            quantity:{type:Number,required:true} 
            
}
     ]
     
})

module.exports = mongoose.model('Cart',cartSchema)