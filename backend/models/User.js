const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  preferences: {
    colors: [String],
    fit: String,
    budget: String,
    occasions: [String]
  },
  favourites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);