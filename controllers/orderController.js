import Product from "../models/productModel.js";
import Wallet from "../models/walletModel.js";
import Orders from "../models/orderModel.js";
import User from "../models/userModel.js";
import Address from "../models/addressModel.js";

import cron from "node-cron";

const OrderCancelled = async (req, res) => {
  try {
    const orderId = req.query.id;
    const userId = req.session.user;

    const cancelledOrder = await Orders.findById(orderId);

    if (!cancelledOrder) {
      throw new Error("Cancelled order not found");
    }

    const orderItems = cancelledOrder.product;

    for (const item of orderItems) {
      const product = await Product.findById(item.productId);

      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    const orderCancelled = await Orders.findByIdAndUpdate(orderId, {
      $set: { orderStatus: "Cancelled" },
    });

    if (cancelledOrder.paymentMethod !== "Cash on delivery") {
      const wallet = await Wallet.findOne({ userId: userId });

      if (!wallet) {
        throw new Error("User wallet not found");
      }

      const totalAmount = parseFloat(cancelledOrder.totalAmount);
      wallet.balance += totalAmount;

      wallet.history.push({
        amount: totalAmount,
        type: "credit",
      });

      await wallet.save();
    }

    res.redirect("/loadProfile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const orderReturn = async (req, res) => {
  try {
    const orderId = req.query.id;
    const userId = req.session.user;
    const orderReturned = await Orders.findByIdAndUpdate(orderId, {
      $set: { orderStatus: "Returned" },
    });
    const wallet = await Wallet.findOne({ userId: userId });
    const returnedOrder = await Orders.findById(orderId);

    const orderItems = returnedOrder.product;

    for (const item of orderItems) {
      const product = await Product.findById(item.productId);

      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }
    if (returnedOrder && wallet) {
      const totalAmount = parseFloat(returnedOrder.totalAmount);

      if (totalAmount !== 0) {
        wallet.balance += totalAmount;
        wallet.history.push({
          amount: totalAmount,
          type: "credit",
        });
        await wallet.save();
      }

      res.redirect("/loadProfile");
    } else {
      throw new Error("Returned order or user wallet not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const bookCancel = async (req, res) => {
  try {
    const bookid = req.query.id;
    const userId = req.session.user;
    const cancelledBook = await Orders.findOne({
      userId: userId,
      "product._id": bookid,
    });

    if (!cancelledBook) {
      throw new Error("Order not found");
    }
    const cancelledProduct = cancelledBook.product.find(
      (item) => item._id.toString() === bookid
    );
    if (!cancelledProduct) {
      throw new Error("Product not found in the order");
    }
    cancelledProduct.productStatus = "Cancelled";
    await cancelledBook.save();
    const product = await Product.findById(cancelledProduct.productId);
    product.stock += cancelledProduct.quantity;
    await product.save();
    let cancelledAmount = cancelledProduct.price * cancelledProduct.quantity;
    if (cancelledBook.couponDiscount) {
      const discountAmount =
        (cancelledAmount * cancelledBook.couponDiscount) / 100;
      cancelledAmount -= discountAmount;
    }
    cancelledBook.totalAmount = (
      parseFloat(cancelledBook.totalAmount) - cancelledAmount
    ).toFixed(2);
    await cancelledBook.save();
    if (cancelledBook.paymentMethod !== "Cash on delivery") {
      const wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        throw new Error("User wallet not found");
      }
      wallet.balance += cancelledAmount;
      wallet.history.push({
        amount: cancelledAmount,
        type: "credit",
        createdAt: new Date(),
      });
      await wallet.save();
    }
    res.redirect("/loadProfile");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: error.message || "Failed to cancel product" });
  }
};

const bookReturn = async (req, res) => {
  try {
    const bookid = req.query.id;
    const userId = req.session.user;
    const returnedBook = await Orders.findOne({
      userId: userId,
      "product._id": bookid,
    });
    if (!returnedBook) {
      throw new Error("Order not found");
    }
    const returnedProduct = returnedBook.product.find(
      (item) => item._id.toString() === bookid
    );
    if (!returnedProduct) {
      throw new Error("Product not found in the order");
    }
    returnedProduct.productStatus = "Returned";
    await returnedBook.save();
    const product = await Product.findById(returnedProduct.productId);
    product.stock += returnedProduct.quantity;
    await product.save();
    let returnedAmount = returnedProduct.price * returnedProduct.quantity;
    if (returnedBook.couponDiscount) {
      const discountAmount =
        (returnedAmount * returnedBook.couponDiscount) / 100;
      returnedAmount -= discountAmount;
    }
    returnedBook.totalAmount = (
      parseFloat(returnedBook.totalAmount) - returnedAmount
    ).toFixed(2);
    await returnedBook.save();
    // Add amount back to wallet if not Cash on delivery
    const wallet = await Wallet.findOne({ userId: userId });
    if (!wallet) {
      throw new Error("User wallet not found");
    }

    wallet.balance += returnedAmount;
    wallet.history.push({
      amount: returnedAmount,
      type: "credit",
      createdAt: new Date(),
    });

    await wallet.save();

    res.redirect("/loadProfile");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: error.message || "Failed to return product" });
  }
};

const orderDetail = async (req, res) => {
  try {
    res.render("ordersdetail");
  } catch (error) {
    console.error(error);
  }
};

const orderSuccess = async (req, res) => {
  try {
    let userId = req.session.user;
    const userData = await User.findOne({ _id: userId });

    res.render("orderSuccess", { name: userData.name });
  } catch (error) {
    console.error(error);
  }
};

const loadInvoice = async (req, res) => {
  try {
    const userId = req.session.user;
    const productID = req.query.id;
    const userData = await User.findOne({ _id: userId });
    const orders = await Orders.findOne({ _id: productID }).populate(
      "product.productId"
    );
    const orderData = await Orders.findOne({ _id: productID });
    const addressData = await Address.findOne({ userId: userId });
    res.render("invoice", {
      orders,
      address: addressData,
      user: userData,
      orderData,
    });
  } catch (error) {
    console.error(error);
  }
};

cron.schedule("*/5 * * * * *", async () => {
  const zeroTotalOrders = await Orders.find({
    totalAmount: "0.00",
    orderStatus: { $nin: ["Cancelled", "Returned"] },
  });
  if (zeroTotalOrders.length > 0) {
    for (const order of zeroTotalOrders) {
      const orderId = order._id;
      const orderCancelled = await Orders.findByIdAndUpdate(orderId, {
        $set: { orderStatus: "Cancelled" },
      });
      if (orderCancelled) {
        console.log(`Order with ID ${orderId} has been cancelled.`);
      } else {
        console.log(`Failed to cancel order with ID ${orderId}.`);
      }
    }
  } else {
  }
});

export default {
  orderDetail,
  bookReturn,
  bookCancel,
  OrderCancelled,
  orderReturn,
  orderSuccess,
  loadInvoice,
};
