// backend/controllers/aiController.js
const multer = require('multer');
const fetch = require('node-fetch').default; // node-fetch v3 (ESM) default export
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');
const Product = require('../models/product');
const { mapAiResultToProduct } = require('../utils/aiProductMapper');
const { typeCompatibility } = require('../utils/rules');

// Keep it in-memory so we can forward to Python AI service
const upload = multer({ storage: multer.memoryStorage() });

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const GEMINI_PROMPT = `
You are a fashion AI expert trained on a structured fashion product database.

Analyze this clothing image and return ONLY valid JSON:

{
  "type": "",
  "category": "",
  "gender": "",
  "dominant_color": "",
  "secondary_color": "",
  "fit": "",
  "pattern": "",
  "sleeve_length": "",
  "style_category": "",
  "occasion_guess": ""
}

Follow the SAME strict rules as in the HTML /analyze endpoint:
- Use "kurti" (not "tunic") for Indian/ethnic long uppers worn over leggings/palazzo.
- category must be one of: upper, lower, footwear, accessory.
- gender must be one of: men, women, unisex, unknown (prefer women for kurti / saree / lehenga).
- dominant_color must be a simple LOWERCASE color name from the allowed set (black, white, grey, navy, blue, light blue, olive, maroon, red, pink, purple, beige, brown, cream, gold, green, mustard).
- secondary_color is the next most visible color or "none".
- fit must be one of: slim, regular, oversized, unknown (avoid unknown if you can infer).
- pattern must be one of: solid, printed, striped, unknown (florals/ethnic motifs → printed).
- sleeve_length must be one of: short, long, sleeveless, unknown.
- style_category must be one of: ethnic, formal, trendy, safe, bold.
- occasion_guess must be one of: casual, formal, festive, wedding, winter, summer.

Return ONLY JSON. No markdown. No explanation.
`;

const ALLOWED_CATEGORY = new Set(["upper", "lower", "footwear", "accessory"]);
const ALLOWED_GENDER = new Set(["men", "women", "unisex", "unknown"]);
const ALLOWED_FIT = new Set(["slim", "regular", "oversized", "unknown"]);
const ALLOWED_PATTERN = new Set(["solid", "printed", "striped", "unknown"]);
const ALLOWED_SLEEVE = new Set(["short", "long", "sleeveless", "unknown"]);
const ALLOWED_STYLE = new Set(["ethnic", "formal", "trendy", "safe", "bold"]);
const ALLOWED_OCCASION = new Set(["casual", "formal", "festive", "wedding", "winter", "summer"]);

function normStr(v, defaultValue = "unknown") {
  if (v === null || v === undefined) {
    return defaultValue;
  }
  const s = String(v).trim();
  return s ? s : defaultValue;
}

function normalizeAiResult(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error("AI result must be a JSON object");
  }

  const out = {
    type: normStr(raw.type),
    category: normStr(raw.category),
    gender: normStr(raw.gender),
    dominant_color: normStr(raw.dominant_color),
    secondary_color: normStr(raw.secondary_color, "none"),
    fit: normStr(raw.fit),
    pattern: normStr(raw.pattern),
    sleeve_length: normStr(raw.sleeve_length),
    style_category: normStr(raw.style_category, "safe"),
    occasion_guess: normStr(raw.occasion_guess, "casual")
  };

  out.category = out.category.toLowerCase();
  out.gender = out.gender.toLowerCase();
  out.fit = out.fit.toLowerCase();
  out.pattern = out.pattern.toLowerCase();
  out.sleeve_length = out.sleeve_length.toLowerCase();
  out.style_category = out.style_category.toLowerCase();
  out.occasion_guess = out.occasion_guess.toLowerCase();

  if (!ALLOWED_CATEGORY.has(out.category)) {
    out.category = "upper";
  }
  if (!ALLOWED_GENDER.has(out.gender)) {
    out.gender = "unknown";
  }
  if (!ALLOWED_FIT.has(out.fit)) {
    out.fit = "unknown";
  }
  if (!ALLOWED_PATTERN.has(out.pattern)) {
    out.pattern = "unknown";
  }
  if (!ALLOWED_SLEEVE.has(out.sleeve_length)) {
    out.sleeve_length = "unknown";
  }
  if (!ALLOWED_STYLE.has(out.style_category)) {
    out.style_category = "safe";
  }
  if (!ALLOWED_OCCASION.has(out.occasion_guess)) {
    out.occasion_guess = "casual";
  }

  if (out.secondary_color.toLowerCase() === "" || out.secondary_color.toLowerCase() === "unknown") {
    out.secondary_color = "none";
  }

  return out;
}

