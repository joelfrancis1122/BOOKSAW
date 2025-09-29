const mongoose = require('mongoose')

const {Schema} = mongoose;

const wishlistSchema = new mongoose.Schema({

    userId:{ type:Schema.Types.ObjectId,required:true},

     product:[
        {
            productId:{type:Schema.Types.ObjectId,ref:'Product',required:true},
            quantity:{type:Number,required:true} 
            
}
     ]
     
})

module.exports = mongoose.model('Wishlist',wishlistSchema)