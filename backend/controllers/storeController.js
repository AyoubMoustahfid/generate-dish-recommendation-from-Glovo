const { loadStoresData, saveStoresData } = require('../models/storeModel');

// GET all stores
const getAllStores = async (req, res) => {
    try {
        const stores = await loadStoresData();
        res.json({
            success: true,
            totalStores: stores.length,
            stores: stores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET specific store by name
const getStoreByName = async (req, res) => {
    try {
        const { storeName } = req.params;
        const stores = await loadStoresData();
        const store = stores.find(s => s.nameStore.toLowerCase() === storeName.toLowerCase());

        if (store) {
            res.json({
                success: true,
                store: store
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// DELETE specific store
const deleteStoreByName = async (req, res) => {
    try {
        const { storeName } = req.params;
        const stores = await loadStoresData();
        const filteredStores = stores.filter(s => s.nameStore.toLowerCase() !== storeName.toLowerCase());

        if (filteredStores.length < stores.length) {
            await saveStoresData(filteredStores);
            res.json({
                success: true,
                message: `Store '${storeName}' deleted successfully`,
                totalStores: filteredStores.length
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET store products (alternative to stores/:storeName)
const getStoreProducts = async (req, res) => {
    try {
        const { storeName } = req.params;
        const stores = await loadStoresData();
        const store = stores.find(s => s.nameStore.toLowerCase() === storeName.toLowerCase());

        if (store) {
            res.json({
                success: true,
                storeName: store.nameStore,
                totalProducts: store.products ? store.products.length : 0,
                products: store.products || []
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Clear all stores data
const clearAllStores = async (req, res) => {
    try {
        await saveStoresData([]);
        res.json({
            success: true,
            message: 'All stores data cleared'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Debug endpoint to check current data
const debugData = async (req, res) => {
    try {
        const stores = await loadStoresData();
        const fs = require('fs').promises;
        const path = require('path');
        const { DATA_DIR } = require('../models/storeModel');

        // Check data directory
        const files = await fs.readdir(DATA_DIR);

        res.json({
            success: true,
            dataDirectory: DATA_DIR,
            files: files,
            totalStores: stores.length,
            stores: stores.map(store => ({
                name: store.nameStore,
                productCount: store.products ? store.products.length : (store.categories ? store.categories.reduce((sum, cat) => sum + cat.dishes.length, 0) : 0),
                lastScraped: store.lastScraped
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllStores,
    getStoreByName,
    deleteStoreByName,
    getStoreProducts,
    clearAllStores,
    debugData
};