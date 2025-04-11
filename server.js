// filepath: c:\Users\acer\Desktop\fullstack\backend\server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser'); // Optional if using express.json()
require('dotenv').config();

const app = express();
app.use('/uploads', express.static('public/uploads'));
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const PORT = process.env.PORT || 5000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use('/assets', express.static('assets'));

// Routes
const userRoutes = require('./routes/user');
app.use('/user', userRoutes);
const productRoutes = require('./routes/product');
app.use('/product', productRoutes);
const cartRoutes = require('./routes/cart');
app.use('/cart', cartRoutes);
const orderRoutes = require('./routes/order');
app.use('/order', orderRoutes);
const wishlistRoutes = require('./routes/wishlist');
app.use('/wishlist', wishlistRoutes);
const frontendRoutes = require('./routes/frontend');
app.use(frontendRoutes);


// app.get('/product', (req, res) => {
//     res.render("product.ejs", { activePage: 'product' });
// })



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});