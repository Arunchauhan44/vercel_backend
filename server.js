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
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const PORT = process.env.PORT || 5000;



// Routes
const userRoutes = require('./routes/user');
app.use('/user', userRoutes);
const productRoutes = require('./routes/product');
app.use('/product', productRoutes);
const cartRoutes = require('./routes/cart');
app.use('/cart', cartRoutes);

app.get('/', (req, res) => {
    res.send("welcome to the backend server");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
