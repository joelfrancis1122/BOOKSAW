const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const User = require('../models/userModel')
const Coupon = require('../models/couponModel')
const Orders = require('../models/orderModel')
const SubCategory = require('../models/subcategoryModel')
const cron = require('node-cron');
const dashboardLoad = async (req, res) => {
    try {
        const orders = await Orders.find();
        const categories = await Category.find();
        const products = await Product.find();
        const orderCountsByMonth = Array.from({ length: 12 }, () => 0);
        orders.forEach(order => {
            const monthIndex = order.orderDate.getMonth();
            orderCountsByMonth[monthIndex]++;
        });
        const productCountsByMonth = Array.from({ length: 12 }, () => 0);
        products.forEach(product => {
            const monthIndex = product.CreatedOn.getMonth();
            productCountsByMonth[monthIndex]++;
        });
        const orderCountsByYearData = await Orders.aggregate([
            {
                $group: {
                    _id: { $year: "$orderDate" },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);
        const orderCountsByYear = [];
        let currentYearIndex = 0;
        const currentYear = new Date().getFullYear();

        for (let i = 0; i < orderCountsByYearData.length; i++) {
            const year = orderCountsByYearData[i]._id;
            const orderCount = orderCountsByYearData[i].orderCount;

            while (currentYear - 5 + currentYearIndex < year) {
                orderCountsByYear.push(0);
                currentYearIndex++;
            }

            orderCountsByYear.push(orderCount);
            currentYearIndex++;
        }

        while (currentYear - 5 + currentYearIndex <= currentYear + 6) {
            orderCountsByYear.push(0);
            currentYearIndex++;
        }


        const productCountsByYearData = await Product.aggregate([
            {
                $group: {
                    _id: { $year: "$CreatedOn" },
                    productCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);
        const productCountsByYear = [];
        let currentYearIndex1 = 0;
        const currentYear1 = new Date().getFullYear();
        
        for (let i = 0; i < productCountsByYearData.length; i++) {
            const year = productCountsByYearData[i]._id;
            const productCount = productCountsByYearData[i].productCount;
        
            while (currentYear1 - 5 + currentYearIndex1 < year) {
                productCountsByYear.push(0);
                currentYearIndex1++;
            }
        
            productCountsByYear.push(productCount);
            currentYearIndex1++;
        }
        
        while (currentYear1 - 5 + currentYearIndex1 <= currentYear1 + 6) {
            productCountsByYear.push(0);
            currentYearIndex1++;
        }


        const totalAmountByYearData = await Orders.aggregate([
            {
                $group: {
                    _id: { $year: "$orderDate" },
                    totalAmount: { $sum: { $toDouble: "$totalAmount" } }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);
        
        const totalAmountByYear = [];
        let currentYearIndex2 = 0;
        const currentYear2 = new Date().getFullYear();
        
        for (let i = 0; i < totalAmountByYearData.length; i++) {
            const year = totalAmountByYearData[i]._id;
            const totalAmount = totalAmountByYearData[i].totalAmount;
        
            while (currentYear2 - 5 + currentYearIndex2 < year) {
                totalAmountByYear.push(0);
                currentYearIndex2++;
            }
        
            totalAmountByYear.push(totalAmount);
            currentYearIndex2++;
        }
        
        while (currentYear2 - 5 + currentYearIndex2 <= currentYear2 + 6) {
            totalAmountByYear.push(0);
            currentYearIndex2++;
        }
        const bestSellingProduct = await Orders.aggregate([
            {
                $unwind: "$product"
            },
            {
                $group: {
                    _id: "$product.productId",
                    totalSales: { $sum: "$product.quantity" }
                }
            },
            {
                $sort: { totalSales: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $project: {
                    productName: "$product.Bookname",
                    totalSales: 1
                }
            }
        ]);

        const bestSellingCategories = await Orders.aggregate([
            {
                $unwind: "$product"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$productInfo"
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "productInfo.Categories",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: "$category"
            },
            {
                $group: {
                    _id: "$category._id",
                    name: { $first: "$category.categoryName" },
                    totalSales: { $sum: "$product.quantity" }
                }
            },
            {
                $sort: { totalSales: -1 }
            },
            {
                $limit: 10
            }
        ]);


        


        const totalAmountByMonth = [];
let currentMonthIndex = 0;
const currentYear123 = new Date().getFullYear();

for (let i = 0; i < 12; i++) {
    totalAmountByMonth.push(0);
}

orders.forEach(order => {
    const monthIndex = order.orderDate.getMonth();
    const totalAmount = parseFloat(order.totalAmount);

    totalAmountByMonth[monthIndex] += totalAmount;
});

for (let i = 0; i < 12; i++) {
    if (totalAmountByMonth[i] === 0) {
        totalAmountByMonth[i] = 0;
    }
}
          console.log('-------------------------------------',orderCountsByYear)
  
    
        console.log(orderCountsByMonth, "3333333333333333333333333333333333333333");
        console.log("---------------------------------------");
        // console.log(totalAmountByYear, "444444444444444444444444444444444444");

        res.render('admindashboard', { 
            orders, 
            categories, 
            orderCountsByMonth, 
            productCountsByMonth, 
            orderCountsByYear, 
            productCountsByYear, 
            bestSellingProduct, 
            bestSellingCategories ,
            totalAmountByMonth,
            totalAmountByYear
        });
    } catch (error) {
        console.error(error);
    }
};




const adminLogin = async(req,res)=>{
    try{
res.render('login')
    }catch{
        console.error(error)
    }
}




const productslist = async(req,res)=>{ 
    try{
        console.log('worked ')
        let search = req.query.search ? req.query.search : "" 
        const productData = await Product.find({
            $and:[{
            Bookname: { $regex: new RegExp(search, "i") } },
            ],
        }).populate('Categories').sort({ CreatedOn: -1 })
        console.log('k',productData)
        res.render('productslist',{product:productData,search:search})
    }catch(error){
console.error(error);
    }
}


//=======================categories================================\\

const loadCategories = async(req,res)=>{
    try {
        const catData = await Category.find()
           if(catData){
          res.render('addcategories',{categories : catData})
           }
    } catch (error) {
        console.log(error.message);
    }
}


const loadSubCategories = async(req,res)=>{
    try {
        const catData = await SubCategory.find()
           if(catData){
          res.render('addSubCategories',{categories : catData})
           }
    } catch (error) {
        console.log(error.message);
    }
}


const addCategories = async (req, res) => {
    try {
        const { categoryName, Description } = req.body;
        const catData = await Category.find()
        const existingCategory = await Category.findOne({ categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } });
        if (existingCategory) {
            return res.render('addcategories', { categoriesExists: true ,categories : catData}); 
        }else if(!existingCategory){
            
            
            
            const categories = new Category({
                categoryName: categoryName,
                Description: Description,
            });
            const categoryData = await categories.save();
            return res.render('addcategories', { categoriesExistss:true ,categories : catData}); 

            
         
         
         
    }

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};


const addSubCategories = async (req, res) => {
    try {
        const { subCategoryName, Description } = req.body;
        const catData = await SubCategory.find()
        const existingCategory = await SubCategory.findOne({ subCategoryName: { $regex: new RegExp('^' + subCategoryName + '$', 'i') } });
        if (existingCategory) {
            console.log("catrt//////////////",catData)
            return res.render('addSubcategories', { categoriesExists: true ,categories : catData}); 
        }
        const categories = new SubCategory({
            subCategoryName: subCategoryName,
            Description: Description,
        });
        const categoryData = await categories.save();
        res.redirect('/admin/loadSubCategories');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};



const loadeditCategory = async(req,res)=>{
try {
    const categories = await Category.findById(req.query.id);
    req.session.cateid=req.query.id
    res.render('editcategories',{categories})
} catch (error) {
    console.error(error)
}}

const loadeditSubCategory = async(req,res)=>{
 try{
    const categories = await SubCategory.findById(req.query.id);
    req.session.subcateid=req.query.id
    res.render('editSubcategories',{categories})
 }catch(error){
    console.log(error)
 } 
}

const editCategory = async(req,res)=>{
    try{
        const { categoryName,Description,catid} = req.body
        console.log("req.dsfsfsd fsdfdsf",req.body)
        const existingCategory = await Category.findOne({_id: { $ne: req.session.cateid }, categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } });
        if(existingCategory){
             res.json({ success: false, error: 'Category name must be unique' });       
         }else{
             res.json({ success: true, error: 'Category name changed successfull' });       

             const updated = await Category.findByIdAndUpdate({ _id:  req.session.cateid }, { $set: {  categoryName, Description } })
            //  res.redirect("/admin/loadCategories")
             console.log(updated)
         }
    }catch(error){
        console.log(error.message)
        
    }
}

const editSubCategory = async (req, res) => {
    try {
        const { subCategoryName, Description, catid } = req.body;
        console.log(req.body, "sakldhlasdajldslh");

        const existingCategory = await SubCategory.findOne({_id: { $ne: req.session.subcateid }, subCategoryName: { $regex: new RegExp('^' + subCategoryName + '$', 'i') }
        });

        if (existingCategory) {
            return res.json({ success: false, error: 'SubCategory name must be unique' });
        } else {
            // Update the SubCategory
            const updated = await SubCategory.findByIdAndUpdate(
                req.session.subcateid,
                { $set: { subCategoryName, Description } }
            );

            console.log(updated, "are you updated");

            // Send success response after updating
            res.json({ success: true, error: 'SubCategory name changed successfully' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: 'SubCategory name must be unique2' });
    }
}



const ToggleblockCategories = async (req,res)=>{
    try{
        const catid= req.query.catid
        const categories = await Category.findOne({_id:catid}); 
        categories. is_Active=!categories. is_Active
        await categories.save()
        res.redirect('/admin/loadCategories');
    } catch (error) {
        console.error(error);
    }
}



const ToggleblockSubCategories = async (req,res)=>{
    try{
        const catid= req.query.catid
        const categories = await SubCategory.findOne({_id:catid}); 
        categories. is_Active=!categories. is_Active
        await categories.save()
        res.redirect('/admin/loadSubCategories');
    } catch (error) {
        console.error(error);
    }
}


const loaduserlist = async (req, res) => {
    try {
        const userData = await User.find({is_admin:false})
        res.render('userlist',{users:userData})
    } catch (error) {
        console.error(error)
    }
}



const ToggleblockUser = async (req,res)=>{
    try{
        const id= req.query.id
        const user = await User.findOne({_id:id}); // why new true
        user.is_active=!user.is_active
        await user.save()
        res.redirect('/admin/loaduserlist');
    } catch (error) {
        console.error(error);
    }
}



const loadOrders = async (req,res)=>{
    try {
        const userId = req.session.user;
        const orders = await Orders.find();
        res.render("orderList",{orders:orders})
    } catch (error) {
        console.log(error.message)  
    }
}



const loadOrderDetails = async (req,res)=>{
    try {
        const productId = req.query.id
        const orders = await Orders.findOne({ _id:productId}).populate('product.productId')
        const orderData = await Orders.findOne({ _id:productId})
        res.render("ordersview",{orders,orderData})
    } catch (error) {
        console.log(error.message)  
    }
}



const loadCoupon = async (req, res) => {
    try {
        const couponData = await Coupon.find().sort({ Date: -1 })
        res.render('Coupon',{couponData})
    } catch (error) {
        console.error(error)
    }
}



const loadLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.error(error)
    }
}



const adminOrderPending= async(req,res)=>{
    try {
        const orderId= req.query.id
        const orderPending= await Orders.findByIdAndUpdate(orderId,{$set:{orderStatus:"Order Placed"}})
        res.redirect('/admin/loadOrders')
    } catch (error) {
        console.log(error.message)
    }
}



const adminOrderShipped= async(req,res)=>{
    try {
        const orderId= req.query.id
        const orderShipped =await Orders.findByIdAndUpdate(orderId,{$set:{ orderStatus:'Shipped'}})
         res.redirect('/admin/loadOrders')
    } catch (error) {
        console.log(error.message)
    }
}



const adminOrderDelivered=async(req,res)=>{
    try {
        const orderId= req.query.id
        const orderDelivered= await  Orders.findByIdAndUpdate(orderId,{$set:{orderStatus:'Delivered'}})
         res.redirect('/admin/loadOrders')
    } catch (error) {
        console.log(error.message)
    }
}



const adminOrderReturned=async(req,res)=>{
    try {
        const orderId= req.query.id
        const orderReturned= await  Orders.findByIdAndUpdate(orderId,{$set:{orderStatus:'Returned'}})
        res.redirect('/admin/loadOrders')
    } catch (error) {
        console.log(error.message)
    }
}


const adminOrderCancelled=async(req,res)=>{
    try {
        const orderId= req.query.id
        const OrderCancelled= await Orders.findByIdAndUpdate(orderId,{$set:{orderStatus:'Cancelled'}})
        res.redirect('/admin/loadOrders')
    } catch (error) {
        console.log(error.message)
    }
}


const salesReport = async(req,res)=>{
    try {

        const orderList = await Orders.find().populate("userId")
        const coupon = await Coupon.find()
        res.render("salesReport",{orderList,coupon})
    } catch (error) {
        console.error(error)
    }
}


const salesreportsearch = async(req,res)=>{
    try{
        
  
    const {start,end}= req.body;
    const endOfDay = new Date(end);
    endOfDay.setHours(23,59,59,999);
    const orderList = await Orders.find({
        orderDate:{$gte:new Date(start),$lte:endOfDay}

    }).populate('userId')
    res.render('salesReport',{orderList,start,end})



    }catch(error){
        console.error(error)
    }

}
const couponDelete = async (req, res) => {
    try {
        const couponId = req.query.id;

        console.log("couponId------------",couponId)
        const deletedCoupon = await Coupon.findOneAndDelete({ _id: couponId });

        if (deletedCoupon) {
            return res.json({ success: true, message: "Coupon deleted successfully" });
        } else {
            return res.json({ success: false, message: "Coupon not found" });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}



const adminOffers = async(req,res)=>{
    try {
        
        const catData = await Category.find()
        const product = await Product.find()
           if(catData){
          res.render('adminOffer',{categories : catData,product})
           }
    } catch (error) {
        console.log(error.message);
    }
}

const applyAdminOffers = async(req,res)=>{
    try{
        const { categoryId, discount, expiry } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(
          categoryId,
          { offer: discount, expirationDate: expiry, OfferisActive: true },
          { new: true } 
        );
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
          }

          const productsToUpdate = await Product.find({ Categories: categoryId });
          if (!productsToUpdate) {
            console.log("============================================================")
            return res.status(404).json({ message: 'product not found' });
          }
          console.log("productsToUpdate++++++++++++++++++++++++++",productsToUpdate)
          for (const product of productsToUpdate) {
          const updatedPrice = Math.round(product.saleprice * ((100 - discount) / 100));
          product.saleprice = updatedPrice;
          console.log(updatedPrice,"++++++++++++++++ssadhgsadhsadghdsghasdghhdashsadhashhgasdhhgasdhgasdghgasghaahdhgadhj")
          await product.save();
         }

          res.status(200).json({ message: 'Offer applied successfully', category: updatedCategory });
          
    }catch(error){
        console.log(error.message)
    }
}



const checkingAdminOffers = async () => {
    try {
    
    const expiredCategories = await Category.find({ expirationDate: { $lte: new Date() }, OfferisActive: true });

    for (const category of expiredCategories) {
      
        category.offer = 0;
        category.expirationDate = null;
        category.OfferisActive = false;
        await category.save();

       
        const productsToUpdate = await Product.find({Categories:category._id});
        for (const product of productsToUpdate) {
            product.saleprice = product.Regularprice;
            await product.save();
        }
    }

        console.log('Expired offers checked and reset successfully.');

        
    } catch (error) {
     console.error('Error checking and resetting expired offers:', error);
   }
};

 cron.schedule('0 0 * * *', checkingAdminOffers);



module.exports = {
    dashboardLoad,
    adminLogin,
    productslist,
    addCategories,
    loadCategories,
    loaduserlist,
    loadLogout,
    loadOrders,
    loadOrderDetails,
    loadCoupon,
    ToggleblockCategories,
    ToggleblockUser,
    adminOrderReturned,
    adminOrderDelivered,        
    adminOrderShipped,
    adminOrderPending,
    loadeditCategory,
    editCategory,
    adminOrderCancelled,
    loadSubCategories,
    ToggleblockSubCategories,
    addSubCategories,
    salesReport,
    salesreportsearch,
    couponDelete,
    adminOffers,
    applyAdminOffers,
    loadeditSubCategory,
    editSubCategory

}