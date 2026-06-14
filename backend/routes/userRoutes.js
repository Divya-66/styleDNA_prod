// backend/routes/userRoutes.js
const express = require('express');
const { 
  signupUser, 
  getUser, 
  updatePreferences, 
  loginUser, 
  getFavourites, 
  toggleFavourite,     // ← NEW
  removeFavourite 
} = require('../controllers/userController');

const router = express.Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);

// Favourites routes
router.get('/:id/favourites', getFavourites);
router.post('/:id/favourites', toggleFavourite);        // ← now correctly using toggleFavourite
router.delete('/:id/favourites/:productId', removeFavourite);

router.get('/:id', getUser);
router.put('/:id/preferences', updatePreferences);

module.exports = router;