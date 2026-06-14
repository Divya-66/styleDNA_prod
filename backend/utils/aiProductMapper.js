// backend/utils/aiProductMapper.js
// Maps Gemini AI analysis JSON to Product schema for recommendation logic

const { typeCompatibility } = require('./rules');

const COLOR_COMPLEMENTS = {
  black: ['white', 'cream', 'gold', 'navy', 'red'],
  white: ['black', 'navy', 'pink', 'maroon', 'grey'],
  pink: ['white', 'cream', 'navy', 'black', 'gold', 'maroon'],
  maroon: ['gold', 'cream', 'white', 'navy', 'black'],
  navy: ['white', 'cream', 'gold', 'pink', 'grey'],
  red: ['black', 'white', 'navy', 'gold'],
  grey: ['black', 'white', 'navy', 'pink'],
  brown: ['cream', 'white', 'beige', 'gold'],
  beige: ['brown', 'navy', 'maroon', 'white'],
  cream: ['maroon', 'navy', 'brown', 'black'],
  gold: ['maroon', 'navy', 'black', 'cream'],
  green: ['white', 'navy', 'brown', 'cream'],
  mustard: ['navy', 'black', 'white', 'maroon'],
  purple: ['white', 'cream', 'gold', 'grey'],
  olive: ['white', 'cream', 'navy', 'brown'],
  'light blue': ['white', 'navy', 'grey', 'cream']
};

function getCompatibleColors(dominantColor, secondaryColor) {
  const dom = (dominantColor || '').toLowerCase().trim();
  const sec = (secondaryColor || '').toLowerCase().trim();
  const set = new Set();
  if (COLOR_COMPLEMENTS[dom]) {
    COLOR_COMPLEMENTS[dom].forEach(c => set.add(c));
  }
  if (sec && sec !== 'none' && sec !== 'unknown' && COLOR_COMPLEMENTS[sec]) {
    COLOR_COMPLEMENTS[sec].forEach(c => set.add(c));
  }
  if (set.size === 0) {
    return ['white', 'black', 'cream', 'navy'];
  }
  return Array.from(set);
}

const KNOWN_TYPES = new Set([
  'shirt', 'tshirt', 'top', 'crop_top', 'kurti', 'blouse', 'polo',
  'pant', 'jeans', 'trouser', 'chinos', 'cargo_pant', 'jogger', 'palazzo', 'skirt', 'legging', 'shorts',
  'blazer', 'jacket', 'hoodie', 'coat',
  'dress', 'gown', 'jumpsuit', 'saree', 'lehenga', 'suit',
  'heels', 'boots', 'sneakers', 'formal_shoes', 'loafers', 'flats', 'belly',
  'belt', 'clutch', 'dupatta', 'jewelry', 'bag'
]);

function mapAiResultToProduct(ai, imageUrl = '') {
  const categoryGroup = (ai.category || 'upper').toLowerCase();
  let type = (ai.type || '').toString().trim().toLowerCase();
  if (!KNOWN_TYPES.has(type)) {
    if (categoryGroup === 'lower') type = 'pant';
    else if (categoryGroup === 'footwear') type = 'heels';
    else if (categoryGroup === 'accessory') type = 'bag';
    else type = 'shirt';
  }

  const mappedGroup = ['upper', 'lower', 'footwear', 'accessory'].includes(categoryGroup)
    ? categoryGroup
    : 'upper';

  const occasion = ai.occasion_guess ? [ai.occasion_guess] : ['casual'];
  const compatibleColors = getCompatibleColors(ai.dominant_color, ai.secondary_color);
  const compatTypes = typeCompatibility[type] || ['jeans', 'skirt', 'palazzo', 'legging'];

  return {
    name: (ai.type || 'AI Outfit Item').toString(),
    gender: ai.gender && ['men', 'women', 'unisex'].includes(ai.gender) ? ai.gender : 'unisex',
    category: type,
    categoryGroup: mappedGroup,
    color: (ai.dominant_color || '').toString().toLowerCase(),
    fit: ai.fit && ai.fit !== 'unknown' ? ai.fit : 'regular',
    pattern: ai.pattern && ai.pattern !== 'unknown' ? ai.pattern : '',
    sleeveLength: ai.sleeve_length && ai.sleeve_length !== 'unknown' ? ai.sleeve_length : '',
    styleCategory: (ai.style_category || '').toString().toLowerCase(),
    occasion,
    price: 1500,
    trendScore: 7,
    isTrending: true,
    compatibleColors,
    compatibleTypes: compatTypes,
    season: 'all',
    imageUrl: imageUrl || ''
  };
}

module.exports = { mapAiResultToProduct, getCompatibleColors };
