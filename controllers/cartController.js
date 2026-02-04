import Address from "../models/addressModel.js";
import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";
import Orders from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Wallet from "../models/walletModel.js";
import Wishlist from "../models/wishlistModel.js";
import dotenv from "dotenv";
dotenv.config();
import Razorpay from "razorpay";
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

let instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});
const onlinePay = async (req, res) => {
  try {
    const userId = req.session.user;
    const {
      address: addressId,
      paymentMethod,
      paymentStatus,
      amount,
      couponCode,
    } = req.body;

    const cart = await Cart.findOne({ userId });
    const address = await Address.findById(addressId);

    if (!address) {
      return res
        .status(400)
        .json({ success: false, message: "Address not found" });
    }

    // ✅ Generate unique order ID
    function generateOrderId() {
      const timestamp = Date.now().toString();
      const randomChars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let orderId = "ORD";
      while (orderId.length < 6) {
        const randomIndex = Math.floor(Math.random() * randomChars.length);
        orderId += randomChars.charAt(randomIndex);
      }
      return orderId + timestamp.slice(-6);
    }

    const newOrderId = generateOrderId();

    let productDataToSave = [];

    if (req.session.buyNowProductId) {
      const product = await Product.findById(req.session.buyNowProductId);
      if (product) {
        productDataToSave = [
          {
            productId: product._id,
            quantity: 1,
            price: product.saleprice,
          },
        ];
        delete req.session.buyNowProductId;
        await req.session.save();
      }
    } else if (cart && cart.product.length > 0) {
      productDataToSave = cart.product;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "No products found to order" });
    }

    // ✅ Handle optional coupon
    let couponDiscount = 0;
    if (couponCode && couponCode.trim() !== "") {
      const coupon = await Coupon.findOne({ couponCode, isActive: true });
      if (coupon) {
        if (amount >= coupon.minimumPurchase) {
          let discount = amount * (coupon.discountAmount / 100);
          if (coupon.maxDiscount > 0)
            discount = Math.min(discount, coupon.maxDiscount);
          couponDiscount = discount;

          // Mark coupon as used only AFTER successful payment
          coupon.redeemedUsers.push({ userId, usedTime: new Date() });
          coupon.timesUsed++;
          await coupon.save();
        }
      }
    }

    // ✅ Create the new order
    const order = new Orders({
      orderId: newOrderId,
      userId,
      paymentMethod,
      paymentStatus,
      totalAmount: amount,
      couponDiscount,
      product: productDataToSave,
      address,
    });

    await order.save();

    // ✅ Create Razorpay order
    const amounts = amount * 84; // USD → INR conversion (if needed)
    const order2 = await instance.orders.create({
      amount: amounts * 100,
      currency: "INR",
      receipt: userId.toString(),
    });

    return res.json({ success: true, order, order2 });
  } catch (error) {
    console.error("❌ Error in onlinePay:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { couponCode } = req.body;

    const coupon = await Coupon.findOne({
      couponCode,
      isActive: true,
      expirationDate: { $gte: Date.now() },
    });

    const cart = await Cart.findOne({ userId });
    const address = await Address.findOne({ _id: req.body.address });

    // 🆔 generate order ID
    function generateOrderId() {
      const timestamp = Date.now().toString();
      const randomChars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let orderId = "ORD";
      while (orderId.length < 6) {
        const randomIndex = Math.floor(Math.random() * randomChars.length);
        orderId += randomChars.charAt(randomIndex);
      }
      return orderId + timestamp.slice(-6);
    }

    const newOrderId = generateOrderId();
    const orderItems = cart.product;

    // 💰 default payment status
    let paymentStatus = "Pending";

    if (req.body.paymentMethod === "Wallet") {
      paymentStatus = "Received";
      const userWallet = await Wallet.findOne({ userId });

      if (userWallet && userWallet.balance >= req.body.amount) {
        userWallet.balance -= req.body.amount;
        userWallet.history.push({
          amount: req.body.amount,
          type: "debit",
        });
        await userWallet.save();
      } else {
        return res.json({ message: "Insufficient wallet balance" });
      }
    }
    let couponDiscount = 0;

    if (coupon && req.body.couponCode) {
      const totalAmount = req.body.amount;

      if (totalAmount >= coupon.minimumPurchase) {
        let discount = totalAmount * (coupon.discountAmount / 100);

        if (coupon.maxDiscount && coupon.maxDiscount > 0) {
          discount = Math.min(discount, coupon.maxDiscount);
        }

        couponDiscount = discount;

        // ✅ mark coupon as used only after payment success
        coupon.redeemedUsers.push({ userId, usedTime: new Date() });
        coupon.timesUsed++;
        await coupon.save();
      }
    }

    // 🛒 save order product details
    let productDataToSave;

    if (req.session.buyNowProductId) {
      const product = await Product.findById(req.session.buyNowProductId);
      if (product) {
        productDataToSave = {
          productId: product._id,
          quantity: 1,
          price: product.saleprice,
        };

        // update stock
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

    // 🧾 create and save order
    const order = new Orders({
      orderId: newOrderId,
      userId,
      paymentMethod: req.body.paymentMethod,
      paymentStatus,
      totalAmount: req.body.amount,
      product: productDataToSave,
      address,
      couponDiscount,
    });

    await order.save();

    // 🏷️ update product stocks
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    res.status(200).json({ message: "Order Placed Successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong while placing order." });
  }
};

const saveOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const userId = req.session.user;

    const cart = await Cart.findOne({ userId });

    let productDataToSave;

    if (req.session.buyNowProductId) {
      const product = await Product.findById(req.session.buyNowProductId);
      if (product) {
        productDataToSave = [
          {
            productId: product._id,
            quantity: 1,
            price: product.saleprice,
          },
        ];
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
      res.redirect("/orderSuccess");
    } else {
      res.status(404).send("Order not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    const wishlistData = await Wishlist.findOne({ userId: userId }).populate(
      "product.productId"
    );

    const cartData = await Cart.findOne({ userId: userId }).populate(
      "product.productId"
    );
    const cartLength = cartData ? cartData.product.length : 0;
    const wishlistLength = wishlistData ? wishlistData.product.length : 0;

    res.render("cart", {
      cartData,
      name: userData.name,
      cartLength,
      wishlistLength,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res) => {
  try {
    const productId = req.query.id;
    const userId = req.session.user;

    const product = await Product.findById(productId);
    if (!product || product.stock === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, product: [] });
    }

    const existingProductIndex = cart.product.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (existingProductIndex !== -1) {
      const totalQuantity = cart.product[existingProductIndex].quantity + 1;
      if (totalQuantity > product.stock) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Cannot add more items than available stock",
          });
      }
      cart.product[existingProductIndex].quantity = totalQuantity;
    } else {
      cart.product.push({ productId, quantity: 1, price: product.saleprice });
    }

    await cart.save();

    // Send a response indicating success along with the updated cart length
    const cartLength = cart.product.reduce(
      (total, item) => total + item.quantity,
      0
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Product added to cart successfully",
        cartLength,
      });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
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
    const productIndex = cart.product.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (productIndex !== -1) {
      if (quantity > 0) {
        cart.product[productIndex].quantity += quantity;
      } else if (
        quantity < 0 &&
        cart.product[productIndex].quantity + quantity > 0
      ) {
        cart.product[productIndex].quantity += quantity;
      } else {
        cart.product.splice(productIndex, 1);
      }
    } else if (quantity > 0) {
      cart.product.push({ productId, quantity });
    }
    await cart.save();
    const quantityData = {
      quantity: quantity,
    };
    res.status(200).json({ quantityData });
  } catch (error) {
    console.log(error.message);
  }
};

