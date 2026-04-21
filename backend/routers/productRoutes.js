const express = require('express');
const router = express.Router();
const { importAllFromStores } = require('../controllers/productController');

// POST /api/products/import   -> import all dishes from data/stores.json
router.post('/products/import', importAllFromStores);

module.exports = router;
