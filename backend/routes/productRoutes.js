// backend/routes/productRoutes.js
const express = require('express');
const { getProducts, addProduct, uploadProduct } = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);  // GET /api/products
router.post('/', addProduct);  // POST /api/products (no photo)

// New: POST /api/products/upload (with photo)
router.post('/upload', uploadProduct);

module.exports = router;