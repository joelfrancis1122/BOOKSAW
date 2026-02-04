import express from "express"
const adminRoute = express()
import MulterImage from "../config/multer.js"

adminRoute.set('view engine', 'ejs')
adminRoute.set('views', './views/admin')

import adminControllers from "../controllers/adminController.js"
import productControllers from "../controllers/productController.js"
import cartControllers from "../controllers/cartController.js"
import Auth from "../middlewares/adminAuth.js"


adminRoute.post('/verifyLogin',Auth.isLogout, adminControllers.verifyLogin)
adminRoute.get('/adminlogin',Auth.isLogout, adminControllers.adminlogin)
adminRoute.get('/dashboard', Auth.isLogin, adminControllers.dashboardLoad)
adminRoute.get('/productslist', Auth.isLogin, adminControllers.productslist)
adminRoute.get('/loadaddproduct', Auth.isLogin, productControllers.loadaddproduct)
adminRoute.post('/addProduct', Auth.isLogin, MulterImage.array('Images', 5), productControllers.addProduct)
adminRoute.get('/loadeditProduct', Auth.isLogin, productControllers.loadeditProduct)
adminRoute.post('/editProduct', Auth.isLogin, MulterImage.array('Images', 5), productControllers.editProduct)
adminRoute.get('/ToggleblockSubCategories', Auth.isLogin, adminControllers.ToggleblockSubCategories)
adminRoute.get('/ToggleblockProduct', Auth.isLogin, productControllers.ToggleblockProduct)
adminRoute.get('/ToggleblockUser', Auth.isLogin, adminControllers.ToggleblockUser)
adminRoute.get('/ToggleblockCategories', Auth.isLogin, adminControllers.ToggleblockCategories)
adminRoute.get('/loadCategories', Auth.isLogin, adminControllers.loadCategories)
adminRoute.get('/loadSubCategories', Auth.isLogin, adminControllers.loadSubCategories)
adminRoute.post('/addCategories', Auth.isLogin, adminControllers.addCategories)
adminRoute.post('/addSubCategories', Auth.isLogin, adminControllers.addSubCategories)
adminRoute.get('/loadeditCategory',Auth.isLogin,adminControllers.loadeditCategory)
adminRoute.get('/loadeditSubCategory',Auth.isLogin,adminControllers.loadeditSubCategory)
adminRoute.post('/editCategory',Auth.isLogin,adminControllers.editCategory)
adminRoute.post('/editSubCategory',Auth.isLogin,adminControllers.editSubCategory)
adminRoute.get('/loaduserlist', Auth.isLogin, adminControllers.loaduserlist)
adminRoute.get('/loadOrders', Auth.isLogin, adminControllers.loadOrders)
adminRoute.get('/loadOrderDetails', Auth.isLogin, adminControllers.loadOrderDetails)
adminRoute.get('/loadCoupon', Auth.isLogin, adminControllers.loadCoupon)
adminRoute.post('/addCoupon', Auth.isLogin, cartControllers.addCoupon)
adminRoute.get('/ToggleblockCoupon', Auth.isLogin, cartControllers.ToggleblockCoupon)
adminRoute.post('/couponDelete', Auth.isLogin, adminControllers.couponDelete)
adminRoute.post('/removeImage', Auth.isLogin, productControllers.removeImage)
adminRoute.get('/adminOrderpending', Auth.isLogin, adminControllers.adminOrderPending)
adminRoute.get('/adminOrderShipped', Auth.isLogin, adminControllers.adminOrderShipped)
adminRoute.get('/adminOrderDelivered', Auth.isLogin, adminControllers.adminOrderDelivered)
adminRoute.get('/adminOrderReturned', Auth.isLogin, adminControllers.adminOrderReturned)
adminRoute.get('/adminOrderCancelled', Auth.isLogin, adminControllers.adminOrderCancelled)
adminRoute.get('/salesReport', Auth.isLogin, adminControllers.salesReport)
adminRoute.post('/salesreportsearch', Auth.isLogin, adminControllers.salesreportsearch)
adminRoute.get('/adminOffers', Auth.isLogin, adminControllers.adminOffers)
adminRoute.post('/applyAdminOffers', Auth.isLogin, adminControllers.applyAdminOffers)
adminRoute.get('/logout', Auth.isLogin, adminControllers.loadLogout)


export default adminRoute

