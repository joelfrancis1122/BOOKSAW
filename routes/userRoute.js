const express = require('express')
const userRoute = express()

const userControllers = require('../controllers/userController')
const cartControllers = require('../controllers/cartController')
const Auth = require('../middlewares/userAuth')



userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/users')
// userRoute.use(Auth.preventUserAccessForAdmin)


//--------------------------------------------------
userRoute.get('/', Auth.isLogout, userControllers.loadGuest)

userRoute.get('/login', Auth.isLogout, userControllers.loadlogin)
userRoute.get('/home', Auth.isLogin, Auth.isBlocked, userControllers.loadHome)
userRoute.get('/logout', Auth.isLogin, userControllers.loadLogout)
userRoute.get('/forgotPass', Auth.isLogout, userControllers.forgotPass)
userRoute.post('/forgotpassword', Auth.isLogout, userControllers.forgotpassword)
userRoute.get('/getResetPassword/:token',Auth.isLogout, userControllers.getResetPassword);
userRoute.post('/resetpassword/:token',Auth.isLogout, userControllers.resetpassword);
userRoute.post('/applyReferral', Auth.isLogin, userControllers.applyReferral)



// userRoute.get('/getContact',Auth.isLogin, userControllers.getContact);



userRoute.get('/login', Auth.isLogout, userControllers.loadlogin)

userRoute.get('/signup', Auth.isLogout, userControllers.signup)
userRoute.post('/verifySignup', Auth.isLogout, userControllers.verifySignup)


userRoute.get('/getOtp', Auth.isLogout, userControllers.getOtp)
userRoute.post('/verifyOtp', Auth.isLogout, userControllers.verifyOtp)
userRoute.post('/verifyLogin', Auth.isLogout, userControllers.verifyLogin)
userRoute.get('/shop-product', Auth.isLogin, userControllers.shopProduct)
userRoute.get("/loadProfile", Auth.isLogin, userControllers.loadProfile)
userRoute.get('/loadShop', Auth.isLogin, userControllers.loadShop)
userRoute.get('/profileEdit', Auth.isLogin, userControllers.profileEdit)
userRoute.post('/profileEdit2', Auth.isLogin, userControllers.profileEdit2)
userRoute.post('/editUsername', Auth.isLogin, userControllers.editUsername)

userRoute.get('/loadAddAddress', Auth.isLogin, userControllers.loadAddAddress)

userRoute.post('/addAddress', Auth.isLogin, userControllers.addAddress)
userRoute.post('/addAddress1', Auth.isLogin, userControllers.addAddress1)
userRoute.get('/loadEditAddress', Auth.isLogin, userControllers.loadEditAddress)
userRoute.get('/loadEditAddress1', Auth.isLogin, userControllers.loadEditAddress1)
userRoute.post('/updateAddress', Auth.isLogin, userControllers.updateAddress)
userRoute.post('/updateAddress1', Auth.isLogin, userControllers.updateAddress1)

userRoute.get('/loadOrderDetails', Auth.isLogin, userControllers.loadOrderDetails)
userRoute.get('/loadInvoice', Auth.isLogin, userControllers.loadInvoice)





userRoute.get("/cart", Auth.isLogin, Auth.isBlocked, cartControllers.getCart)
userRoute.get('/addToCart', Auth.isLogin, Auth.isBlocked, cartControllers.addToCart)
userRoute.post("/updateCart", Auth.isLogin, cartControllers.updateCart)
userRoute.post("/removeItem", Auth.isLogin, cartControllers.removeItem)
userRoute.get("/loadCheckOut", Auth.isLogin, cartControllers.isCartEmpty, cartControllers.loadCheckOut)
userRoute.get("/loadCheckOut1", Auth.isLogin,cartControllers.loadCheckOut1)
userRoute.post("/placeOrder", Auth.isLogin, cartControllers.placeOrder)
userRoute.post('/removeAddress', Auth.isLogin, userControllers.removeAddress)
userRoute.post('/clearCart', Auth.isLogin, cartControllers.clearCart)
userRoute.get("/orderCancel", Auth.isLogin, userControllers.OrderCancelled)
userRoute.get("/orderReturn", Auth.isLogin, userControllers.orderReturn)
userRoute.get("/orderDetail", Auth.isLogin, userControllers.orderDetail)
userRoute.get("/bookCancel", Auth.isLogin, userControllers.bookCancel)
userRoute.get("/bookReturn", Auth.isLogin, userControllers.bookReturn)





// userRoute.get("/categorySearch", Auth.isLogin, userControllers.categorySearch)
userRoute.post('/applyCoupon', Auth.isLogin, cartControllers.applyCoupon)
userRoute.post('/onlinepay',Auth.isLogin,cartControllers.onlinePay)
userRoute.post('/removeCoupon',Auth.isLogin,cartControllers.removeCoupon)
userRoute.post('/addTowallet',Auth.isLogin,userControllers.addTowallet)
userRoute.get("/wishlist", Auth.isLogin, userControllers.wishlist)
userRoute.get("/getWishlist", Auth.isLogin, userControllers.getWishlist)
userRoute.post("/removeWish", Auth.isLogin, userControllers.removeWish)
userRoute.get("/orderSuccess", Auth.isLogin, userControllers.orderSuccess)
userRoute.patch("/saveOrder", Auth.isLogin, cartControllers.saveOrder)
userRoute.post("/googleAuth", cartControllers.googleAuth)
// const express = require('express')
const app = express();
app.get('/orders123', (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
      const orders = [];
    const totalOrders = orders.length;
    const totalPages = Math.ceil(totalOrders / limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);
    res.render('orders', { orders: paginatedOrders, currentPage: page, totalPages });
  });

userRoute.post("/googleAuth", Auth.isLogin, userControllers.googleAuth)






















module.exports = userRoute