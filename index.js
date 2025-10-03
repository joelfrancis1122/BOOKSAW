const mongoose = require("mongoose");
const nocache = require('nocache');
const flash = require('express-flash');
const dotenv = require('dotenv').config()
const Quote = require('inspirational-quotes');
const cors = require('cors')
// const Razorpay = require('razorpay');
// var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

console.log(Quote.getQuote()); // returns quote (text and author)





// var instance = new Razorpay({
//   key_id: RAZORPAY_ID_KEY,
//   key_secret: RAZORPAY_SECRET_KEY,
// });




// ss 

// var options = {
//   amount: re.body.amount,  // amount in the smallest currency unit
//   currency: "INR",
//   receipt: "rcp1"
// };
// instance.orders.create(options, function(err, order) {
//   console.log(order);
//   res.send({orderId:order.id})
// });








const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

const express = require('express')
const app = express();

const path = require('path')
const bcrypt = require('bcrypt')
const session = require("express-session");
const { log } = require("console");

// mongoose.connect('mongodb://localhost:27017/ElysiumProject')
const PORT = process.env.PORT || 5001

mongoose.connect(process.env.MONGODB_URI);

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(nocache());
app.use(cors())

app.use(flash());

app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.set("view engine", "ejs");



app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

log("ELYSIUM ON !");

app.use("/", userRoute);
app.use("/admin", adminRoute);


app.use('*', (req, res) => {
  res.render('users/404')
})



app.listen(PORT, () => {
  console.log("Server started on http://localhost:5001");
});
