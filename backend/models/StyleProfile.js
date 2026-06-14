// backend/models/StyleProfile.js
const mongoose = require('mongoose');

// Define the schema for a user's style profile (StyleDNA).
const styleProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,  // This is like a unique ID linking to the User model.
    ref: 'User',  // Tells Mongoose this refers to the 'User' collection.
    required: true 
  },
  dominantColors: [String],  // Array of strings, e.g., ['black', 'navy'].
  preferredFit: { type: String },  // e.g., 'slim'.
  budgetRange: { type: String },  // e.g., 'medium' (you can define low/medium/high).
  occasionFrequency: { type: Map, of: Number },  // Key-value like { 'formal': 70, 'casual': 30 }.
  experimentalLevel: { type: String },  // e.g., 'safe' or 'bold'.
  styleCluster: { type: String }  // e.g., 'Minimal Formal'.
}, { timestamps: true });  // Automatically adds createdAt and updatedAt fields for tracking.

const StyleProfile = mongoose.model('StyleProfile', styleProfileSchema);

module.exports = StyleProfile;