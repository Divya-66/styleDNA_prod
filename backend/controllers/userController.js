// backend/controllers/userController.js
const User = require('../models/User');
const Product = require('../models/Product');
const StyleProfile = require('../models/StyleProfile');   // ← THIS WAS MISSING!
const mongoose = require('mongoose');

const signupUser = async (req, res) => {
  const { name, email, password, preferences } = req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'This email is already registered. Please login instead.' 
      });
    }

    // Create user
    const user = new User({ name, email, password, preferences });
    await user.save();

    // Create StyleProfile
    const styleProfile = new StyleProfile({
      userId: user._id,
      dominantColors: preferences?.colors || ['black'],
      preferredFit: preferences?.fit || 'regular',
      budgetRange: preferences?.budget || 'medium',
      occasionFrequency: preferences?.occasions 
        ? new Map(preferences.occasions.map(o => [o, 100 / preferences.occasions.length])) 
        : new Map([['casual', 100]]),
      experimentalLevel: 'safe',
      styleCluster: 'Classic Executive'
    });
    await styleProfile.save();

    res.status(201).json({ 
      message: 'Account created successfully!', 
      userId: user._id 
    });

  } catch (err) {
    console.error('Signup Error:', err.message);

    // Clean up partial user if StyleProfile failed
    if (err.message.includes('StyleProfile')) {
      await User.deleteOne({ email });
    }

    // Handle duplicate email
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({ 
        error: 'This email is already registered. Please login instead.' 
      });
    }

    res.status(400).json({ error: err.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePreferences = async (req, res) => {
  const { preferences } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    const profile = await StyleProfile.findOne({ userId: user._id });
    if (profile) {
      profile.dominantColors = preferences.colors || profile.dominantColors;
      profile.preferredFit = preferences.fit || profile.preferredFit;
      await profile.save();
    }

    res.json({ message: 'Preferences updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Logged in!', userId: user._id, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ====================== FAVOURITES ======================

const getFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('favourites', 'name price color imageUrl category buyUrl');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user.favourites || []);
  } catch (err) {
    console.error('Get Favourites Error:', err);
    res.status(500).json({ error: err.message });
  }
};

const toggleFavourite = async (req, res) => {
  const { productId } = req.body;

  if (!productId) return res.status(400).json({ error: 'productId is required' });
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: 'Invalid productId format' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const isAlreadyFavourite = user.favourites.some(id => id.toString() === productId);

    if (isAlreadyFavourite) {
      user.favourites = user.favourites.filter(id => id.toString() !== productId);
      console.log(`🗑️ Removed ${productId} from favourites (user ${req.params.id})`);
    } else {
      user.favourites.push(productId);
      console.log(`❤️ Added ${productId} to favourites (user ${req.params.id})`);
    }

    await user.save();

    const updatedUser = await User.findById(req.params.id)
      .populate('favourites', 'name price color imageUrl category buyUrl');

    res.json({
      message: isAlreadyFavourite ? 'Removed from favourites' : 'Added to favourites',
      isFavourite: !isAlreadyFavourite,
      favourites: updatedUser.favourites
    });

  } catch (err) {
    console.error('Toggle Favourite Error:', err);
    res.status(500).json({ error: err.message });
  }
};

const removeFavourite = async (req, res) => {
  const { id: userId, productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: 'Invalid productId format' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.favourites = user.favourites.filter(id => id.toString() !== productId);
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate('favourites', 'name price color imageUrl category buyUrl');

    console.log(`🗑️ Removed ${productId} from favourites (user ${userId})`);

    res.json({
      message: 'Removed from favourites',
      favourites: updatedUser.favourites
    });
  } catch (err) {
    console.error('Remove Favourite Error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  signupUser, 
  getUser, 
  updatePreferences, 
  loginUser, 
  getFavourites, 
  toggleFavourite, 
  removeFavourite 
};