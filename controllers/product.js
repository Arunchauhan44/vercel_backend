const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');
//GET ALL PRODUCTS
module.exports.product = async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


// GET PRODUCT BY ID
module.exports.productId = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// CREATE PRODUCT
module.exports.createProduct = async (req, res) => {
    console.log("Uploaded file:", req.file);
    
    
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
        res.status(201).json(newProduct);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// update product
module.exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, description } = req.body;
    try {
        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                name,
                price: Number(price),
                description,
            },
        });
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//deletet product 

module.exports.deleteproduct = async (req, res) => {
    const { id } = req.params;
    try {
        product = await prisma.product.delete({
            where: {id: Number(id)},
        })
        return res.status(200).json({message: "product deleted successfully",  }, );

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        
    }
};
