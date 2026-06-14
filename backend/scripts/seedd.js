/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║       WORLD-CLASS FASHION KNOWLEDGE GRAPH — EXPANDED SEED       ║
 * ║  Gender · Categories · Colors · Fabrics · Occasions · Seasons   ║
 * ║  Layering · Style Vibes · Fit · Prints · Body Types · Combos    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
const { getSession, closeDriver } = require('../utils/neo4j');

async function seed() {
    const session = getSession();
    if (!session) return;

    try {
        console.log('🌍 Building Comprehensive Fashion Knowledge Graph...\n');

        // ── CLEAR ALL ──────────────────────────────────────────────────────────
        await session.run('MATCH (n) DETACH DELETE n');
        console.log('🗑️  Cleared existing graph.');

        // ══════════════════════════════════════════════════════════════════════
        // 1. GENDER NODES
        // ══════════════════════════════════════════════════════════════════════
        const genders = ['Men', 'Women', 'Unisex'];
        for (const g of genders) {
            await session.run('MERGE (:Gender {name: $name})', { name: g });
        }
        console.log('✅ Genders seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 2. TOP-LEVEL CATEGORY HIERARCHY
        // ══════════════════════════════════════════════════════════════════════
        const topLevels = ['Top', 'Bottom', 'Outerwear', 'Footwear', 'Accessory', 'One-Piece', 'Innerwear', 'Activewear', 'Ethnic', 'Formalwear'];
        for (const t of topLevels) {
            await session.run('MERGE (:TopCategory {name: $name})', { name: t });
        }

        const categoryMappings = [
            // Tops
            { parent: 'Top', gender: 'Unisex', children: ['T-Shirt', 'Shirt', 'Tank Top', 'Hoodie', 'Sweatshirt'] },
            { parent: 'Top', gender: 'Women', children: ['Blouse', 'Crop Top', 'Tube Top', 'Corset Top', 'Peplum Top', 'Off-Shoulder Top', 'Halter Top', 'Kurti'] },
            { parent: 'Top', gender: 'Men', children: ['Polo Shirt', 'Henley', 'Oxford Shirt', 'Flannel Shirt', 'Dress Shirt'] },

            // Bottoms
            { parent: 'Bottom', gender: 'Unisex', children: ['Jeans', 'Shorts', 'Sweatpants', 'Joggers', 'Chinos', 'Cargo Pants'] },
            { parent: 'Bottom', gender: 'Women', children: ['Skirt', 'Mini Skirt', 'Midi Skirt', 'Maxi Skirt', 'Leggings', 'Palazzo', 'Culottes', 'Dhoti Pants', 'Sharara'] },
            { parent: 'Bottom', gender: 'Men', children: ['Trousers', 'Dress Pants', 'Linen Pants', 'Kurta Pyjama', 'Dhoti'] },

            // Outerwear
            { parent: 'Outerwear', gender: 'Unisex', children: ['Jacket', 'Denim Jacket', 'Parka', 'Windbreaker', 'Trench Coat', 'Puffer Jacket', 'Raincoat'] },
            { parent: 'Outerwear', gender: 'Women', children: ['Shrug', 'Cardigan', 'Cape', 'Bolero'] },
            { parent: 'Outerwear', gender: 'Men', children: ['Blazer', 'Suit Jacket', 'Overcoat', 'Peacoat', 'Varsity Jacket'] },

            // Footwear
            { parent: 'Footwear', gender: 'Unisex', children: ['Sneakers', 'Sandals', 'Flip Flops', 'Boots', 'Loafers', 'Moccasins', 'Espadrilles'] },
            { parent: 'Footwear', gender: 'Women', children: ['Heels', 'Stilettos', 'Block Heels', 'Wedges', 'Ballet Flats', 'Mules', 'Kitten Heels', 'Juttis'] },
            { parent: 'Footwear', gender: 'Men', children: ['Oxford Shoes', 'Derby Shoes', 'Monk Straps', 'Chelsea Boots', 'Brogues', 'Kolhapuris'] },

            // Accessories
            { parent: 'Accessory', gender: 'Unisex', children: ['Belt', 'Scarf', 'Watch', 'Sunglasses', 'Cap', 'Hat', 'Backpack', 'Wallet'] },
            { parent: 'Accessory', gender: 'Women', children: ['Handbag', 'Tote Bag', 'Clutch', 'Jewelry', 'Hair Accessory', 'Dupatta', 'Anklet', 'Bangle'] },
            { parent: 'Accessory', gender: 'Men', children: ['Tie', 'Bow Tie', 'Pocket Square', 'Cufflinks', 'Messenger Bag', 'Suspenders'] },

            // One-Piece
            { parent: 'One-Piece', gender: 'Women', children: ['Dress', 'Mini Dress', 'Midi Dress', 'Maxi Dress', 'Bodycon Dress', 'A-Line Dress', 'Wrap Dress', 'Shirt Dress', 'Saree', 'Lehenga', 'Anarkali'] },
            { parent: 'One-Piece', gender: 'Unisex', children: ['Jumpsuit', 'Romper', 'Overalls'] },

            // Innerwear
            { parent: 'Innerwear', gender: 'Unisex', children: ['Undershirt', 'Thermal Inner'] },
            { parent: 'Innerwear', gender: 'Women', children: ['Bra', 'Sports Bra', 'Camisole', 'Slip'] },
            { parent: 'Innerwear', gender: 'Men', children: ['Briefs', 'Boxers', 'Trunks', 'Banyan'] },

            // Activewear
            { parent: 'Activewear', gender: 'Unisex', children: ['Sports T-Shirt', 'Track Pants', 'Compression Shorts', 'Sports Jacket', 'Yoga Pants', 'Sports Shoes'] },
            { parent: 'Activewear', gender: 'Women', children: ['Sports Bra', 'Yoga Leggings', 'Athletic Skirt'] },
            { parent: 'Activewear', gender: 'Men', children: ['Muscle Tee', 'Training Shorts'] },

            // Ethnic
            { parent: 'Ethnic', gender: 'Women', children: ['Salwar Suit', 'Churidar', 'Ghagra Choli', 'Patiala', 'Kurti Set'] },
            { parent: 'Ethnic', gender: 'Men', children: ['Kurta', 'Sherwani', 'Bandhgala', 'Achkan', 'Nehru Jacket'] },

            // Formalwear
            { parent: 'Formalwear', gender: 'Women', children: ['Formal Blazer', 'Formal Trousers', 'Pencil Skirt', 'Power Suit'] },
            { parent: 'Formalwear', gender: 'Men', children: ['Business Suit', 'Tuxedo', 'Waistcoat', 'Dress Shirt', 'Formal Tie'] },
        ];

        for (const m of categoryMappings) {
            for (const child of m.children) {
                await session.run(`
                    MATCH (p:TopCategory {name: $parent})
                    MERGE (c:Category {name: $child})
                    MERGE (c)-[:IS_A]->(p)
                `, { parent: m.parent, child });

                // Gender relation
                await session.run(`
                    MATCH (c:Category {name: $child}), (g:Gender {name: $gender})
                    MERGE (c)-[:WORN_BY]->(g)
                `, { child, gender: m.gender });
            }
        }
        console.log('✅ Category hierarchy + gender relations seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 3. EXHAUSTIVE COLOR ONTOLOGY
        // ══════════════════════════════════════════════════════════════════════
        const colors = [
            // Neutrals
            { name: 'Black', hex: '#000000', type: 'Neutral', mood: 'Bold' },
            { name: 'White', hex: '#FFFFFF', type: 'Neutral', mood: 'Clean' },
            { name: 'Off-White', hex: '#FAF9F6', type: 'Neutral', mood: 'Soft' },
            { name: 'Grey', hex: '#808080', type: 'Neutral', mood: 'Calm' },
            { name: 'Charcoal', hex: '#36454F', type: 'Neutral', mood: 'Serious' },
            { name: 'Navy', hex: '#000080', type: 'Neutral', mood: 'Classic' },
            { name: 'Beige', hex: '#F5F5DC', type: 'Neutral', mood: 'Warm' },
            { name: 'Camel', hex: '#C19A6B', type: 'Neutral', mood: 'Earthy' },
            { name: 'Tan', hex: '#D2B48C', type: 'Neutral', mood: 'Warm' },
            { name: 'Ivory', hex: '#FFFFF0', type: 'Neutral', mood: 'Pure' },
            // Primary
            { name: 'Red', hex: '#FF0000', type: 'Primary', mood: 'Energetic' },
            { name: 'Blue', hex: '#0000FF', type: 'Primary', mood: 'Calm' },
            { name: 'Yellow', hex: '#FFFF00', type: 'Primary', mood: 'Happy' },
            // Secondary
            { name: 'Green', hex: '#008000', type: 'Secondary', mood: 'Fresh' },
            { name: 'Orange', hex: '#FFA500', type: 'Secondary', mood: 'Vibrant' },
            { name: 'Purple', hex: '#800080', type: 'Secondary', mood: 'Royal' },
            // Tertiary
            { name: 'Teal', hex: '#008080', type: 'Tertiary', mood: 'Cool' },
            { name: 'Amber', hex: '#FFBF00', type: 'Tertiary', mood: 'Warm' },
            { name: 'Chartreuse', hex: '#7FFF00', type: 'Tertiary', mood: 'Edgy' },
            { name: 'Magenta', hex: '#FF00FF', type: 'Tertiary', mood: 'Bold' },
            { name: 'Vermillion', hex: '#E34234', type: 'Tertiary', mood: 'Intense' },
            { name: 'Cyan', hex: '#00FFFF', type: 'Tertiary', mood: 'Fresh' },
            { name: 'Lime', hex: '#00FF00', type: 'Tertiary', mood: 'Energetic' },
            // Deep / Jewel
            { name: 'Maroon', hex: '#800000', type: 'Deep', mood: 'Rich' },
            { name: 'Burgundy', hex: '#800020', type: 'Deep', mood: 'Luxurious' },
            { name: 'Olive', hex: '#808000', type: 'Deep', mood: 'Earthy' },
            { name: 'Forest Green', hex: '#228B22', type: 'Deep', mood: 'Natural' },
            { name: 'Royal Blue', hex: '#4169E1', type: 'Deep', mood: 'Regal' },
            { name: 'Cobalt', hex: '#0047AB', type: 'Deep', mood: 'Bold' },
            { name: 'Indigo', hex: '#4B0082', type: 'Deep', mood: 'Mysterious' },
            { name: 'Plum', hex: '#8E4585', type: 'Deep', mood: 'Rich' },
            { name: 'Emerald', hex: '#50C878', type: 'Jewel', mood: 'Luxurious' },
            { name: 'Sapphire', hex: '#0F52BA', type: 'Jewel', mood: 'Elegant' },
            { name: 'Ruby', hex: '#9B111E', type: 'Jewel', mood: 'Passionate' },
            { name: 'Amethyst', hex: '#9966CC', type: 'Jewel', mood: 'Mystical' },
            { name: 'Topaz', hex: '#FFC87C', type: 'Jewel', mood: 'Warm' },
            // Metallics
            { name: 'Gold', hex: '#FFD700', type: 'Metallic', mood: 'Opulent' },
            { name: 'Silver', hex: '#C0C0C0', type: 'Metallic', mood: 'Sleek' },
            { name: 'Bronze', hex: '#CD7F32', type: 'Metallic', mood: 'Earthy-Luxe' },
            { name: 'Rose Gold', hex: '#B76E79', type: 'Metallic', mood: 'Romantic' },
            // Soft / Pastels
            { name: 'Pink', hex: '#FFC0CB', type: 'Soft', mood: 'Playful' },
            { name: 'Baby Blue', hex: '#89CFF0', type: 'Soft', mood: 'Dreamy' },
            { name: 'Mint', hex: '#98FF98', type: 'Soft', mood: 'Fresh' },
            { name: 'Lavender', hex: '#E6E6FA', type: 'Soft', mood: 'Calm' },
            { name: 'Peach', hex: '#FFCBA4', type: 'Soft', mood: 'Warm' },
            { name: 'Blush', hex: '#F4C2C2', type: 'Soft', mood: 'Romantic' },
            { name: 'Lilac', hex: '#C8A2C8', type: 'Soft', mood: 'Delicate' },
            { name: 'Powder Blue', hex: '#B0E0E6', type: 'Soft', mood: 'Gentle' },
            // Earthy
            { name: 'Rust', hex: '#B7410E', type: 'Earthy', mood: 'Grounded' },
            { name: 'Terracotta', hex: '#E2725B', type: 'Earthy', mood: 'Warm' },
            { name: 'Mustard', hex: '#FFDB58', type: 'Earthy', mood: 'Retro' },
            { name: 'Khaki', hex: '#C3B091', type: 'Earthy', mood: 'Neutral' },
            { name: 'Sand', hex: '#C2B280', type: 'Earthy', mood: 'Breezy' },
        ];

        for (const c of colors) {
            await session.run('MERGE (:Color {name: $name, hex: $hex, type: $type, mood: $mood})', c);
        }

        // Color Complementary Pairs
        const complements = [
            ['Red', 'Green'], ['Blue', 'Orange'], ['Yellow', 'Purple'],
            ['Navy', 'Gold'], ['Black', 'White'], ['Teal', 'Rust'],
            ['Emerald', 'Burgundy'], ['Cobalt', 'Amber'], ['Maroon', 'Mint'],
            ['Lavender', 'Mustard'], ['Blush', 'Charcoal'], ['Indigo', 'Peach']
        ];
        for (const [c1, c2] of complements) {
            await session.run(`
                MATCH (a:Color {name: $c1}), (b:Color {name: $c2})
                MERGE (a)-[:COMPLEMENTARY_WITH]->(b)
                MERGE (b)-[:COMPLEMENTARY_WITH]->(a)
            `, { c1, c2 });
        }

        // Analogous Color Groups
        const analogousGroups = [
            ['Red', 'Orange', 'Amber'],
            ['Blue', 'Teal', 'Cobalt'],
            ['Purple', 'Lavender', 'Amethyst'],
            ['Green', 'Emerald', 'Forest Green'],
            ['Pink', 'Blush', 'Rose Gold'],
            ['Rust', 'Terracotta', 'Maroon'],
            ['Beige', 'Camel', 'Tan'],
        ];
        for (const group of analogousGroups) {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    await session.run(`
                        MATCH (a:Color {name: $c1}), (b:Color {name: $c2})
                        MERGE (a)-[:ANALOGOUS_WITH]->(b)
                        MERGE (b)-[:ANALOGOUS_WITH]->(a)
                    `, { c1: group[i], c2: group[j] });
                }
            }
        }

        // Neutral Goes-With-All
        const neutralColors = ['Black', 'White', 'Grey', 'Beige', 'Navy', 'Charcoal'];
        const allColorNames = colors.map(c => c.name);
        for (const neutral of neutralColors) {
            for (const other of allColorNames) {
                if (other !== neutral) {
                    await session.run(`
                        MATCH (a:Color {name: $neutral}), (b:Color {name: $other})
                        MERGE (a)-[:PAIRS_WELL_WITH]->(b)
                    `, { neutral, other });
                }
            }
        }

        // Clash relations (specific bad combos)
        const clashes = [
            ['Red', 'Orange'], ['Red', 'Pink'], ['Blue', 'Purple'],
            ['Yellow', 'Orange'], ['Lime', 'Magenta'], ['Cyan', 'Yellow']
        ];
        for (const [c1, c2] of clashes) {
            await session.run(`
                MATCH (a:Color {name: $c1}), (b:Color {name: $c2})
                MERGE (a)-[:CLASHES_WITH]->(b)
                MERGE (b)-[:CLASHES_WITH]->(a)
            `, { c1, c2 });
        }

        console.log('✅ Colors + color relations seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 4. FABRIC / MATERIAL ONTOLOGY
        // ══════════════════════════════════════════════════════════════════════
        const fabrics = [
            // Natural
            { name: 'Cotton', weight: 'Light', texture: 'Soft', breathability: 'High', care: 'Machine Wash', type: 'Natural' },
            { name: 'Linen', weight: 'Light', texture: 'Crisp', breathability: 'Very High', care: 'Hand Wash', type: 'Natural' },
            { name: 'Silk', weight: 'Ultra-Light', texture: 'Smooth', breathability: 'High', care: 'Dry Clean', type: 'Natural' },
            { name: 'Wool', weight: 'Heavy', texture: 'Rough', breathability: 'Low', care: 'Dry Clean', type: 'Natural' },
            { name: 'Cashmere', weight: 'Medium', texture: 'Buttery', breathability: 'Low', care: 'Dry Clean', type: 'Natural' },
            { name: 'Jute', weight: 'Heavy', texture: 'Coarse', breathability: 'Medium', care: 'Spot Clean', type: 'Natural' },
            { name: 'Hemp', weight: 'Medium', texture: 'Rough', breathability: 'High', care: 'Machine Wash', type: 'Natural' },
            // Synthetic
            { name: 'Polyester', weight: 'Light', texture: 'Smooth', breathability: 'Low', care: 'Machine Wash', type: 'Synthetic' },
            { name: 'Nylon', weight: 'Light', texture: 'Silky', breathability: 'Low', care: 'Machine Wash', type: 'Synthetic' },
            { name: 'Spandex', weight: 'Ultra-Light', texture: 'Stretchy', breathability: 'Low', care: 'Machine Wash', type: 'Synthetic' },
            { name: 'Acrylic', weight: 'Medium', texture: 'Soft', breathability: 'Low', care: 'Machine Wash', type: 'Synthetic' },
            { name: 'Rayon', weight: 'Light', texture: 'Smooth', breathability: 'Medium', care: 'Hand Wash', type: 'Synthetic' },
            { name: 'Viscose', weight: 'Light', texture: 'Silky', breathability: 'Medium', care: 'Hand Wash', type: 'Synthetic' },
            // Blended
            { name: 'Cotton-Poly', weight: 'Light', texture: 'Soft', breathability: 'Medium', care: 'Machine Wash', type: 'Blend' },
            { name: 'Denim', weight: 'Medium', texture: 'Rough', breathability: 'Medium', care: 'Machine Wash', type: 'Blend' },
            { name: 'Velvet', weight: 'Medium', texture: 'Plush', breathability: 'Low', care: 'Dry Clean', type: 'Blend' },
            { name: 'Satin', weight: 'Light', texture: 'Glossy', breathability: 'Low', care: 'Dry Clean', type: 'Blend' },
            { name: 'Chiffon', weight: 'Ultra-Light', texture: 'Sheer', breathability: 'High', care: 'Hand Wash', type: 'Blend' },
            { name: 'Georgette', weight: 'Light', texture: 'Sheer', breathability: 'High', care: 'Dry Clean', type: 'Blend' },
            { name: 'Crepe', weight: 'Light', texture: 'Textured', breathability: 'Medium', care: 'Hand Wash', type: 'Blend' },
            { name: 'Organza', weight: 'Ultra-Light', texture: 'Stiff', breathability: 'High', care: 'Dry Clean', type: 'Blend' },
            // Special / Luxury
            { name: 'Leather', weight: 'Heavy', texture: 'Smooth', breathability: 'Low', care: 'Condition Only', type: 'Luxury' },
            { name: 'Suede', weight: 'Medium', texture: 'Velvety', breathability: 'Low', care: 'Brush Clean', type: 'Luxury' },
            { name: 'Brocade', weight: 'Heavy', texture: 'Stiff', breathability: 'Low', care: 'Dry Clean', type: 'Luxury' },
            { name: 'Zari', weight: 'Heavy', texture: 'Metallic', breathability: 'Low', care: 'Dry Clean', type: 'Luxury' },
            { name: 'Banarasi Silk', weight: 'Heavy', texture: 'Rich', breathability: 'Medium', care: 'Dry Clean', type: 'Luxury' },
            // Knit
            { name: 'Knit', weight: 'Medium', texture: 'Soft', breathability: 'Medium', care: 'Machine Wash', type: 'Knit' },
            { name: 'Jersey', weight: 'Light', texture: 'Soft', breathability: 'Medium', care: 'Machine Wash', type: 'Knit' },
            { name: 'Rib Knit', weight: 'Medium', texture: 'Textured', breathability: 'Medium', care: 'Machine Wash', type: 'Knit' },
            { name: 'Fleece', weight: 'Heavy', texture: 'Fluffy', breathability: 'Low', care: 'Machine Wash', type: 'Knit' },
        ];

        for (const f of fabrics) {
            await session.run('MERGE (:Fabric {name: $name, weight: $weight, texture: $texture, breathability: $breathability, care: $care, type: $type})', f);
        }

        // Layering Logic (inner → outer, thin to thick)
        const layering = [
            ['Cotton', 'Knit'], ['Cotton', 'Denim'], ['Cotton', 'Leather'],
            ['Jersey', 'Denim'], ['Jersey', 'Knit'], ['Jersey', 'Fleece'],
            ['Silk', 'Knit'], ['Silk', 'Cashmere'], ['Chiffon', 'Blazer'],
            ['Knit', 'Wool'], ['Knit', 'Leather'], ['Knit', 'Fleece'],
            ['Denim', 'Wool'], ['Cotton', 'Wool'], ['Rayon', 'Denim'],
            ['Linen', 'Knit'], ['Spandex', 'Cotton'], ['Viscose', 'Knit'],
        ];
        for (const [inner, outer] of layering) {
            await session.run(`
                MATCH (f1:Fabric {name: $inner}), (f2:Fabric {name: $outer})
                MERGE (f1)-[:LAYERS_UNDER]->(f2)
                MERGE (f2)-[:LAYERS_OVER]->(f1)
            `, { inner, outer });
        }

        // Fabric Seasonal Suitability
        const fabricSeasonMap = [
            { fabrics: ['Cotton', 'Linen', 'Chiffon', 'Georgette', 'Rayon', 'Jersey'], season: 'Summer' },
            { fabrics: ['Wool', 'Cashmere', 'Fleece', 'Knit', 'Leather', 'Velvet', 'Brocade'], season: 'Winter' },
            { fabrics: ['Denim', 'Cotton-Poly', 'Crepe', 'Rib Knit'], season: 'Spring' },
            { fabrics: ['Suede', 'Knit', 'Cotton-Poly', 'Leather', 'Satin'], season: 'Autumn' },
        ];
        for (const row of fabricSeasonMap) {
            for (const fab of row.fabrics) {
                await session.run(`
                    MATCH (f:Fabric {name: $fab}), (s:Season {name: $season})
                    MERGE (f)-[:SUITABLE_FOR_SEASON]->(s)
                `, { fab, season: row.season });
            }
        }

        // Fabric Occasion Suitability
        const fabricOccasionMap = [
            { fabrics: ['Silk', 'Velvet', 'Brocade', 'Satin', 'Organza', 'Banarasi Silk', 'Zari'], occasion: 'Festive' },
            { fabrics: ['Wool', 'Cashmere', 'Leather', 'Satin', 'Silk'], occasion: 'Formal' },
            { fabrics: ['Cotton', 'Denim', 'Jersey', 'Knit', 'Linen', 'Chiffon'], occasion: 'Casual' },
            { fabrics: ['Spandex', 'Polyester', 'Nylon', 'Jersey'], occasion: 'Sport' },
            { fabrics: ['Chiffon', 'Georgette', 'Silk', 'Organza'], occasion: 'Party' },
        ];
        for (const row of fabricOccasionMap) {
            for (const fab of row.fabrics) {
                await session.run(`
                    MATCH (f:Fabric {name: $fab}), (o:Occasion {name: $occasion})
                    MERGE (f)-[:SUITABLE_FOR_OCCASION]->(o)
                `, { fab, occasion: row.occasion });
            }
        }

        // Category Uses Fabric
        const categoryFabricMap = [
            { category: 'Saree', fabrics: ['Silk', 'Cotton', 'Chiffon', 'Georgette', 'Banarasi Silk', 'Organza', 'Crepe'] },
            { category: 'Lehenga', fabrics: ['Silk', 'Velvet', 'Brocade', 'Georgette', 'Zari'] },
            { category: 'Sherwani', fabrics: ['Brocade', 'Velvet', 'Silk', 'Wool'] },
            { category: 'Kurta', fabrics: ['Cotton', 'Silk', 'Linen', 'Khadi'] },
            { category: 'Jeans', fabrics: ['Denim'] },
            { category: 'T-Shirt', fabrics: ['Cotton', 'Jersey', 'Cotton-Poly'] },
            { category: 'Shirt', fabrics: ['Cotton', 'Linen', 'Silk', 'Polyester'] },
            { category: 'Blazer', fabrics: ['Wool', 'Polyester', 'Velvet', 'Linen'] },
            { category: 'Dress', fabrics: ['Cotton', 'Chiffon', 'Silk', 'Satin', 'Jersey', 'Rayon'] },
            { category: 'Sweater', fabrics: ['Wool', 'Cashmere', 'Knit', 'Acrylic'] },
            { category: 'Jacket', fabrics: ['Leather', 'Denim', 'Polyester', 'Wool'] },
            { category: 'Trousers', fabrics: ['Wool', 'Cotton', 'Linen', 'Polyester'] },
            { category: 'Skirt', fabrics: ['Cotton', 'Denim', 'Satin', 'Chiffon', 'Velvet'] },
            { category: 'Leggings', fabrics: ['Spandex', 'Cotton-Poly', 'Nylon'] },
            { category: 'Yoga Pants', fabrics: ['Spandex', 'Nylon', 'Cotton-Poly'] },
            { category: 'Track Pants', fabrics: ['Polyester', 'Cotton-Poly', 'Fleece'] },
            { category: 'Kurti', fabrics: ['Cotton', 'Rayon', 'Silk', 'Chiffon', 'Georgette'] },
            { category: 'Cardigan', fabrics: ['Knit', 'Cashmere', 'Wool', 'Acrylic'] },
            { category: 'Coat', fabrics: ['Wool', 'Cashmere', 'Leather', 'Polyester'] },
            { category: 'Puffer Jacket', fabrics: ['Nylon', 'Polyester'] },
        ];
        for (const row of categoryFabricMap) {
            for (const fab of row.fabrics) {
                await session.run(`
                    MATCH (c:Category {name: $category}), (f:Fabric {name: $fab})
                    MERGE (c)-[:MADE_FROM]->(f)
                `, { category: row.category, fab });
            }
        }

        console.log('✅ Fabrics + layering + seasonal/occasion fabric relations seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 5. SEASONS (All 4 + Monsoon for South Asia)
        // ══════════════════════════════════════════════════════════════════════
        const seasons = [
            { name: 'Summer', temperature: 'Hot', description: 'Light, breathable, bright' },
            { name: 'Winter', temperature: 'Cold', description: 'Warm, layered, rich tones' },
            { name: 'Spring', temperature: 'Mild', description: 'Pastels, florals, fresh' },
            { name: 'Autumn', temperature: 'Cool', description: 'Earthy tones, layers begin' },
            { name: 'Monsoon', temperature: 'Humid', description: 'Waterproof, dark, minimal' },
        ];
        for (const s of seasons) {
            await session.run('MERGE (:Season {name: $name, temperature: $temperature, description: $description})', s);
        }

        const seasonColorMap = [
            { season: 'Summer', colors: ['White', 'Off-White', 'Beige', 'Mint', 'Baby Blue', 'Yellow', 'Pink', 'Lime', 'Peach', 'Sand', 'Lavender', 'Ivory'] },
            { season: 'Winter', colors: ['Black', 'Navy', 'Grey', 'Charcoal', 'Maroon', 'Burgundy', 'Emerald', 'Purple', 'Gold', 'Forest Green', 'Cobalt', 'Ruby'] },
            { season: 'Spring', colors: ['Blush', 'Lavender', 'Mint', 'Pink', 'Baby Blue', 'Lilac', 'Peach', 'Chartreuse', 'Powder Blue', 'White'] },
            { season: 'Autumn', colors: ['Rust', 'Terracotta', 'Mustard', 'Camel', 'Olive', 'Brown', 'Amber', 'Tan', 'Khaki', 'Gold', 'Maroon'] },
            { season: 'Monsoon', colors: ['Navy', 'Black', 'Grey', 'Teal', 'Forest Green', 'Maroon', 'Indigo', 'Cobalt'] },
        ];
        for (const row of seasonColorMap) {
            for (const col of row.colors) {
                await session.run(`
                    MATCH (s:Season {name: $season}), (c:Color {name: $color})
                    MERGE (s)-[:FAVORS_PALETTE]->(c)
                `, { season: row.season, color: col });
            }
        }

        // Season → Category recommendations
        const seasonCategoryMap = [
            { season: 'Summer', categories: ['T-Shirt', 'Shorts', 'Sundress', 'Tank Top', 'Sandals', 'Linen Pants', 'Crop Top', 'Mini Dress', 'Skirt', 'Kurti'] },
            { season: 'Winter', categories: ['Sweater', 'Coat', 'Parka', 'Wool Trousers', 'Boots', 'Hoodie', 'Blazer', 'Cardigan', 'Scarf', 'Thermal Inner', 'Sherwani'] },
            { season: 'Spring', categories: ['Light Jacket', 'Chinos', 'Blouse', 'Midi Dress', 'Trench Coat', 'Sneakers', 'Cardigan', 'Wrap Dress'] },
            { season: 'Autumn', categories: ['Denim Jacket', 'Sweater', 'Boots', 'Trousers', 'Cardigan', 'Overcoat', 'Scarf', 'Suede Loafers'] },
            { season: 'Monsoon', categories: ['Raincoat', 'Parka', 'Windbreaker', 'Rubber Sandals', 'Dark Jeans', 'Dark Trousers', 'Boots'] },
        ];
        for (const row of seasonCategoryMap) {
            for (const cat of row.categories) {
                await session.run(`
                    MATCH (s:Season {name: $season})
                    MERGE (c:Category {name: $cat})
                    MERGE (s)-[:RECOMMENDS_CATEGORY]->(c)
                `, { season: row.season, cat });
            }
        }

        console.log('✅ Seasons + season-color + season-category relations seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 6. OCCASIONS
        // ══════════════════════════════════════════════════════════════════════
        const occasions = [
            { name: 'Formal', dressCode: 'Strict', setting: 'Office/Corporate', vibe: 'Professional' },
            { name: 'Business Casual', dressCode: 'Smart', setting: 'Office/Meeting', vibe: 'Smart-Casual' },
            { name: 'Casual', dressCode: 'Relaxed', setting: 'Everyday', vibe: 'Comfortable' },
            { name: 'Party', dressCode: 'Trendy', setting: 'Club/Bar/Lounge', vibe: 'Glamorous' },
            { name: 'Festive', dressCode: 'Ethnic or Formal', setting: 'Festival/Temple/Wedding', vibe: 'Celebratory' },
            { name: 'Wedding', dressCode: 'Formal', setting: 'Wedding Venue', vibe: 'Elegant' },
            { name: 'Date Night', dressCode: 'Smart', setting: 'Restaurant/Cinema', vibe: 'Romantic' },
            { name: 'Sport', dressCode: 'Athletic', setting: 'Gym/Field/Court', vibe: 'Active' },
            { name: 'Beach', dressCode: 'Relaxed', setting: 'Beach/Pool', vibe: 'Summery' },
            { name: 'Travel', dressCode: 'Relaxed', setting: 'Airport/Commute', vibe: 'Comfortable-Chic' },
            { name: 'Brunch', dressCode: 'Smart Casual', setting: 'Cafe/Restaurant', vibe: 'Laid-Back-Chic' },
            { name: 'Religious', dressCode: 'Modest', setting: 'Temple/Mosque/Church', vibe: 'Modest' },
            { name: 'Graduation', dressCode: 'Smart', setting: 'Ceremony Hall', vibe: 'Celebratory' },
            { name: 'Concert', dressCode: 'Edgy', setting: 'Music Venue', vibe: 'Expressive' },
            { name: 'Outdoor', dressCode: 'Practical', setting: 'Park/Trek/Picnic', vibe: 'Adventure-Ready' },
        ];
        for (const o of occasions) {
            await session.run('MERGE (:Occasion {name: $name, dressCode: $dressCode, setting: $setting, vibe: $vibe})', o);
        }

        const occasionColorMap = [
            { occasion: 'Formal', colors: ['Black', 'Navy', 'White', 'Grey', 'Charcoal'] },
            { occasion: 'Business Casual', colors: ['Navy', 'Beige', 'Grey', 'White', 'Light Blue', 'Cobalt'] },
            { occasion: 'Casual', colors: ['Blue', 'Beige', 'Olive', 'White', 'Grey', 'Mint', 'Sand'] },
            { occasion: 'Party', colors: ['Gold', 'Silver', 'Black', 'Red', 'Emerald', 'Magenta', 'Cobalt'] },
            { occasion: 'Festive', colors: ['Gold', 'Red', 'Maroon', 'Emerald', 'Silver', 'Pink', 'Orange', 'Purple', 'Ruby'] },
            { occasion: 'Wedding', colors: ['Red', 'Maroon', 'Gold', 'Pink', 'Ivory', 'Blush', 'Emerald'] },
            { occasion: 'Date Night', colors: ['Black', 'Red', 'Burgundy', 'Rose Gold', 'Navy', 'Plum'] },
            { occasion: 'Sport', colors: ['Black', 'White', 'Cobalt', 'Red', 'Lime', 'Grey'] },
            { occasion: 'Beach', colors: ['White', 'Yellow', 'Aqua', 'Peach', 'Mint', 'Beige', 'Sand', 'Coral'] },
            { occasion: 'Travel', colors: ['Navy', 'Grey', 'Olive', 'Black', 'Beige', 'Tan'] },
            { occasion: 'Brunch', colors: ['Blush', 'White', 'Lavender', 'Mint', 'Peach', 'Baby Blue'] },
            { occasion: 'Religious', colors: ['White', 'Ivory', 'Yellow', 'Saffron', 'Red', 'Green'] },
            { occasion: 'Concert', colors: ['Black', 'Silver', 'Cobalt', 'Lime', 'Magenta', 'Amber'] },
            { occasion: 'Outdoor', colors: ['Olive', 'Khaki', 'Forest Green', 'Tan', 'Rust', 'Grey'] },
        ];
        for (const row of occasionColorMap) {
            for (const col of row.colors) {
                await session.run(`
                    MATCH (o:Occasion {name: $occasion}), (c:Color {name: $color})
                    MERGE (o)-[:IDEAL_TONE]->(c)
                `, { occasion: row.occasion, color: col });
            }
        }

        // Occasion → Recommended Categories
        const occasionCategoryMap = [
            { occasion: 'Formal', men: ['Business Suit', 'Dress Shirt', 'Formal Tie', 'Oxford Shoes', 'Tuxedo', 'Waistcoat'], women: ['Formal Blazer', 'Pencil Skirt', 'Formal Trousers', 'Heels', 'Power Suit'] },
            { occasion: 'Business Casual', men: ['Chinos', 'Oxford Shirt', 'Blazer', 'Loafers', 'Derby Shoes'], women: ['Blouse', 'Midi Skirt', 'Formal Blazer', 'Ballet Flats', 'Kurti Set'] },
            { occasion: 'Casual', men: ['T-Shirt', 'Jeans', 'Sneakers', 'Shorts', 'Polo Shirt'], women: ['T-Shirt', 'Jeans', 'Sneakers', 'Crop Top', 'Shorts', 'Leggings'] },
            { occasion: 'Party', men: ['Dress Shirt', 'Chinos', 'Chelsea Boots', 'Blazer'], women: ['Bodycon Dress', 'Mini Dress', 'Heels', 'Clutch', 'Jumpsuit'] },
            { occasion: 'Festive', men: ['Sherwani', 'Kurta', 'Bandhgala', 'Nehru Jacket', 'Kolhapuris'], women: ['Saree', 'Lehenga', 'Anarkali', 'Salwar Suit', 'Juttis', 'Bangle'] },
            { occasion: 'Wedding', men: ['Sherwani', 'Bandhgala', 'Achkan', 'Nehru Jacket'], women: ['Lehenga', 'Saree', 'Anarkali', 'Ghagra Choli'] },
            { occasion: 'Date Night', men: ['Dress Shirt', 'Chinos', 'Chelsea Boots'], women: ['Wrap Dress', 'Midi Dress', 'Heels', 'Clutch'] },
            { occasion: 'Sport', men: ['Sports T-Shirt', 'Training Shorts', 'Sports Shoes', 'Track Pants'], women: ['Sports Bra', 'Yoga Leggings', 'Athletic Skirt', 'Sports Shoes'] },
            { occasion: 'Beach', men: ['Shorts', 'Tank Top', 'Flip Flops', 'Sunglasses'], women: ['Romper', 'Mini Dress', 'Sandals', 'Tote Bag', 'Sunglasses'] },
            { occasion: 'Travel', men: ['Chinos', 'T-Shirt', 'Sneakers', 'Backpack', 'Joggers'], women: ['Leggings', 'T-Shirt', 'Sneakers', 'Backpack', 'Palazzo'] },
            { occasion: 'Religious', men: ['Kurta', 'Dhoti', 'Kurta Pyjama', 'Kolhapuris'], women: ['Saree', 'Salwar Suit', 'Kurti', 'Dupatta', 'Juttis'] },
            { occasion: 'Concert', men: ['Graphic T-Shirt', 'Jeans', 'Boots', 'Varsity Jacket'], women: ['Mini Dress', 'Boots', 'Leather Jacket', 'Mini Skirt'] },
            { occasion: 'Outdoor', men: ['Cargo Pants', 'Flannel Shirt', 'Boots', 'Jacket'], women: ['Yoga Pants', 'Sports T-Shirt', 'Boots', 'Windbreaker'] },
        ];
        for (const row of occasionCategoryMap) {
            for (const cat of row.men) {
                await session.run(`
                    MATCH (o:Occasion {name: $occasion}), (g:Gender {name: 'Men'})
                    MERGE (c:Category {name: $cat})
                    MERGE (o)-[:RECOMMENDS_FOR {gender: 'Men'}]->(c)
                `, { occasion: row.occasion, cat });
            }
            for (const cat of row.women) {
                await session.run(`
                    MATCH (o:Occasion {name: $occasion}), (g:Gender {name: 'Women'})
                    MERGE (c:Category {name: $cat})
                    MERGE (o)-[:RECOMMENDS_FOR {gender: 'Women'}]->(c)
                `, { occasion: row.occasion, cat });
            }
        }

        console.log('✅ Occasions + occasion-color + occasion-category (gendered) relations seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 7. PRINTS & PATTERNS
        // ══════════════════════════════════════════════════════════════════════
        const prints = [
            { name: 'Solid', vibe: 'Minimalist', formality: 'Any' },
            { name: 'Stripes', vibe: 'Classic', formality: 'Smart Casual' },
            { name: 'Checks', vibe: 'Preppy', formality: 'Casual-Formal' },
            { name: 'Plaid', vibe: 'Casual', formality: 'Casual' },
            { name: 'Floral', vibe: 'Feminine', formality: 'Casual-Party' },
            { name: 'Animal Print', vibe: 'Bold', formality: 'Party-Casual' },
            { name: 'Geometric', vibe: 'Modern', formality: 'Any' },
            { name: 'Abstract', vibe: 'Artistic', formality: 'Casual-Party' },
            { name: 'Paisley', vibe: 'Ethnic', formality: 'Ethnic-Casual' },
            { name: 'Ikat', vibe: 'Ethnic', formality: 'Ethnic' },
            { name: 'Bandhani', vibe: 'Ethnic', formality: 'Ethnic-Festive' },
            { name: 'Polka Dot', vibe: 'Playful', formality: 'Casual' },
            { name: 'Houndstooth', vibe: 'Classic', formality: 'Smart-Formal' },
            { name: 'Camouflage', vibe: 'Streetwear', formality: 'Casual' },
            { name: 'Tropical', vibe: 'Vacation', formality: 'Casual-Beach' },
            { name: 'Tie-Dye', vibe: 'Boho', formality: 'Casual' },
            { name: 'Embroidered', vibe: 'Ethnic-Luxe', formality: 'Ethnic-Festive' },
        ];
        for (const p of prints) {
            await session.run('MERGE (:Print {name: $name, vibe: $vibe, formality: $formality})', p);
        }

        // Print-Category compatibility
        const printCategoryMap = [
            { print: 'Floral', categories: ['Dress', 'Blouse', 'Midi Dress', 'Skirt', 'Kurti', 'Shirt'] },
            { print: 'Stripes', categories: ['T-Shirt', 'Shirt', 'Dress', 'Blazer', 'Trousers'] },
            { print: 'Checks', categories: ['Shirt', 'Flannel Shirt', 'Blazer', 'Trousers'] },
            { print: 'Animal Print', categories: ['Mini Dress', 'Skirt', 'Bodycon Dress', 'Boots', 'Blouse'] },
            { print: 'Paisley', categories: ['Saree', 'Kurta', 'Kurti', 'Salwar Suit'] },
            { print: 'Ikat', categories: ['Saree', 'Kurta', 'Kurti', 'Dress'] },
            { print: 'Bandhani', categories: ['Saree', 'Kurti', 'Salwar Suit', 'Dupatta'] },
            { print: 'Houndstooth', categories: ['Blazer', 'Coat', 'Trousers', 'Skirt'] },
            { print: 'Camouflage', categories: ['Cargo Pants', 'Jacket', 'T-Shirt'] },
            { print: 'Tie-Dye', categories: ['T-Shirt', 'Dress', 'Shorts', 'Skirt'] },
            { print: 'Embroidered', categories: ['Sherwani', 'Lehenga', 'Saree', 'Kurti', 'Dress', 'Anarkali'] },
            { print: 'Tropical', categories: ['Shirt', 'Shorts', 'Dress', 'Romper'] },
        ];
        for (const row of printCategoryMap) {
            for (const cat of row.categories) {
                await session.run(`
                    MATCH (p:Print {name: $print}), (c:Category {name: $cat})
                    MERGE (p)-[:SUITS_CATEGORY]->(c)
                `, { print: row.print, cat });
            }
        }

        // Mixing Prints Rules
        const safePrintMixes = [
            ['Stripes', 'Solid'], ['Floral', 'Solid'], ['Checks', 'Solid'],
            ['Animal Print', 'Solid'], ['Geometric', 'Solid'], ['Stripes', 'Floral'],
        ];
        for (const [p1, p2] of safePrintMixes) {
            await session.run(`
                MATCH (a:Print {name: $p1}), (b:Print {name: $p2})
                MERGE (a)-[:MIXES_WELL_WITH]->(b)
                MERGE (b)-[:MIXES_WELL_WITH]->(a)
            `, { p1, p2 });
        }
        const badPrintMixes = [
            ['Stripes', 'Checks'], ['Floral', 'Animal Print'], ['Plaid', 'Camouflage'],
            ['Animal Print', 'Tropical'], ['Tie-Dye', 'Geometric']
        ];
        for (const [p1, p2] of badPrintMixes) {
            await session.run(`
                MATCH (a:Print {name: $p1}), (b:Print {name: $p2})
                MERGE (a)-[:CLASHES_WITH]->(b)
                MERGE (b)-[:CLASHES_WITH]->(a)
            `, { p1, p2 });
        }
        console.log('✅ Prints + print-category + print mix rules seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 8. FIT TYPES
        // ══════════════════════════════════════════════════════════════════════
        const fits = [
            { name: 'Slim Fit', silhouette: 'Body-Hugging', bestFor: 'Lean/Athletic builds' },
            { name: 'Regular Fit', silhouette: 'Relaxed', bestFor: 'All builds' },
            { name: 'Oversized', silhouette: 'Baggy', bestFor: 'All; streetwear' },
            { name: 'Tailored', silhouette: 'Structured', bestFor: 'Formal occasions' },
            { name: 'Relaxed Fit', silhouette: 'Loose', bestFor: 'Comfort; casual' },
            { name: 'Boxy', silhouette: 'Square', bestFor: 'Streetwear; minimalist' },
            { name: 'Flared', silhouette: 'Wide-Bottom', bestFor: 'Pear shapes; retro' },
            { name: 'Bodycon', silhouette: 'Tight', bestFor: 'Hourglass builds' },
            { name: 'A-Line', silhouette: 'Flared-Skirt', bestFor: 'All; hides hips' },
            { name: 'Wrap', silhouette: 'Adjustable', bestFor: 'All builds; elegant' },
        ];
        for (const f of fits) {
            await session.run('MERGE (:Fit {name: $name, silhouette: $silhouette, bestFor: $bestFor})', f);
        }

        // Fit → Category relations
        const fitCategoryMap = [
            { fit: 'Slim Fit', categories: ['T-Shirt', 'Jeans', 'Trousers', 'Shirt', 'Dress Shirt', 'Chinos'] },
            { fit: 'Tailored', categories: ['Blazer', 'Business Suit', 'Dress Shirt', 'Trousers', 'Sherwani'] },
            { fit: 'Oversized', categories: ['T-Shirt', 'Hoodie', 'Sweatshirt', 'Shirt', 'Jacket'] },
            { fit: 'Bodycon', categories: ['Dress', 'Bodycon Dress', 'Mini Dress', 'Skirt'] },
            { fit: 'A-Line', categories: ['Dress', 'A-Line Dress', 'Skirt', 'Midi Skirt'] },
            { fit: 'Flared', categories: ['Palazzo', 'Skirt', 'Maxi Skirt', 'Trousers'] },
            { fit: 'Relaxed Fit', categories: ['Joggers', 'Sweatpants', 'Shorts', 'Linen Pants', 'T-Shirt'] },
            { fit: 'Wrap', categories: ['Wrap Dress', 'Blouse', 'Top'] },
        ];
        for (const row of fitCategoryMap) {
            for (const cat of row.categories) {
                await session.run(`
                    MATCH (f:Fit {name: $fit}), (c:Category {name: $cat})
                    MERGE (f)-[:APPLIES_TO]->(c)
                `, { fit: row.fit, cat });
            }
        }
        console.log('✅ Fits seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 9. BODY TYPES
        // ══════════════════════════════════════════════════════════════════════
        const bodyTypes = [
            { name: 'Hourglass', description: 'Balanced bust and hips, defined waist' },
            { name: 'Pear', description: 'Wider hips than shoulders' },
            { name: 'Apple', description: 'Broader shoulders and midsection' },
            { name: 'Rectangle', description: 'Straight silhouette, minimal curves' },
            { name: 'Inverted Triangle', description: 'Broader shoulders, narrow hips' },
            { name: 'Athletic', description: 'Muscular, balanced proportions' },
            { name: 'Petite', description: 'Small frame, shorter stature' },
            { name: 'Plus Size', description: 'Fuller figure' },
        ];
        for (const b of bodyTypes) {
            await session.run('MERGE (:BodyType {name: $name, description: $description})', b);
        }

        // BodyType → Recommended Fits
        const bodyFitMap = [
            { body: 'Hourglass', fits: ['Bodycon', 'Wrap', 'Slim Fit', 'Tailored'] },
            { body: 'Pear', fits: ['A-Line', 'Flared', 'Regular Fit', 'Wrap'] },
            { body: 'Apple', fits: ['Wrap', 'A-Line', 'Relaxed Fit', 'Oversized'] },
            { body: 'Rectangle', fits: ['Bodycon', 'Flared', 'Oversized', 'Boxy'] },
            { body: 'Inverted Triangle', fits: ['Flared', 'A-Line', 'Regular Fit', 'Relaxed Fit'] },
            { body: 'Athletic', fits: ['Slim Fit', 'Regular Fit', 'Tailored', 'Bodycon'] },
            { body: 'Petite', fits: ['Slim Fit', 'A-Line', 'Tailored'] },
            { body: 'Plus Size', fits: ['Wrap', 'A-Line', 'Relaxed Fit', 'Oversized'] },
        ];
        for (const row of bodyFitMap) {
            for (const fit of row.fits) {
                await session.run(`
                    MATCH (b:BodyType {name: $body}), (f:Fit {name: $fit})
                    MERGE (b)-[:FLATTERS_IN]->(f)
                `, { body: row.body, fit });
            }
        }

        // BodyType → Recommended Categories
        const bodyCategoryMap = [
            { body: 'Hourglass', categories: ['Wrap Dress', 'Bodycon Dress', 'Belted Coat', 'Pencil Skirt'] },
            { body: 'Pear', categories: ['A-Line Dress', 'Midi Skirt', 'Palazzo', 'Flared Skirt', 'Off-Shoulder Top'] },
            { body: 'Apple', categories: ['Wrap Dress', 'Kurti', 'Maxi Dress', 'Flowy Blouse', 'Empire Waist Dress'] },
            { body: 'Rectangle', categories: ['Crop Top', 'Mini Skirt', 'Peplum Top', 'Belted Jacket'] },
            { body: 'Inverted Triangle', categories: ['Flared Skirt', 'Wide-Leg Pants', 'Palazzo', 'A-Line Dress', 'Culottes'] },
            { body: 'Petite', categories: ['Mini Dress', 'Mini Skirt', 'Cropped Jacket', 'High-Waist Jeans', 'Ballet Flats'] },
        ];
        for (const row of bodyCategoryMap) {
            for (const cat of row.categories) {
                await session.run(`
                    MATCH (b:BodyType {name: $body})
                    MERGE (c:Category {name: $cat})
                    MERGE (b)-[:LOOKS_GREAT_IN]->(c)
                `, { body: row.body, cat });
            }
        }
        console.log('✅ Body types + fit + category recommendations seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 10. STYLE VIBES (expanded)
        // ══════════════════════════════════════════════════════════════════════
        const vibes = [
            { name: 'Minimalist', characteristics: 'Clean lines, neutral palette, simple silhouettes' },
            { name: 'Royal', characteristics: 'Rich fabrics, metallic accents, embroidery, jewel tones' },
            { name: 'Streetwear', characteristics: 'Bold graphics, oversized, sneakers, denim' },
            { name: 'Classic', characteristics: 'Timeless, well-tailored, neutral and deep tones' },
            { name: 'Bohemian', characteristics: 'Flowy, earthy tones, prints, layers, fringe' },
            { name: 'Preppy', characteristics: 'Polo shirts, chinos, blazers, pastel palette' },
            { name: 'Edgy', characteristics: 'Leather, dark palette, chains, unconventional cuts' },
            { name: 'Feminine', characteristics: 'Florals, pastels, ruffles, soft fabrics, elegant' },
            { name: 'Athleisure', characteristics: 'Sporty, comfortable, functional, technical fabrics' },
            { name: 'Corporate', characteristics: 'Sharp suits, structured blazers, formal shoes' },
            { name: 'Ethnic Chic', characteristics: 'Traditional garments with modern styling' },
            { name: 'Resort', characteristics: 'Tropical prints, linen, relaxed, sun-ready' },
            { name: 'Avant-Garde', characteristics: 'Experimental cuts, unconventional, fashion-forward' },
            { name: 'Cottagecore', characteristics: 'Floral, pastoral, soft, romantic countryside' },
        ];
        for (const v of vibes) {
            await session.run('MERGE (:StyleVibe {name: $name, characteristics: $characteristics})', v);
        }

        // Vibe → Color
        const vibeColorMap = [
            { vibe: 'Royal', colors: ['Gold', 'Purple', 'Emerald', 'Maroon', 'Sapphire', 'Ruby', 'Silver', 'Amethyst'] },
            { vibe: 'Minimalist', colors: ['White', 'Black', 'Grey', 'Beige', 'Off-White', 'Ivory', 'Charcoal'] },
            { vibe: 'Streetwear', colors: ['Black', 'White', 'Red', 'Cobalt', 'Lime', 'Orange', 'Camouflage'] },
            { vibe: 'Bohemian', colors: ['Rust', 'Terracotta', 'Mustard', 'Olive', 'Camel', 'Amber', 'Mauve'] },
            { vibe: 'Preppy', colors: ['Navy', 'White', 'Red', 'Baby Blue', 'Green', 'Pink', 'Yellow'] },
            { vibe: 'Edgy', colors: ['Black', 'Charcoal', 'Silver', 'Burgundy', 'Red', 'Cobalt'] },
            { vibe: 'Feminine', colors: ['Pink', 'Blush', 'Lavender', 'White', 'Lilac', 'Peach', 'Rose Gold'] },
            { vibe: 'Athleisure', colors: ['Black', 'White', 'Grey', 'Cobalt', 'Lime', 'Red'] },
            { vibe: 'Corporate', colors: ['Navy', 'Black', 'White', 'Grey', 'Charcoal', 'Cobalt'] },
            { vibe: 'Ethnic Chic', colors: ['Gold', 'Maroon', 'Emerald', 'Pink', 'Orange', 'Purple', 'Ruby'] },
            { vibe: 'Resort', colors: ['White', 'Sand', 'Peach', 'Turquoise', 'Coral', 'Yellow', 'Mint'] },
            { vibe: 'Cottagecore', colors: ['Blush', 'Mint', 'Lavender', 'Ivory', 'Sage', 'Peach', 'White'] },
            { vibe: 'Classic', colors: ['Navy', 'Black', 'White', 'Grey', 'Camel', 'Burgundy', 'Beige'] },
        ];
        for (const row of vibeColorMap) {
            for (const col of row.colors) {
                await session.run(`
                    MATCH (v:StyleVibe {name: $vibe}), (c:Color {name: $color})
                    MERGE (v)-[:USES_COLOR]->(c)
                `, { vibe: row.vibe, color: col });
            }
        }

        // Vibe → Category
        const vibeCategoryMap = [
            { vibe: 'Streetwear', categories: ['Hoodie', 'Cargo Pants', 'Sneakers', 'Denim Jacket', 'Oversized T-Shirt', 'Cap', 'Joggers', 'Varsity Jacket'] },
            { vibe: 'Minimalist', categories: ['T-Shirt', 'Trousers', 'Blazer', 'Loafers', 'Tote Bag'] },
            { vibe: 'Bohemian', categories: ['Maxi Dress', 'Palazzo', 'Kurti', 'Cardigan', 'Sandals', 'Scarf'] },
            { vibe: 'Feminine', categories: ['Dress', 'Midi Dress', 'Floral Blouse', 'Heels', 'Handbag', 'Skirt'] },
            { vibe: 'Athleisure', categories: ['Yoga Pants', 'Sports Bra', 'Track Pants', 'Sports Shoes', 'Sports Jacket'] },
            { vibe: 'Ethnic Chic', categories: ['Saree', 'Lehenga', 'Kurta', 'Sherwani', 'Anarkali', 'Kurti Set', 'Juttis', 'Dupatta'] },
            { vibe: 'Royal', categories: ['Sherwani', 'Lehenga', 'Anarkali', 'Banarasi Saree', 'Velvet Blazer'] },
            { vibe: 'Edgy', categories: ['Leather Jacket', 'Boots', 'Ripped Jeans', 'Mini Skirt', 'Band T-Shirt', 'Studded Belt'] },
            { vibe: 'Preppy', categories: ['Polo Shirt', 'Chinos', 'Blazer', 'Loafers', 'Boat Shoes'] },
            { vibe: 'Resort', categories: ['Romper', 'Maxi Dress', 'Shorts', 'Sandals', 'Sunglasses', 'Tote Bag', 'Linen Shirt'] },
        ];
        for (const row of vibeCategoryMap) {
            for (const cat of row.categories) {
                await session.run(`
                    MATCH (v:StyleVibe {name: $vibe})
                    MERGE (c:Category {name: $cat})
                    MERGE (v)-[:FEATURES_CATEGORY]->(c)
                `, { vibe: row.vibe, cat });
            }
        }

        // Vibe → Occasion
        const vibeOccasionMap = [
            { vibe: 'Corporate', occasions: ['Formal', 'Business Casual'] },
            { vibe: 'Streetwear', occasions: ['Casual', 'Concert'] },
            { vibe: 'Ethnic Chic', occasions: ['Festive', 'Wedding', 'Religious'] },
            { vibe: 'Royal', occasions: ['Wedding', 'Festive', 'Party'] },
            { vibe: 'Feminine', occasions: ['Brunch', 'Date Night', 'Party', 'Wedding'] },
            { vibe: 'Athleisure', occasions: ['Sport', 'Travel', 'Casual'] },
            { vibe: 'Bohemian', occasions: ['Beach', 'Outdoor', 'Casual', 'Brunch'] },
            { vibe: 'Resort', occasions: ['Beach', 'Travel', 'Brunch'] },
            { vibe: 'Minimalist', occasions: ['Casual', 'Business Casual', 'Formal', 'Travel'] },
            { vibe: 'Edgy', occasions: ['Concert', 'Party', 'Casual'] },
        ];
        for (const row of vibeOccasionMap) {
            for (const occ of row.occasions) {
                await session.run(`
                    MATCH (v:StyleVibe {name: $vibe}), (o:Occasion {name: $occ})
                    MERGE (v)-[:FITS_OCCASION]->(o)
                `, { vibe: row.vibe, occ });
            }
        }

        console.log('✅ Style vibes + color + category + occasion relations seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 11. OUTFIT COMBINATION RULES (Category → Category)
        // ══════════════════════════════════════════════════════════════════════
        const outfitCombos = [
            // Men
            { from: 'T-Shirt', to: 'Jeans', score: 10, rule: 'Classic casual pairing' },
            { from: 'T-Shirt', to: 'Chinos', score: 9, rule: 'Smart casual upgrade' },
            { from: 'Shirt', to: 'Trousers', score: 10, rule: 'Office staple' },
            { from: 'Oxford Shirt', to: 'Chinos', score: 9, rule: 'Smart casual' },
            { from: 'Dress Shirt', to: 'Business Suit', score: 10, rule: 'Formal must' },
            { from: 'Polo Shirt', to: 'Chinos', score: 9, rule: 'Preppy classic' },
            { from: 'Sweater', to: 'Trousers', score: 8, rule: 'Smart casual winter' },
            { from: 'Hoodie', to: 'Joggers', score: 9, rule: 'Athleisure combo' },
            { from: 'Kurta', to: 'Churidar', score: 10, rule: 'Ethnic staple' },
            { from: 'Sherwani', to: 'Churidar', score: 10, rule: 'Wedding / festive' },
            { from: 'Blazer', to: 'Jeans', score: 8, rule: 'Smart casual' },
            { from: 'Blazer', to: 'Trousers', score: 10, rule: 'Business formal' },
            // Women
            { from: 'Crop Top', to: 'High-Waist Jeans', score: 10, rule: 'Street-chic staple' },
            { from: 'Blouse', to: 'Palazzo', score: 9, rule: 'Chic and flowy' },
            { from: 'Kurti', to: 'Leggings', score: 10, rule: 'Everyday ethnic casual' },
            { from: 'Kurti', to: 'Palazzo', score: 9, rule: 'Ethnic casual' },
            { from: 'Tank Top', to: 'Skirt', score: 9, rule: 'Summer casual' },
            { from: 'Blouse', to: 'Pencil Skirt', score: 10, rule: 'Office chic' },
            { from: 'Off-Shoulder Top', to: 'Jeans', score: 9, rule: 'Party casual' },
            { from: 'Sports Bra', to: 'Yoga Leggings', score: 10, rule: 'Gym essential' },
            // Outerwear combos
            { from: 'Denim Jacket', to: 'T-Shirt', score: 9, rule: 'Casual layering' },
            { from: 'Blazer', to: 'T-Shirt', score: 8, rule: 'Smart casual layering' },
            { from: 'Cardigan', to: 'Blouse', score: 9, rule: 'Feminine layering' },
            { from: 'Trench Coat', to: 'Jeans', score: 9, rule: 'Classic winter' },
            { from: 'Puffer Jacket', to: 'Joggers', score: 8, rule: 'Winter athleisure' },
            // Footwear combos
            { from: 'Sneakers', to: 'Jeans', score: 10, rule: 'Casual universal' },
            { from: 'Boots', to: 'Jeans', score: 9, rule: 'Casual/edgy' },
            { from: 'Heels', to: 'Dress', score: 10, rule: 'Feminine classic' },
            { from: 'Loafers', to: 'Chinos', score: 10, rule: 'Smart casual' },
            { from: 'Oxford Shoes', to: 'Business Suit', score: 10, rule: 'Formal staple' },
            { from: 'Sandals', to: 'Shorts', score: 9, rule: 'Summer casual' },
            { from: 'Kolhapuris', to: 'Kurta', score: 10, rule: 'Ethnic footwear match' },
            { from: 'Juttis', to: 'Saree', score: 10, rule: 'Traditional pairing' },
        ];
        for (const c of outfitCombos) {
            await session.run(`
                MERGE (a:Category {name: $from})
                MERGE (b:Category {name: $to})
                MERGE (a)-[:PAIRS_WITH {score: $score, rule: $rule}]->(b)
                MERGE (b)-[:PAIRS_WITH {score: $score, rule: $rule}]->(a)
            `, c);
        }
        console.log('✅ Outfit combination rules seeded.');

        // ══════════════════════════════════════════════════════════════════════
        // 12. SUMMARY STATS
        // ══════════════════════════════════════════════════════════════════════
        const counts = await session.run(`
            MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY count DESC
        `);
        console.log('\n📊 Node Summary:');
        for (const row of counts.records) {
            console.log(`   ${row.get('label')}: ${row.get('count')}`);
        }

        const relCounts = await session.run(`
            MATCH ()-[r]->() RETURN type(r) AS rel, count(*) AS count ORDER BY count DESC
        `);
        console.log('\n🔗 Relationship Summary:');
        for (const row of relCounts.records) {
            console.log(`   ${row.get('rel')}: ${row.get('count')}`);
        }

        console.log('\n✅ ════ World-Class Fashion Knowledge Graph Seeded Successfully! ════');

    } catch (e) {
        console.error('❌ Seeding Failed:', e);
    } finally {
        await session.close();
        await closeDriver();
    }
}

seed();