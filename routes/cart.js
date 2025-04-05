const express = require('express');
const routerC = express.Router();
const auth = require('../middleware/auth');

const {addToCart, getCartItems } = require('../controllers/cart');

routerC.post('/add-to-cart', auth, addToCart);
routerC.get('/cart-items', auth, getCartItems);

module.exports = routerC;
