// backend/routes/recommendationRoutes.js
const express = require('express');
const { getRecommendations } = require('../controllers/recommendationController');

const router = express.Router();

router.get('/:userId/:selectedItemId', getRecommendations);

module.exports = router;