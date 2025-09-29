const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const Product = require('../models/productModel')
const Wishlist = require('../models/wishlistModel')
const Wallet = require('../models/walletModel')
const Coupon = require('../models/couponModel')
const Address = require('../models/addressModel')
const Orders = require('../models/orderModel')
const Razorpay = require('razorpay');
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

let instance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
});

const onlinePay = async (req, res) => {
    try {
        const userId = req.session.user;
        
        const cart = await Cart.findOne({ userId });
        const address = await Address.findOne({ _id: req.body.address });
        
        function generateOrderId() {
            const timestamp = Date.now().toString();
            const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let orderId = 'ORD';
            while (orderId.length < 6) {
                const randomIndex = Math.floor(Math.random() * randomChars.length);
                orderId += randomChars.charAt(randomIndex);
            }
            return orderId + timestamp.slice(-6);
        }

        const newOrderId = generateOrderId();
        
        let productDataToSave;

        if (req.session.buyNowProductId) {
            const product = await Product.findById(req.session.buyNowProductId);
            if (product) {
                productDataToSave = [{
                    productId: product._id,
                    quantity: 1,
                    price: product.saleprice
                }];
                delete req.session.buyNowProductId;
                await req.session.save();
            }
        } else {
            productDataToSave = cart.product;
        }
        
        if (!Array.isArray(productDataToSave)) {
            productDataToSave = [productDataToSave]; // Convert to array if it's not already
        }
        
        let couponDiscount = 0;  // Default coupon discount is 0

        const { couponCode } = req.body;
        // Check if couponCode is provided
        if (couponCode) {
            const coupon = await Coupon.findOne({ couponCode: req.body.couponCode });
            console.log('couponDiscount', coupon);
            if (coupon) {
                couponDiscount = coupon.discountAmount;
            }
        }

        const order = new Orders({
            orderId: newOrderId,
            userId,
            paymentMethod: req.body.paymentMethod,
            paymentStatus: req.body.paymentStatus,
            totalAmount: req.body.amount,
            couponDiscount: couponDiscount, // Save coupon discount in order
            product: productDataToSave,
            address
        });
        
        await order.save();
        
        // Calculate the total amount in INR
        const amounts = req.body.amount * 84;
        const order2 = await instance.orders.create({
            amount: amounts * 100,
            currency: "INR",
            receipt: req.session.user
        });

        console.log(order);
        console.log(order2);

        res.json({ order2, order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const saveOrder = async(req, res) => {
    try {
        const orderId = req.body.orderId;
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId });

        let productDataToSave;

        if (req.session.buyNowProductId) {
            const product = await Product.findById(req.session.buyNowProductId);
            if (product) {
                productDataToSave = [{
                    productId: product._id,
                    quantity: 1,
                    price: product.saleprice
                }];
                delete req.session.buyNowProductId;
                await req.session.save();
            }
        } else {
            productDataToSave = cart.product;
        }

        if (!Array.isArray(productDataToSave)) {
            productDataToSave = [productDataToSave]; // Convert to array if it's not already
        }

        // Loop through each product in productDataToSave
        for (const item of productDataToSave) {
            const product = await Product.findById(item.productId);
            if (product) {
                // Update stock of the product
                product.stock -= item.quantity;
                await product.save();
            }
        }

        const order = await Orders.findOneAndUpdate(
            { orderId },
            { $set: { paymentStatus: "Received" } }, 
            { new: true } 
        );

        if (order) {
            console.log("Order payment status updated successfully");
            res.redirect("/orderSuccess");
        } else {
            console.log("Failed to update order payment status");
            res.status(404).send("Order not found");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


const getCart = async (req, res) => {
    try {
        const userId = req.session.user
        const userData = await User.findOne({ _id: userId });
        const wishlistData = await Wishlist.findOne({ userId: userId }).populate('product.productId')

        const cartData = await Cart.findOne({ userId: userId }).populate('product.productId')
        const cartLength = cartData ? cartData.product.length : 0
        const wishlistLength = wishlistData ? wishlistData.product.length : 0

        res.render("cart", { cartData, name: userData.name, cartLength, wishlistLength })
    } catch (error) {
        console.log(error.message)
    }
}


const addToCart = async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.session.user;

    
        const product = await Product.findById(productId);
        if (!product || product.stock === 0) {
            return res.status(404).json({ success: false, error: 'Product is out of stock' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) { 
            cart = new Cart({ userId, product: [] });
        }

        
        const existingProductIndex = cart.product.findIndex(item => item.productId.toString() === productId);
        if (existingProductIndex !== -1) {
            const totalQuantity = cart.product[existingProductIndex].quantity + 1;
            if (totalQuantity > product.stock) {
                return res.status(400).json({ success: false, error: 'Cannot add more items than available stock' });
            }
            cart.product[existingProductIndex].quantity = totalQuantity;
        } else {
            cart.product.push({ productId, quantity: 1, price: product.saleprice });
        }

        await cart.save();

        // Send a response indicating success along with the updated cart length
        const cartLength = cart.product.reduce((total, item) => total + item.quantity, 0);
        res.status(200).json({ success: true, message: 'Product added to cart successfully', cartLength });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};



const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user;
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, product: [] });
        }
        const productIndex = cart.product.findIndex(item => item.productId.toString() === productId);
        if (productIndex !== -1) {
            if (quantity > 0) {
                cart.product[productIndex].quantity += quantity;
            } else if (quantity < 0 && cart.product[productIndex].quantity + quantity > 0) {
                cart.product[productIndex].quantity += quantity;
            } else {
                cart.product.splice(productIndex, 1);
            }
        } else if (quantity > 0) {
            cart.product.push({ productId, quantity });
        }
        await cart.save();
        const quantityData = {
            quantity: quantity
        }
        res.status(200).json({ quantityData });
    } catch (error) {
        console.log(error.message);
    }
}



const removeItem = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            console.log("cart not found")
        }
        const productIndex = cart.product.findIndex(item => item.productId.toString() === productId);
        if (productIndex !== -1) {
            cart.product.splice(productIndex, 1);
            const updateCart = await cart.save();
            return res.status(200).send('Product removed from the cart');
        } else {
            return res.status(404).send('Product not found in the cart');
        }
    } catch (error) {
        console.error(error.message);
    }
};



