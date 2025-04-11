const express = require('express');
const routerW = express.Router();
const auth = require('../middleware/auth');


const { addToWishlist, getWishlist, removeFromWishlist } = require('../controllers/wishlist');

routerW.post('/add-to-wishlist', auth, addToWishlist);

routerW.get('/get-wishlist', auth, getWishlist);

routerW.delete('/remove-from-wishlist', auth, removeFromWishlist);

module.exports = routerW;