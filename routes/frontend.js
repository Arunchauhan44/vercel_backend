const express = require('express');
const axios = require('axios'); // Import axios for API calls
const routerfrontend = express.Router();

const {signinPage, loginPage, resetPage, forgotPage, productPage, homepage, navbar  } = require('../controllers/frontend');


routerfrontend.get('/', homepage );

routerfrontend.get('/login', loginPage);

routerfrontend.get('/signup',signinPage);

routerfrontend.get('/forgot', forgotPage);

routerfrontend.get('/reset', resetPage);

routerfrontend.get('/product', async (req, res) => {
    try {
        // Fetch data from the API
        const response = await axios.get('http://localhost:5100/product/product-list'); // Replace with your API URL
        const products = response.data;

        // Pass the fetched data to the EJS template
        res.render('product.ejs', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});

module.exports = routerfrontend;