const isCartEmpty = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.product.length === 0) {
            res.redirect('/home')
        } else {
            next()
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



const loadCheckOut = async (req, res) => {
    try {
        let userId = req.session.user;
        const cart = await Cart.findOne({ userId });
        const userData = await User.findOne({ _id: userId });
        const addressData = await Address.find({ userId: userId });
        const wishlistData = await Wishlist.findOne({ userId: userId }).populate('product.productId')

        const cartData = await Cart.findOne({ userId: userId }).populate('product.productId')
        const cartLength = cartData ? cartData.product.length : 0
        const wishlistLength = wishlistData ? wishlistData.product.length : 0


        res.render('checkout', { name: userData.name, cartData, addresses: addressData, cartLength, wishlistLength })
    } catch (error) {
        console.log(error)
    }
}

const loadCheckOut1 = async (req, res) => {
    try {
        let userId = req.session.user;
        let id = req.query.id
        req.session.buyNowProductId = id                           //buyNowProductId
        req.session.save()
        console.log("Req buy now id :", req.session)
        console.log("direct product buy id :", id)
        const product = await Product.findOne({ _id: id })
        console.log("The product found : ", product)
        const userData = await User.findOne({ _id: userId });
        const addressData = await Address.find({ userId: userId });
        const wishlistData = await Wishlist.findOne({ userId: userId }).populate('product.productId')
        const cartData = await Cart.findOne({ userId: userId }).populate('product.productId')

        const cartLength = cartData ? cartData.product.length : 0
        const wishlistLength = wishlistData ? wishlistData.product.length : 0


        res.render('checkout', { name: userData.name, addresses: addressData, product, cartLength, wishlistLength })
    } catch (error) {
        console.log(error)
    }
}

const placeOrder = async (req, res) => {
    try {
        console.log("inside placeorder=++++++++++++++++++++", req.body);
        const userId = req.session.user;
        const { couponCode } = req.body;
        const coupon = await Coupon.findOne({ couponCode, isActive: true, expirationDate: { $gte: Date.now() } });

        const cart = await Cart.findOne({ userId });
        const address = await Address.findOne({ _id: req.body.address });

        function generateOrderId() {
            const timestamp = Date.now().toString();
            const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let orderId = 'ORD';
            while (orderId.length < 6) {
                const randomIndex = Math.floor(Math.random() * randomChars.length);
                orderId += randomChars.charAt(randomIndex);
            }
            return orderId + timestamp.slice(-6);
        }

        const newOrderId = generateOrderId();

        const orderItems = cart.product;

        let paymentStatus = "Pending"; // default payment status

        if (req.body.paymentMethod === "Wallet") {
            paymentStatus = "Received";

            // Update the wallet balance and history
            const userWallet = await Wallet.findOne({ userId });
            if (userWallet && userWallet.balance >= req.body.amount) {
                userWallet.balance -= req.body.amount;
                userWallet.history.push({
                    amount: req.body.amount,
                    type: 'debit'
                });
                await userWallet.save();
            } else {
                return res.json({ message: "Insufficient wallet balance" });
            }
        }

        let couponDiscount = 0; // default coupon discount

        if (coupon) {
            couponDiscount = coupon.discountAmount;
        }

        let productDataToSave;

        if (req.session.buyNowProductId) {
            const product = await Product.findById(req.session.buyNowProductId);
            if (product) {
                productDataToSave = {
                    productId: product._id,
                    quantity: 1,
                    price: product.saleprice
                };
        
                // Decrease product quantity by 1
                if (product.stock > 0) {
                    product.stock -= 1;
                    await product.save();
                }
        
                delete req.session.buyNowProductId;
                await req.session.save();
            }
        } else {
            productDataToSave = cart.product;
        }

        console.log("Product data ::", productDataToSave);

        const order = new Orders({
            orderId: newOrderId,
            userId,
            paymentMethod: req.body.paymentMethod,
            paymentStatus, // set payment status
            totalAmount: req.body.amount,
            product: productDataToSave,
            address,
            couponDiscount
        });

        await order.save();

        // Update product stock for each item in the order
        for (const item of orderItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock -= item.quantity; // Subtract order quantity from product stock
                await product.save();
            }
        }

        res.status(200).json({ message: "Order Placed Successfully" });
    } catch (error) {
        console.error(error);
    }
};




