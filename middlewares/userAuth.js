const User = require('../models/userModel')
const isLogin = async (req, res, next)=>{
    try {
        if (req.session.user) {

        } else {
            res.redirect('/login')
            return
        }
        next();

    } catch (error) {
        console.log(error)
    }
}


const isLogout = async (req, res, next) => {
    try {

        // if (req.session.user) {
        //     res.redirect('/home')
        //     return;
        // }
        // next()

        if (req.session.user) {
            res.redirect('/home'); // Redirect to user home page if user is logged in
        } else if (req.session.admin) {
            res.redirect('/admin/dashboard'); // Redirect to admin home page if admin is logged in
        } else {
            next(); // Proceed to the next middleware/route if neither user nor admin is logged in
        }
    } catch (error) {
        console.log(error)
    }
}


const isBlocked = async(req,res,next)=>{
    try {
        const user =await User.findById(req.session.user);
        
        if(user.is_active){
            next()
        }else{
            res.redirect('/logout');
        }
    } catch (error) {
        console.log(error.message);
    }
}



const preventUserAccessForAdmin = (req, res, next) => {
    if (req.session.admin) {
        res.redirect('/admin/home'); // Redirect to admin dashboard if admin is logged in
    } else {
        next(); // Proceed to the next middleware/route
    }
};



module.exports ={
    isLogin,
    isLogout,
    preventUserAccessForAdmin,
    isBlocked
}