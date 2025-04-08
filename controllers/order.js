const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

module.exports.placeOrder = async (req, res) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    console.log("User ID from token:", userId);

    // Validate request body
    const orderSchema = Joi.object({
      status: Joi.string()
        .valid("pending", "processing", "shipped", "delivered", "cancelled")
        .default("pending"),
      paymentId: Joi.string().optional(),
      address: Joi.string().min(10).required(), // Address must be at least 10 characters
      phone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required(), // Phone must be 10-15 digits
    });

    const { error } = orderSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { paymentId, address, phone } = req.body;

    // Fetch cart items
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate cart items
    const invalidItems = cartItems.filter(
      (item) => item.quantity <= 0 || !item.product
    );
    if (invalidItems.length > 0) {
      return res
        .status(400)
        .json({ message: "Cart contains invalid items or quantities" });
    }

    console.log("Cart Items:", cartItems);

    // Calculate total amount
    const totalAmount = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );

    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    console.log("Total Amount:", totalAmount);

    // Create the order
    const data = {
      userId: userId,
      totalAmount: parseInt(totalAmount),
      status: "processing",
      paymentId: paymentId || null,
      address,
      phone,
    };

    const newOrder = await prisma.order.create({
      data,
    });

    await prisma.cart.deleteMany({
      where: { userId },
    });


    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const templatePath = path.join(
      __dirname,
      "../views/emails/orderConformation.ejs"
    );
    const html = await ejs.renderFile(templatePath, { totalAmount, cartItems });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject: "Order Confirmation",
      html: html,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    return res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// get All orders 
module.exports.getAllOrders = async (req, res) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const orders = await prisma.order.findMany({
      where: { userId: userId },
    });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports.cancelOrder = async (req, res) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const userEmail = decoded.email; // Extract email from the token

    const { orderId } = req.params;

    // Check if the order exists and belongs to the user
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized to cancel this order" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    // Update the order status to "cancelled"
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: "cancelled" },
    });

       // Send confirmation email
       const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const templatePath = path.join(
        __dirname,
        "../views/emails/orderCancellation.ejs"
      );
      const html = await ejs.renderFile(templatePath);
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "Order Cancellation",
        html: html,
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      });

    return res.status(200).json({ message: "Order cancelled successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