function extractJsonFromText(text) {
  if (typeof text !== 'string') {
    throw new Error('Model response is not text');
  }

  const cleaned = text.trim();

  // 1) Try parsing directly
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {}

  // 2) Try extracting ```json ... ``` blocks
  const fenceMatch = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch (e) {}
  }

  // 3) Fallback: slice first { ... } block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}') + 1;
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end));
    } catch (e) {}
  }

  throw new Error('No valid JSON found in model response');
}

function pickUploadedFile(req) {
  const fromImage = req.files?.image?.[0];
  const fromPhoto = req.files?.photo?.[0];
  return fromImage || fromPhoto || null;
}

const analyzeImage = (req, res) => {
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'photo', maxCount: 1 }])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Upload parse failed: ' + err.message });
    }

    const file = pickUploadedFile(req);
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded. Use form-data key "image" or "photo".' });
    }

    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in backend .env' });
      }

      let lastAiData = null;

      // Call Gemini API directly
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: GEMINI_PROMPT },
                {
                  inlineData: {
                    mimeType: file.mimetype || 'image/jpeg',
                    data: file.buffer.toString('base64')
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API failed with status ${response.status}: ${errText.slice(0, 500)}`);
      }

      const resJson = await response.json();
      if (!resJson.candidates || !resJson.candidates[0] || !resJson.candidates[0].content || !resJson.candidates[0].content.parts || !resJson.candidates[0].content.parts[0]) {
        throw new Error(`Invalid response structure from Gemini API: ${JSON.stringify(resJson)}`);
      }

      const rawText = resJson.candidates[0].content.parts[0].text;
      const data = normalizeAiResult(extractJsonFromText(rawText));
      lastAiData = data;

      // Save a copy of the output JSON file
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = (file.originalname || 'upload.jpg').replace(/[^a-zA-Z0-9_.-]/g, '_');
      const jsonFilename = `${safeName.split('.')[0]}_${stamp}_api_output.json`;
      const jsonSavePath = path.join(__dirname, '..', jsonFilename);
      fs.writeFileSync(jsonSavePath, JSON.stringify(data, null, 4), 'utf8');

      // Save image to uploads and create product for recommendation logic
      let imageUrl = '';
      let product = null;

      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      const ext = path.extname(file.originalname || 'upload.jpg') || '.jpg';
      const uniqueName = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const savePath = path.join(UPLOADS_DIR, uniqueName);
      fs.writeFileSync(savePath, file.buffer);
      imageUrl = `/uploads/${uniqueName}`;

      const productData = mapAiResultToProduct(data, imageUrl);
      product = new Product(productData);
      await product.save();

      return res.json({
        ...data,
        productId: product._id,
        product: product.toObject(),
        aiAttributes: {
          type: data.type,
          category: data.category,
          gender: data.gender,
          dominant_color: data.dominant_color,
          secondary_color: data.secondary_color,
          fit: data.fit,
          pattern: data.pattern,
          sleeve_length: data.sleeve_length,
          style_category: data.style_category,
          occasion_guess: data.occasion_guess
        }
      });
    } catch (e) {
      console.error('AI analyzeImage error:', e);

      // Fallback response if DB step failed but AI succeeded
      try {
        if (lastAiData && !lastAiData.error) {
          const ai = lastAiData;
          return res.status(200).json({
            ...ai,
            productId: null,
            product: null,
            aiAttributes: {
              type: ai.type,
              category: ai.category,
              gender: ai.gender,
              dominant_color: ai.dominant_color,
              secondary_color: ai.secondary_color,
              fit: ai.fit,
              pattern: ai.pattern,
              sleeve_length: ai.sleeve_length,
              style_category: ai.style_category,
              occasion_guess: ai.occasion_guess
            },
            dbError: e.message || String(e)
          });
        }
      } catch (inner) {
        console.error('AI analyzeImage fallback error:', inner);
      }

      return res.status(500).json({ error: e.message || String(e) });
    }
  });
};

const analyzeImageLab = (req, res) => {
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'photo', maxCount: 1 }])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Upload parse failed: ' + err.message });
    }

    const file = pickUploadedFile(req);
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded. Use form-data key "image" or "photo".' });
    }

    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in backend .env' });
      }

      // Call Gemini API directly
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: GEMINI_PROMPT },
                {
                  inlineData: {
                    mimeType: file.mimetype || 'image/jpeg',
                    data: file.buffer.toString('base64')
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API failed with status ${response.status}: ${errText.slice(0, 500)}`);
      }

      const resJson = await response.json();
      if (!resJson.candidates || !resJson.candidates[0] || !resJson.candidates[0].content || !resJson.candidates[0].content.parts || !resJson.candidates[0].content.parts[0]) {
        throw new Error(`Invalid response structure from Gemini API: ${JSON.stringify(resJson)}`);
      }

      const rawText = resJson.candidates[0].content.parts[0].text;
      const data = extractJsonFromText(rawText);

      // Save a copy of the output JSON file
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = (file.originalname || 'upload.jpg').replace(/[^a-zA-Z0-9_.-]/g, '_');
      const jsonFilename = `${safeName.split('.')[0]}_${stamp}_lab_api_output.json`;
      const jsonSavePath = path.join(__dirname, '..', jsonFilename);
      fs.writeFileSync(jsonSavePath, JSON.stringify(data, null, 4), 'utf8');

      return res.json(data);
    } catch (e) {
      console.error('AI analyzeImageLab error:', e);
      return res.status(500).json({ error: e.message || String(e) });
    }
  });
};