const removeItem = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log("cart not found");
    }
    const productIndex = cart.product.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (productIndex !== -1) {
      cart.product.splice(productIndex, 1);
      const updateCart = await cart.save();
      return res.status(200).send("Product removed from the cart");
    } else {
      return res.status(404).send("Product not found in the cart");
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
      res.redirect("/home");
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loadCheckOut = async (req, res) => {
  try {
    let userId = req.session.user;
    const cart = await Cart.findOne({ userId });
    const userData = await User.findOne({ _id: userId });
    const addressData = await Address.find({ userId: userId });
    const wishlistData = await Wishlist.findOne({ userId: userId }).populate(
      "product.productId"
    );

    const cartData = await Cart.findOne({ userId: userId }).populate(
      "product.productId"
    );
    const cartLength = cartData ? cartData.product.length : 0;
    const wishlistLength = wishlistData ? wishlistData.product.length : 0;

    res.render("checkout", {
      name: userData.name,
      cartData,
      addresses: addressData,
      cartLength,
      wishlistLength,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadCheckOut1 = async (req, res) => {
  try {
    let userId = req.session.user;
    let id = req.query.id;
    req.session.buyNowProductId = id;
    req.session.save();
    const product = await Product.findOne({ _id: id });
    const userData = await User.findOne({ _id: userId });
    const addressData = await Address.find({ userId: userId });
    const wishlistData = await Wishlist.findOne({ userId: userId }).populate(
      "product.productId"
    );
    const cartData = await Cart.findOne({ userId: userId }).populate(
      "product.productId"
    );

    const cartLength = cartData ? cartData.product.length : 0;
    const wishlistLength = wishlistData ? wishlistData.product.length : 0;

    res.render("checkout", {
      name: userData.name,
      addresses: addressData,
      product,
      cartLength,
      wishlistLength,
    });
  } catch (error) {
    console.log(error);
  }
};

const addCoupon = async (req, res) => {
  try {
    const {
      couponName,
      couponCode,
      minimumPurchase,
      discountAmount,
      maxDiscount,
      expirationDate,
    } = req.body;
    const existingCoupon = await Coupon.findOne({ couponCode });
    const couponData = await Coupon.find().sort({ Date: -1 });

    const today = new Date();
    const expiryDate = new Date(expirationDate);
    if (expiryDate <= today) {
      return res.render("Coupon", { expiredDate: true, couponData });
    }

    if (existingCoupon) {
      return res.render("Coupon", { couponExists: true, couponData });
    }

    const coupon = new Coupon({
      couponName,
      couponCode,
      minimumPurchase,
      discountAmount,
      maxDiscount, // ⚡ new field
      expirationDate,
    });

    const savedCoupon = await coupon.save();

    if (savedCoupon) {
      return res.redirect("/admin/loadCoupon");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const ToggleblockCoupon = async (req, res) => {
  try {
    const Couid = req.query.Couid;
    const coupons = await Coupon.findOne({ _id: Couid });
    coupons.isActive = !coupons.isActive;
    await coupons.save();
    res.redirect("/admin/loadCoupon");
  } catch (error) {
    console.log(error.message);
  }
};
const removeCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body; // Assuming the coupon code is passed in the request body
    const userId = req.session.user; // Assuming you have the user's ID in the session
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

    res.redirect("/admin/loadCoupon");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, selectedAmount } = req.body;
    const userId = req.session.user;

    const coupon = await Coupon.findOne({
      couponCode,
      isActive: true,
      expirationDate: { $gte: Date.now() },
    });

    if (!coupon)
      return res.json({
        success: false,
        message: "Coupon not found or expired.",
      });

    if (coupon.redeemedUsers.find((u) => u.userId === userId)) {
      return res.json({ success: false, message: "Coupon already used." });
    }

    if (selectedAmount < coupon.minimumPurchase) {
      return res.json({
        success: false,
        message: "Not applicable for this price.",
      });
    }

    let discount = selectedAmount * (coupon.discountAmount / 100);
    if (coupon.maxDiscount > 0)
      discount = Math.min(discount, coupon.maxDiscount);

    // ✅ only return discount, don’t mark used yet
    return res.json({
      success: true,
      message: "Coupon valid!",
      discountAmount: discount,
      couponId: coupon._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const cart = await Cart.findOne({ userId });
    cart.product = [];
    await cart.save();
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res
      .status(500)
      .json({ error: "An error occurred while clearing the cart" });
  }
};
const googleAuth = async (req, res) => {
  try {
    const user = req.body.user;
    const email = user.email;
    // Check if user already exists
    let userData;
    const existingUser = await User.findOne({ email });
    const generateReferralCode = () => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
      }
      return code;
    };
    const referralCode = generateReferralCode();
    if (existingUser) {
      // User already exists, set session for existing user
      req.session.user = existingUser._id;
      userData = existingUser;
    } else {
      // Create a new user
      const newuser = new User({
        name: user.displayName,
        email: user.email,
        mobile: user.phoneNumber,
        referralCode: referralCode,
      });

      userData = await newuser.save();
    }

    // If user data is successfully obtained, respond with success message
    if (userData) {
      req.session.user = userData._id;
      return res.json({
        success: true,
        message: "User data saved successfully",
      });
    } else {
      // If user data retrieval fails, render registration page with error message
      return res.render("registeration", { errmessage: "." });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};

export default {
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
  googleAuth,
};
