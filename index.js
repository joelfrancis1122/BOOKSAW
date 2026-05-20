import mongoose from "mongoose";
import nocache from 'nocache';
import flash from 'express-flash';
import Quote from 'inspirational-quotes';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
console.log(Quote.getQuote());

import userRoute from './routes/userRoute.js';
import adminRoute from './routes/adminRoute.js';
import express from 'express';
import session from "express-session";
import path from 'path';
import { fileURLToPath } from 'url'; 
import { log } from "console";
import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const app = express();
const PORT = process.env.PORT || 5001;
app.use("/public", express.static(path.join(process.cwd(), "public")));

mongoose.connect(process.env.MONGODB_URI);

app.use(nocache());
app.use(cors());
app.use(flash());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");

app.use(
  session({
    name: "userSession",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { path: "/" },
  })
);

log("ELYSIUM ON !");

app.use("/", userRoute);

app.use(
  session({
    name: "adminSession",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { path: "/admin" },
  })
);

app.use("/admin", adminRoute);

app.use('*', (req, res) => {
  res.render('users/404');
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
