const mongoose = require('mongoose')
const {Schema} = mongoose;

const walletSchema=mongoose.Schema({
    userId:{ type:Schema.Types.ObjectId,required:true},
    balance:{type:Number,default:0},
    history: [
        {
            amount: {
                type: Number
            },
            type: {
                type: String,
                enum: ['credit', 'debit']
            },
            createdAt: {
                type: Date,
                default: () => Date.now()
            }
        }
    ],

})


module.exports = mongoose.model('Wallet',walletSchema);
