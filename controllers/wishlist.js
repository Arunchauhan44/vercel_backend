const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");
const jwt = require("jsonwebtoken");

// Add product-in-wishlist
module.exports.addToWishlist = async (req, res) => {
    const { productId } = req.body;
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    console.log("User ID from token:", userId);

    // Define the validation schema
    const addToWishlistSchema = Joi.object({
        productId: Joi.number().integer().required().messages({
            "number.base": "Product ID must be a number.",
            "number.integer": "Product ID must be an integer.",
            "any.required": "Product ID is required.",
        }),
    });

    // Validate the request body
    const { error } = addToWishlistSchema.validate({ productId });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        // Ensure the product exists in the database
        const productExists = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!productExists) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if the product is already in the user's wishlist
        const existingWishlistItem = await prisma.wishlist.findFirst({
            where: {
                userId: userId,
                productId: productId,
            },
        });
        if (existingWishlistItem) {
            return res.status(400).json({ message: "Product already in wishlist" });
        }

        // Add the product to the wishlist
        const product = await prisma.wishlist.create({
            data: {
                userId: userId,
                productId: productId,
            },
            include: {
                product: true, // Include product details if needed
            },
        });
        return res.status(200).json({ message: "Product added to wishlist successfully", product });
    } catch (error) {
        console.log("Error adding to wishlist", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// Get wishlist
module.exports.getWishlist = async (req, res) => {
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


        const product = await prisma.wishlist.findMany({
            where: { userId: userId },
            include: {
                product: true, // Include product details if needed
            },
        })

        if (!product) {
            return res.status(404).json({ message: "Wishlist not found" });
        }
        return res.status(200).json({ message: "Wishlist fetched successfully", product });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return res.status(500).json({ error: "Internal Server Error" });
        
    }
}


// remove product from wishlist
module.exports.removeFromWishlist = async (req, res) => {
    const { productId } = req.body;
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    
    // Authentication check
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Define the validation schema (same as addToWishlist)
    const removeFromWishlistSchema = Joi.object({
        productId: Joi.number().integer().required().messages({
            "number.base": "Product ID must be a number.",
            "number.integer": "Product ID must be an integer.",
            "any.required": "Product ID is required.",
        }),
    });

    // Validate the request body
    const { error } = removeFromWishlistSchema.validate({ productId });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        // Check if the product exists in the user's wishlist
        const existingWishlistItem = await prisma.wishlist.findFirst({
            where: {
                userId: userId,
                productId: productId,
            },
        });

        if (!existingWishlistItem) {
            return res.status(404).json({ message: "Product not found in wishlist"});
        }

        // Remove the product from the wishlist
        await prisma.wishlist.delete({
            where: {
                id: existingWishlistItem.id,
            },
        });

        return res.status(200).json({ message: "Product removed from wishlist successfully" });
    } catch (error) {
        console.log("Error removing from wishlist", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};