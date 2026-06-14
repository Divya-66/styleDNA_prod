// backend/controllers/productController.js
const Product = require('../models/product');
const multer = require('multer');  // New: For file uploads
const upload = multer({ dest: 'uploads/' });  // Saves files to /uploads folder (temp names)

// Get all products (existing)
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new product (existing, without photo)
const addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const uploadProduct = (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: 'File upload failed: ' + err.message });
    try {
      const occasion = req.body.occasion
        ? (Array.isArray(req.body.occasion) ? req.body.occasion : String(req.body.occasion).split(',').map(o => o.trim()).filter(Boolean))
        : ['casual'];
      const newProduct = new Product({
        name: req.body.name,
        category: req.body.category,
        color: req.body.color || '',
        fit: req.body.fit || '',
        price: Number(req.body.price) || 0,
        occasion,
        imageUrl: `/uploads/${req.file.filename}`,
        buyUrl: req.body.buyUrl || '',
        compatibleColors: req.body.compatibleColors ? String(req.body.compatibleColors).split(',').map(c => c.trim()).filter(Boolean) : ['black', 'white'],
        compatibleTypes: req.body.compatibleTypes ? String(req.body.compatibleTypes).split(',').map(t => t.trim()).filter(Boolean) : ['shirt', 'pant'],
        trendScore: Number(req.body.trendScore) || 5,
        isTrending: req.body.isTrending === 'true'
      });
      await newProduct.save();
      res.status(201).json({ message: 'Item uploaded!', productId: newProduct._id, imageUrl: newProduct.imageUrl });
    } catch (saveErr) {
      res.status(400).json({ error: 'Failed to save: ' + saveErr.message });
    }
  });
};

module.exports = { getProducts, addProduct, uploadProduct };