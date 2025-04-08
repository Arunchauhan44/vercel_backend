const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
require("dotenv").config();

//GET ALL PRODUCTS
module.exports.product = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET PRODUCT BY ID
module.exports.productId = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// CREATE PRODUCT
module.exports.createProduct = async (req, res) => {
  console.log("Uploaded file:", req.file);

  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication failed" });
  }
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const role = decoded.role;
  console.log("User role from token:", role);
  if (role !== "admin") {
    return res
      .status(403)
      .json({ message: "Only admin can be able to add product" });
  }

  const image = req.file ? req.file.filename : "";

  const productSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().required(),
    description: Joi.string().required(),
    stock: Joi.number().required(),
    category: Joi.string().required(),
    //image: Joi.string().max(100).allow("").optional(),
  });

  const { error, value } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, price, description, stock, category } = value;

  try {
    console.log("uploaded image path : ", image);
    const newProduct = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        description,
        stock: Number(stock),
        category,
        image,
      },
    });
    return res
      .status(201)
      .json({ message: "Product Added successfully : ", newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// update product
module.exports.updateProduct = async (req, res) => {
  console.log("Uploaded file:", req.file);
  const { id } = req.params;

  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication failed" });
  }
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const role = decoded.role;
  console.log("User role from token:", role);
  if (role !== "admin") {
    return res
      .status(403)
      .json({ message: "Only admin can be able to update product" });
  }

  const image = req.file ? req.file.filename : "";

  const productSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().required(),
    description: Joi.string().required(),
    stock: Joi.number().required(),
    category: Joi.string().required(),
  });

  const { error, value } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, price, description, stock, category } = value;

  try {
    console.log("uploaded image path : ", image);
    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        price: Number(price),
        description,
        stock: Number(stock),
        category,
        image,
      },
    });
    return res
      .status(201)
      .json({ message: "product updated successfully", updatedProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//deletet product

module.exports.deleteproduct = async (req, res) => {
  try {
    const { id } = req.params;

    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role;
    console.log("User role from token:", role);
    if (role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can be able to delete product" });
    }

    product = await prisma.product.delete({
      where: { id: Number(id) },
    });
    return res.status(200).json({ message: "product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
