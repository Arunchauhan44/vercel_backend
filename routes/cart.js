const express = require('express');
const routerC = express.Router();
const auth = require('../middleware/auth');

const {addToCart, getCartItems, updateCart } = require('../controllers/cart');

routerC.post('/add-to-cart', auth, addToCart);
routerC.get('/cart-items', auth, getCartItems);
routerC.put('/update', updateCart);

module.exports = routerC;