// New function to get database recommendations based on AI analysis JSON
const getRecommendationsFromAI = async (req, res) => {
  try {
    const { aiAnalysis, userId = 'default_user' } = req.body;

    if (!aiAnalysis) {
      return res.status(400).json({ error: 'AI analysis data is required' });
    }

    // Map AI analysis to product format
    const virtualProduct = mapAiResultToProduct(aiAnalysis);
    
    // Create a default style profile similar to the original logic
    const defaultProfile = {
      dominantColors: virtualProduct.compatibleColors || ['black'],
      preferredFit: virtualProduct.fit || 'regular',
      budgetRange: 'medium', // Default budget
      occasionFrequency: new Map([
        ['casual', 100],
        ['formal', 80],
        ['festive', 60],
        ['wedding', 40]
      ]),
      experimentalLevel: virtualProduct.styleCategory || 'safe',
      styleCluster: 'AI Generated Style'
    };
    
    // Find similar products in database using the exact same logic as recommendationController
    const selectedGender = virtualProduct.gender || 'unisex';
    
    // Get compatible types using the same logic
    let compatTypes = [];
    if (virtualProduct.compatibleTypes && virtualProduct.compatibleTypes.length > 0) {
      compatTypes = virtualProduct.compatibleTypes;
    } else {
      compatTypes = typeCompatibility[virtualProduct.category] || [];
    }

    console.log(`🔍 AI Analysis: ${virtualProduct.name} (${virtualProduct.category} | ${selectedGender})`);
    console.log(`   Compatible Colors:`, virtualProduct.compatibleColors || 'none');

    // Build query using the same logic as recommendationController
    let candidatesQuery = {
      category: { $in: compatTypes },
      categoryGroup: { $ne: virtualProduct.categoryGroup }
    };

    if (selectedGender === 'men') {
      candidatesQuery.gender = { $in: ['men', 'unisex'] };
    } else if (selectedGender === 'women') {
      candidatesQuery.gender = { $in: ['women', 'unisex'] };
    }

    let candidates = await Product.find(candidatesQuery);

    // Apply color filter using the same logic
    if (virtualProduct.compatibleColors && virtualProduct.compatibleColors.length > 0) {
      const allowedColors = virtualProduct.compatibleColors;
      candidates = candidates.filter(item => allowedColors.includes(item.color));
      console.log(`   ✅ Hard color filter applied → Only colors:`, allowedColors);
      console.log(`   Remaining candidates after color filter:`, candidates.length);
    }

    // Score candidates using the EXACT same logic as recommendationController
    const scoredCandidates = candidates.map(item => {
      const colorMatch = 1; // Always 1 after color filter

      const occasionMatch = item.occasion && item.occasion.some(o => defaultProfile.occasionFrequency.has(o)) ? 1 : 0;
      const budgetMatch = (
        (defaultProfile.budgetRange === 'low' && item.price < 1000) ||
        (defaultProfile.budgetRange === 'medium' && item.price >= 1000 && item.price < 2500) ||
        (defaultProfile.budgetRange === 'high' && item.price >= 2500)
      ) ? 1 : 0;
      const silhouetteMatch = item.fit === defaultProfile.preferredFit ? 1 : 0;
      const riskMatch = item.styleCategory === defaultProfile.experimentalLevel ? 1 : 0;

      const trendBoost = item.isTrending ? 1 : 0;
      const trendPart = (item.trendScore / 10) * 0.10;

      const score = (colorMatch * 0.40) +
                   (occasionMatch * 0.30) +
                   (budgetMatch * 0.10) +
                   (silhouetteMatch * 0.10) +
                   (riskMatch * 0.10) +
                   trendPart;

      const finalScore = score + (trendBoost * 0.05);

      // Same debug log format as recommendationController
      console.log(`   📊 ${item.name} (${item.color}) | Score: ${finalScore.toFixed(2)} | color:1 occasion:${occasionMatch} budget:${budgetMatch} fit:${silhouetteMatch} risk:${riskMatch} trend:${trendPart.toFixed(2)}`);

      return { 
        ...item.toObject(), 
        compatibilityScore: finalScore 
      };
    });

    // Use the same threshold and sorting as recommendationController
    const recommendations = scoredCandidates
      .filter(item => item.compatibilityScore > 0.52)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    console.log(`   🎯 Final recommendations: ${recommendations.length}`);

    // Create full outfit suggestion using the same logic
    let fullOutfit = { analyzedItem: virtualProduct };
    if (recommendations.length > 0) {
      // Add the top recommendation
      fullOutfit.topRecommendation = recommendations[0];
      
      // Try to create a complete outfit like the original controller
      if (virtualProduct.categoryGroup === 'upper' && recommendations.some(r => r.categoryGroup === 'lower')) {
        const lowerItem = recommendations.find(r => r.categoryGroup === 'lower');
        if (lowerItem) fullOutfit.suggestedLower = lowerItem;
        
        const footwearItem = recommendations.find(r => r.categoryGroup === 'footwear');
        if (footwearItem) fullOutfit.suggestedFootwear = footwearItem;
      } else if (virtualProduct.categoryGroup === 'lower' && recommendations.some(r => r.categoryGroup === 'upper')) {
        const upperItem = recommendations.find(r => r.categoryGroup === 'upper');
        if (upperItem) fullOutfit.suggestedUpper = upperItem;
        
        const footwearItem = recommendations.find(r => r.categoryGroup === 'footwear');
        if (footwearItem) fullOutfit.suggestedFootwear = footwearItem;
      }
    }

    res.json({
      aiAnalysis: virtualProduct,
      recommendations,
      fullOutfit,
      profile: defaultProfile.styleCluster,
      selectedGender,
      totalFound: candidates.length,
      filteredCount: scoredCandidates.filter(item => item.compatibilityScore > 0.52).length,
      accuracy: 'high' // Indicate we're using the original logic
    });

  } catch (error) {
    console.error('getRecommendationsFromAI error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { analyzeImage, getRecommendationsFromAI, analyzeImageLab };