const addCoupon = async (req, res) => {
    try {
        const { couponName, couponCode, minimumPurchase, discountAmount, expirationDate } = req.body;
        const existingCoupon = await Coupon.findOne({ couponCode: couponCode });
        const couponData = await Coupon.find().sort({ Date: -1 });

        // Check if the expiration date is in the past
        const today = new Date();
        const expiryDate = new Date(expirationDate);
        if (expiryDate <= today) {
            return res.render('Coupon', { expiredDate: true, couponData }); // Render page with expiredDate flag
        }

        if (existingCoupon) {
            return res.render('Coupon', { couponExists: true, couponData });
        }

        const coupon = new Coupon({
            couponName: couponName,
            couponCode: couponCode,
            minimumPurchase: minimumPurchase,
            discountAmount: discountAmount,
            expirationDate: expirationDate
        });
        const savedCoupon = await coupon.save();

        if (savedCoupon) {
            return res.redirect('/admin/loadCoupon');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



const ToggleblockCoupon = async (req, res) => {
    try {
        const Couid = req.query.Couid
        const coupons = await Coupon.findOne({ _id: Couid });
        coupons.isActive = !coupons.isActive
        await coupons.save()
        res.redirect('/admin/loadCoupon')
    } catch (error) {
        console.log(error.message)
    }
}
const removeCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body; // Assuming the coupon code is passed in the request body
        const userId = req.session.user; // Assuming you have the user's ID in the session
        console.log(userId, "userID")
        console.log(couponCode, "Coupon")
        // Find the coupon document based on the coupon code
        const updatedCoupon = await Coupon.findOneAndUpdate(
            { couponCode: couponCode },
            { $pull: { redeemedUsers: { userId: userId } } }, // Pull the user ID from the redeemedUsers array
            { new: true } // To return the updated document
        );

        if (updatedCoupon) {
            console.log("Coupon updated successfully:", updatedCoupon);
            // Handle success if needed
        } else {
            console.log("Coupon not found or user not redeemed it:", couponCode);
            // Handle not found or user not redeemed the coupon
        }

        res.redirect('/admin/loadCoupon');
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
}




const applyCoupon = async (req, res) => {
    try {
        const { couponCode, selectedAmount } = req.body;
        const userId = req.session.user;
        const coupon = await Coupon.findOne({ couponCode: couponCode, isActive: true, expirationDate: { $gte: Date.now() } });

        if (!coupon) {
            return res.json({
                success: false,
                message: 'Coupon not found or expired.'
            });
        }

        const userRedeemed = coupon.redeemedUsers.find(user => user.userId === userId);
        if (userRedeemed) {
            return res.json({
                success: false,
                message: 'Coupon has already been redeemed by the user.'
            });
        }
        if (selectedAmount < coupon.minimumPurchase) {
            return res.json({
                success: false,
                message: 'Selectected Coupon is not applicable for this price'

            });
        }

        coupon.redeemedUsers.push({ userId: userId, usedTime: new Date() });
        coupon.timesUsed++;
        await coupon.save();

        return res.status(200).json({
            success: true,
            message: 'Coupon applied successfully.',
            couponName: coupon.couponName,
            discountAmount: coupon.discountAmount
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};






const clearCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({ userId });
        cart.product = [];
        await cart.save();
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'An error occurred while clearing the cart' });
    }
};
const googleAuth = async (req, res) => {
    try {
        console.log("sdadadasd");
        const user = req.body.user;
        console.log("user ",user);
        const email = user.email
        // Check if user already exists
        let userData;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // User already exists, set session for existing user
            req.session.user = existingUser._id;
            userData = existingUser;
        } else {
            // Create a new user
            const newuser = new User({
                name: user.displayName,
                email: user.email,
                mobile:user.phoneNumber
            });

            userData = await newuser.save();
        }

        // If user data is successfully obtained, respond with success message
        if (userData) {
            console.log("User data saved successfully");
            return res.json({ success: true, message: "User data saved successfully" });
        } else {
            // If user data retrieval fails, render registration page with error message
            return res.render("registeration", { errmessage: "." });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};


module.exports = {
    getCart,
    addToCart,
    updateCart,
    removeItem,
    isCartEmpty,
    loadCheckOut,
    loadCheckOut1,
    placeOrder,
    addCoupon,
    ToggleblockCoupon,
    clearCart,
    applyCoupon,
    onlinePay,
    removeCoupon,
    saveOrder,
    googleAuth
}

