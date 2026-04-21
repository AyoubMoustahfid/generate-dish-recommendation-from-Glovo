const path = require('path');
const fs = require('fs').promises;
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

// Helper: parse price string like "12.00 MAD" -> Number
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const match = priceStr.toString().replace(',', '.').match(/\d+(?:\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
}

// Import all dishes from data/stores.json into MongoDB
async function importAllFromStores(req, res) {
    try {
        const dataFile = path.join(__dirname, '..', 'data', 'stores.json');
        const raw = await fs.readFile(dataFile, 'utf8');
        const stores = JSON.parse(raw);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const store of stores) {
            const categories = store.categories || [];
            for (const cat of categories) {
                const categoryName = (cat.category || 'Uncategorized').trim();
                if (!categoryName) continue;

                // Ensure category exists
                let categoryDoc = await Category.findOne({ name: categoryName });
                if (!categoryDoc) {
                    categoryDoc = await Category.create({ name: categoryName });
                }

                for (const dish of cat.dishes || []) {
                    const name = (dish.title || dish.name || '').trim();
                    if (!name) {
                        skipped++;
                        continue;
                    }

                    const description = (dish.description || '').trim() || 'No description';
                    const price = parsePrice(dish.price || dish.originalPrice || '0');

                    // Prepare photo
                    let photo = undefined;
                    if (dish.image && dish.image.data) {
                        // image.data might be base64 or Buffer
                        try {
                            const b64 = typeof dish.image.data === 'string' ? dish.image.data : dish.image.data.toString('base64');
                            photo = {
                                data: Buffer.from(b64, 'base64'),
                                contentType: dish.image.contentType || 'image/jpeg'
                            };
                        } catch (e) {
                            photo = undefined;
                        }
                    }

                    // Upsert product by name
                    const update = {
                        name,
                        description,
                        price,
                        quantity: dish.quantity || 1,
                        photo,
                        category: categoryDoc._id
                    };

                    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
                    const existing = await Product.findOneAndUpdate({ name }, update, opts);
                    if (existing) {
                        // If upsert created new document, Mongoose returns the found doc; to detect creation, try to check createdAt vs updatedAt
                        updated++;
                    }
                    created++;
                }
            }
        }

        res.json({ success: true, message: 'Import finished', created, updated, skipped });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    importAllFromStores
};
