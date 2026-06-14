// backend/controllers/recommendationController.js
const Product = require('../models/Product');
const StyleProfile = require('../models/StyleProfile');
const { typeCompatibility, categoryGroups } = require('../utils/rules');

const getRecommendations = async (req, res) => {
  const { userId, selectedItemId } = req.params;
  try {
    let profile = await StyleProfile.findOne({ userId });
    if (!profile) {
      profile = await StyleProfile.create({
        userId,
        dominantColors: ['black'],
        preferredFit: 'regular',
        budgetRange: 'medium',
        occasionFrequency: new Map([['casual', 100]]),
        experimentalLevel: 'safe',
        styleCluster: 'Minimal Formal'
      });
    }

    const selectedItem = await Product.findById(selectedItemId);
    if (!selectedItem) return res.status(404).json({ error: 'Item not found' });

    const selectedGender = selectedItem.gender || 'unisex';

    // Step 1: Compatible types
    let compatTypes = [];
    if (selectedItem.compatibleTypes && selectedItem.compatibleTypes.length > 0) {
      compatTypes = selectedItem.compatibleTypes;
    } else {
      compatTypes = typeCompatibility[selectedItem.category] || [];
    }

    console.log(`🔍 Selected: ${selectedItem.name} (${selectedItem.category} | ${selectedGender})`);
    console.log(`   Compatible Colors:`, selectedItem.compatibleColors || 'none');

    // Build query
    let candidatesQuery = {
      category: { $in: compatTypes },
      categoryGroup: { $ne: selectedItem.categoryGroup }
    };

    if (selectedGender === 'men') {
      candidatesQuery.gender = { $in: ['men', 'unisex'] };
    } else if (selectedGender === 'women') {
      candidatesQuery.gender = { $in: ['women', 'unisex'] };
    }

    let candidates = await Product.find(candidatesQuery);

    // 🔥 Hard Color Filter
    if (selectedItem.compatibleColors && selectedItem.compatibleColors.length > 0) {
      const allowedColors = selectedItem.compatibleColors;
      candidates = candidates.filter(item => allowedColors.includes(item.color));
      console.log(`   ✅ Hard color filter applied → Only colors:`, allowedColors);
      console.log(`   Remaining candidates after color filter:`, candidates.length);
    }

    // Scoring with FULL DEBUG
    const scoredCandidates = candidates.map(item => {
      const colorMatch = 1;

      const occasionMatch = item.occasion && item.occasion.some(o => profile.occasionFrequency.has(o)) ? 1 : 0;
      const budgetMatch = (
        (profile.budgetRange === 'low' && item.price < 1000) ||
        (profile.budgetRange === 'medium' && item.price >= 1000 && item.price < 2500) ||
        (profile.budgetRange === 'high' && item.price >= 2500)
      ) ? 1 : 0;
      const silhouetteMatch = item.fit === profile.preferredFit ? 1 : 0;
      const riskMatch = item.styleCategory === profile.experimentalLevel ? 1 : 0;

      const trendBoost = item.isTrending ? 1 : 0;
      const trendPart = (item.trendScore / 10) * 0.10;

      const score = (colorMatch * 0.40) +
                   (occasionMatch * 0.30) +
                   (budgetMatch * 0.10) +
                   (silhouetteMatch * 0.10) +
                   (riskMatch * 0.10) +
                   trendPart;

      const finalScore = score + (trendBoost * 0.05);

      // === DETAILED DEBUG LOG ===
      console.log(`   📊 ${item.name} (${item.color}) | Score: ${finalScore.toFixed(2)} | color:1 occasion:${occasionMatch} budget:${budgetMatch} fit:${silhouetteMatch} risk:${riskMatch} trend:${trendPart.toFixed(2)}`);

      return { 
        ...item.toObject(), 
        compatibilityScore: finalScore 
      };
    });

    const recommendations = scoredCandidates
      .filter(item => item.compatibilityScore > 0.52)   // ← Lowered threshold
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    console.log(`   🎯 Final recommendations: ${recommendations.length}`);

    // Step 3: Full outfit (unchanged)
    let fullOutfit = { upper: selectedItem };
    if (recommendations.length > 0 && categoryGroups.lower.includes(recommendations[0].category)) {
      fullOutfit.lower = recommendations[0];

      const footwearTypes = typeCompatibility[fullOutfit.lower.category] || [];
      let footwearQuery = { 
        category: { $in: footwearTypes }, 
        categoryGroup: 'footwear' 
      };

      if (selectedGender === 'men') footwearQuery.gender = { $in: ['men', 'unisex'] };
      else if (selectedGender === 'women') footwearQuery.gender = { $in: ['women', 'unisex'] };

      const footwearCandidates = await Product.find(footwearQuery);

      const scoredFootwear = footwearCandidates.map(item => {
        const lowerColors = fullOutfit.lower.compatibleColors || [];
        const colorMatch = lowerColors.includes(item.color) ? 1 : 0;
        const score = (colorMatch * 0.60) + (item.trendScore / 10 * 0.40);
        return { ...item.toObject(), compatibilityScore: score };
      }).filter(item => item.compatibilityScore > 0.55)
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      if (scoredFootwear.length > 0) fullOutfit.footwear = scoredFootwear[0];
    }

    res.json({ 
      recommendations, 
      fullOutfit, 
      cluster: profile.styleCluster,
      selectedGender 
    });
  } catch (err) {
    console.error('Recommendation Error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRecommendations };