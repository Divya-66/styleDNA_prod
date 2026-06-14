// backend/models/Product.js
const mongoose = require('mongoose');  // Import Mongoose.

// Define the schema (blueprint) for products.
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
    // Add this line with your other fields
  gender: {
      type: String,
      enum: ['men', 'women', 'unisex'],
      default: 'unisex',
      required: true
  },  
  category: { type: String, required: true },  // e.g., "shirt", "pant", "shoes", "kurti"
  color: { type: String },  // e.g., "black"
  fit: { type: String },  // e.g., "slim", "regular", "oversized"
  occasion: [String],  // e.g., ["formal", "casual"]
  price: { type: Number, required: true },  // e.g., 1200
  styleCategory: { type: String },  // e.g., "safe", "bold", "ethnic"
  compatibleColors: [String],  // e.g., ["navy", "white"] – updated with trends like "dark pink" for black
  targetBodyType: { type: String },  // e.g., "athletic"
  pattern: { type: String },  // e.g., "solid"
  sleeveLength: { type: String },  // e.g., "long"
  // New fields for hybrid system
  categoryGroup: { type: String },  // e.g., 'upper', 'lower', 'footwear'
  compatibleTypes: [String],  // e.g., ['palazzo', 'legging'] for a kurti
  trendScore: { type: Number, default: 5 },  // 1-10
  season: { type: String },  // e.g., 'summer'
  isTrending: { type: Boolean, default: false },
  imageUrl: { type: String },  // e.g., '/uploads/photo.jpg' or https://...
  buyUrl: { type: String }  // e.g., 'https://www.myntra.com/.../buy'
}, { timestamps: true });  // Auto-adds dates.

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;