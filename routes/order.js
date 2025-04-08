const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { placeOrder , getAllOrders, cancelOrder } = require('../controllers/order');

router.post('/place-order', auth, placeOrder);
router.get('/get-orders', auth, getAllOrders);
router.put('/cancel/:orderId', cancelOrder);

module.exports = router;
