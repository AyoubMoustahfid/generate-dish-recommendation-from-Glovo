const fs = require('fs').promises;
const path = require('path');
const axios = require("axios");

// Create a data directory if it doesn't exist
const DATA_DIR = './data';
const STORE_FILE = path.join(DATA_DIR, 'stores.json');

// Initialize data directory and file
async function initDataStore() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Check if stores file exists
        try {
            await fs.access(STORE_FILE);
        } catch {
            // File doesn't exist, create it with empty array
            await fs.writeFile(STORE_FILE, JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error('Error initializing data store:', error);
    }
}

// Load existing stores data
async function loadStoresData() {
    try {
        const data = await fs.readFile(STORE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading stores data:', error);
        return [];
    }
}

// Save stores data
async function saveStoresData(stores) {
    try {
        await fs.writeFile(STORE_FILE, JSON.stringify(stores, null, 2));
        console.log(`💾 Saved ${stores.length} stores to ${STORE_FILE}`);
    } catch (error) {
        console.error('Error saving stores data:', error);
    }
}

// Check if product already exists in store (legacy, for products)
function productExistsInStore(store, product) {
    return store.products.some(existingProduct => {
        return existingProduct.title === product.title &&
            existingProduct.description === product.description;
    });
}

// Merge new categories into store
function mergeCategoriesIntoStore(existingStore, newCategories) {
    const existingCategories = existingStore.categories || [];
    const updatedCategories = [...existingCategories];
    
    // Process each new category
    newCategories.forEach(newCategory => {
        const existingCategoryIndex = updatedCategories.findIndex(
            cat => cat.category === newCategory.category
        );
        
        if (existingCategoryIndex !== -1) {
            // Category exists, merge dishes
            const existingCategory = updatedCategories[existingCategoryIndex];
            const existingDishes = existingCategory.dishes || [];
            const newUniqueDishes = [];
            
            // Check for duplicates within the same category
            for (const newDish of newCategory.dishes) {
                const isDuplicate = existingDishes.some(existingDish => 
                    existingDish.title === newDish.title && 
                    existingDish.description === newDish.description
                );
                
                if (!isDuplicate) {
                    newUniqueDishes.push(newDish);
                }
            }
            
            // Update category with merged dishes
            updatedCategories[existingCategoryIndex] = {
                ...existingCategory,
                dishes: [...existingDishes, ...newUniqueDishes]
            };
            
            console.log(`   Merged ${newUniqueDishes.length} new dishes into existing category: ${newCategory.category}`);
            
        } else {
            // New category, add it
            updatedCategories.push(newCategory);
            console.log(`   Added new category: ${newCategory.category} with ${newCategory.dishes.length} dishes`);
        }
    });
    
    return {
        ...existingStore,
        categories: updatedCategories
    };
}

// Save or update store with categories
async function saveStoreData(storeName, categories, storeUrl) {
    try {
        // Load existing stores
        const stores = await loadStoresData();
        
        // Find existing store
        const existingStoreIndex = stores.findIndex(store => 
            store.nameStore.toLowerCase() === storeName.toLowerCase()
        );
        
        if (existingStoreIndex !== -1) {
            // Store exists - merge categories and dishes
            const existingStore = stores[existingStoreIndex];
            const updatedStore = mergeCategoriesIntoStore(existingStore, categories);
            stores[existingStoreIndex] = {
                ...updatedStore,
                lastScraped: new Date().toISOString(),
                url: storeUrl || updatedStore.url
            };
            
            const totalDishes = updatedStore.categories.reduce((sum, cat) => sum + cat.dishes.length, 0);
            console.log(`📝 Updated existing store: ${storeName}`);
            console.log(`   Total categories: ${updatedStore.categories.length}`);
            console.log(`   Total dishes: ${totalDishes}`);
            
        } else {
            // Store doesn't exist - create new
            const totalDishes = categories.reduce((sum, cat) => sum + cat.dishes.length, 0);
            const newStore = {
                nameStore: storeName,
                url: storeUrl,
                lastScraped: new Date().toISOString(),
                categories: categories
            };
            stores.push(newStore);
            
            console.log(`✨ Created new store: ${storeName}`);
            console.log(`   Categories: ${categories.length}`);
            console.log(`   Total dishes: ${totalDishes}`);
        }
        
        // Save updated stores
        await saveStoresData(stores);
        
        // Also save individual store file
        try {
            const storeFile = path.join(DATA_DIR, `${storeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
            const currentStore = stores.find(s => s.nameStore === storeName);
            if (currentStore) {
                await fs.writeFile(storeFile, JSON.stringify(currentStore, null, 2));
                console.log(`💾 Saved individual store file: ${storeFile}`);
            }
        } catch (fileError) {
            console.error('Error saving individual store file:', fileError);
        }
        
        return stores;
    } catch (error) {
        console.error('Error saving store data:', error);
        throw error;
    }
}

async function convertImagesToBase64(data) {
    const results = [];
    let totalSuccessCount = 0;
    let totalFailCount = 0;

    for (const category of data) {
        const categoryResult = {
            category: category.category,
            dishes: []
        };

        for (const dish of category.dishes) {
            // If image URL is empty or invalid, skip downloading
            if (!dish.image || dish.image.trim() === '') {
                categoryResult.dishes.push({
                    ...dish,
                    image: {
                        data: null,
                        contentType: null
                    }
                });
                totalFailCount++;
                continue;
            }

            try {
                const response = await axios.get(dish.image, {
                    responseType: "arraybuffer",
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const buffer = Buffer.from(response.data);
                const base64String = buffer.toString('base64');
                const contentType = response.headers["content-type"] || 'image/jpeg';

                categoryResult.dishes.push({
                    ...dish,
                    image: {
                        data: base64String,
                        contentType
                    }
                });
                totalSuccessCount++;

            } catch (error) {
                console.error("Error downloading image:", dish.image, "-", error.message);
                categoryResult.dishes.push({
                    ...dish,
                    image: {
                        data: null,
                        contentType: null,
                        originalUrl: dish.image
                    }
                });
                totalFailCount++;
            }
        }

        results.push(categoryResult);
    }

    console.log(`📊 Image conversion: ${totalSuccessCount} succeeded, ${totalFailCount} failed`);
    return results;
}

module.exports = {
    DATA_DIR,
    STORE_FILE,
    initDataStore,
    loadStoresData,
    saveStoresData,
    productExistsInStore,
    mergeCategoriesIntoStore,
    saveStoreData,
    convertImagesToBase64
};