import User from "../models/userModel.js"
const isLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      return next();
    } else {
      return res.redirect('/login');
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user) {
      return res.redirect('/home');
    }
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const isBlocked = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user);
    if (!user) return res.redirect('/logout');
    if (!user.is_active) return res.redirect('/logout');
    next();
  } catch (error) {
    console.error("Error checking user block status:", error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const preventUserAccessForAdmin = (req, res, next) => {
  if (req.session.admin) return res.redirect('/admin/dashboard');
  next();
};

export default {
  isLogin,
  isLogout,
  preventUserAccessForAdmin,
  isBlocked
};