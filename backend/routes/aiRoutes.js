// backend/routes/aiRoutes.js
const express = require('express');
const { analyzeImage, getRecommendationsFromAI, analyzeImageLab } = require('../controllers/aiController');

const router = express.Router();

// POST /api/ai/analyze (multipart form-data: image|photo)
router.post('/analyze', analyzeImage);

// POST /api/ai/analyze/lab (multipart form-data: image|photo)
router.post('/analyze/lab', analyzeImageLab);

// POST /api/ai/recommendations (JSON: aiAnalysis, userId)
router.post('/recommendations', getRecommendationsFromAI);

module.exports = router;

