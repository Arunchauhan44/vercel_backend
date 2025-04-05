const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Define the validation schema
const addToCartSchema = Joi.object({
  productId: Joi.number().integer().required().messages({
    "number.base": "Product ID must be a number.",
    "number.integer": "Product ID must be an integer.",
    "any.required": "Product ID is required.",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "number.base": "Quantity must be a number.",
    "number.integer": "Quantity must be an integer.",
    "number.min": "Quantity must be at least 1.",
    "any.required": "Quantity is required.",
  }),
});

const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    console.log("User ID from token:", userId); 

  // Validate the request body
  const { error } = addToCartSchema.validate({ productId, quantity });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    // Ensure the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the product is already in the user's cart
    const existingCartItem = await prisma.cart.findFirst({
      where: {
        userId: userId, 
        productId: productId,
      },
    });

    if (existingCartItem) {
      // If the product is already in the cart, update the quantity
      const updatedCartItem = await prisma.cart.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
      });

      return res.status(200).json({
        message: "Cart updated successfully",
        cartItem: updatedCartItem,
      });
    }

    // If the product is not in the cart, add it
    const newCartItem = await prisma.cart.create({
      data: {
        userId: userId, // `req.user` is set by the `auth` middleware
        productId: productId,
        quantity: quantity,
      },
    });

    return res.status(201).json({
      message: "Product added to cart successfully",
      cartItem: newCartItem,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const getCartItems = async (req, res) => {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authentication failed" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        console.log("User ID from token:", userId);
    
    try {
        const cartItems = await prisma.cart.findMany({
        where: { userId: userId },
        include: { product: true }, // Include product details
        });
    
        return res.status(200).json(cartItems);
    } catch (error) {
        console.error("Error fetching cart items:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = { addToCart, getCartItems };
