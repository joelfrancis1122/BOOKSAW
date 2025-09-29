const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
    couponName: { type: String, required: true },
    couponCode: { type: String, required: true, unique: true },
    minimumPurchase: { type: Number },
    discountAmount: { type: Number,default:0 },
    expirationDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    timesUsed: { type: Number, default:1 },
    redeemedUsers:[{userId:{type:String},usedTime:{type:Date}}],
    Date: { type: Date, default: Date.now }
});


 

module.exports = mongoose.model('Coupon', couponSchema);
 