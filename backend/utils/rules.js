// backend/utils/rules.js
const typeCompatibility = {
  // 👕 SHIRTS & TOPS
  shirt: ['pant', 'jeans', 'trouser', 'skirt'],
  tshirt: ['jeans', 'shorts', 'jogger', 'cargo_pant'],
  polo: ['jeans', 'chinos', 'shorts'],
  top: ['jeans', 'skirt', 'palazzo', 'shorts'],
  crop_top: ['high_waist_jeans', 'skirt', 'cargo_pant'],
  kurti: ['legging', 'palazzo'],
  blouse: ['saree', 'lehenga', 'skirt'],

  // 🧥 OUTERWEAR
  blazer: ['shirt', 'tshirt', 'trouser', 'jeans'],
  jacket: ['tshirt', 'jeans', 'jogger'],
  hoodie: ['jogger', 'jeans', 'shorts'],
  coat: ['dress', 'trouser', 'jeans'],

  // 👖 LOWER WEAR
  pant: ['shirt', 'tshirt', 'blazer', 'kurti'],
  jeans: ['shirt', 'tshirt', 'top', 'hoodie', 'blazer'],
  trouser: ['shirt', 'blazer', 'formal_shoes'],
  chinos: ['shirt', 'polo', 'loafers'],
  cargo_pant: ['tshirt', 'crop_top', 'sneakers'],
  jogger: ['tshirt', 'hoodie', 'sneakers'],
  palazzo: ['kurti', 'top', 'heels'],
  skirt: ['top', 'blouse', 'crop_top', 'heels'],
  legging: ['kurti', 'long_top'],

  // 👗 ONE PIECE
  dress: ['heels', 'boots', 'flats', 'jacket'],
  gown: ['heels', 'clutch'],
  jumpsuit: ['heels', 'sneakers', 'belt'],

  // 👟 FOOTWEAR
  sneakers: ['jeans', 'jogger', 'cargo_pant', 'dress'],
  heels: ['dress', 'skirt', 'palazzo', 'kurti'],
  boots: ['jeans', 'dress', 'coat'],
  formal_shoes: ['trouser', 'suit'],
  loafers: ['chinos', 'trouser'],
  flats: ['dress', 'kurti', 'skirt'],
  belly: ['kurti', 'jeans', 'dress'],

  // 🧵 TRADITIONAL
  saree: ['blouse', 'heels', 'jewelry'],
  lehenga: ['blouse', 'heels', 'dupatta'],
  suit: ['dupatta', 'trouser', 'heels']
};

const categoryGroups = {
  upper: [
    'shirt', 'tshirt', 'top', 'crop_top',
    'kurti', 'blouse', 'polo'
  ],

  lower: [
    'pant', 'jeans', 'trouser', 'chinos',
    'cargo_pant', 'jogger', 'palazzo',
    'skirt', 'legging', 'shorts'
  ],

  outerwear: [
    'blazer', 'jacket', 'hoodie', 'coat'
  ],

  onepiece: [
    'dress', 'gown', 'jumpsuit', 'saree', 'lehenga', 'suit'
  ],

  footwear: [
    'heels', 'boots', 'sneakers',
    'formal_shoes', 'loafers', 'flats', 'belly'
  ],

  accessories: [
    'belt', 'clutch', 'dupatta', 'jewelry', 'bag'
  ]
};

module.exports = { typeCompatibility, categoryGroups };