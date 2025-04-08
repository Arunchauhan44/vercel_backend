const express = require('express');
const routerP = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const {createProduct, product, productId, deleteproduct, updateProduct} = require('../controllers/product');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Routes
routerP.post('/create', auth, upload.single("image"), createProduct);

routerP.put('/update/:id', auth, upload.single("image"), updateProduct);

routerP.get('/product-list', auth, product);

routerP.get('/products/:id', auth, productId);

routerP.delete('/delete/:id', auth, deleteproduct);

module.exports = routerP;
