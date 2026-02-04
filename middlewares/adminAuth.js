const isLogin = async (req, res, next)=>{
    try {
        if (req.session.admin) {
            next();
        } else {
           res.redirect('/admin/adminlogin')
            return
        }
    } catch (error) {
        console.log(error)
    }
}


const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin) {
            res.redirect('/admin/dashboard')
            return;
        }
        next()
    } catch (error) {
        console.error(error)
    }
}



const preventAdminAccessForUser = (req, res, next) => {
    if (req.session.user) {
        res.redirect('/home'); 
    } else {
        next(); 
    }
};

export default{
    isLogin,
    isLogout,
    preventAdminAccessForUser
}

