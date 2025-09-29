const isLogin = async (req, res, next)=>{
    try {
        if (req.session.admin) {
            next();

        } else {
            res.redirect('/login')
            return
        }

    } catch (error) {
        console.log(error)
    }
}


const isLogout = async (req, res, next) => {
    try {

        if (req.session.admin) {
            res.redirect('/admin/home')
            return;
        }
        next()
    } catch (error) {
        console.error(error)
    }
}



const preventAdminAccessForUser = (req, res, next) => {
    if (req.session.user) {
        res.redirect('/home'); // Redirect to user dashboard if user is logged in
    } else {
        next(); // Proceed to the next middleware/route
    }
};

module.exports ={
    isLogin,
    isLogout,
    preventAdminAccessForUser
}