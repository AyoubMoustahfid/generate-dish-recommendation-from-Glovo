const express = require('express');
const router = express.Router();
const {
    getAllStores,
    getStoreByName,
    deleteStoreByName,
    getStoreProducts,
    clearAllStores,
    debugData
} = require('../controllers/storeController');

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stored stores
 *     description: Retrieve a list of all scraped stores from the database
 *     responses:
 *       200:
 *         description: List of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stores', getAllStores);

/**
 * @swagger
 * /api/stores/{storeName}:
 *   get:
 *     summary: Get a specific store by name
 *     description: Retrieve detailed information about a specific store
 *     parameters:
 *       - in: path
 *         name: storeName
 *         required: true
 *         schema:
 *           type: string
 *         example: "espresso-lab"
 *         description: "Name of the store"
 *     responses:
 *       200:
 *         description: Store information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stores/:storeName', getStoreByName);

/**
 * @swagger
 * /api/stores/{storeName}:
 *   delete:
 *     summary: Delete a specific store
 *     description: Remove a store from the database
 *     parameters:
 *       - in: path
 *         name: storeName
 *         required: true
 *         schema:
 *           type: string
 *         example: "espresso-lab"
 *         description: "Name of the store to delete"
 *     responses:
 *       200:
 *         description: Store deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Store deleted successfully"
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/stores/:storeName', deleteStoreByName);

/**
 * @swagger
 * /api/stores/{storeName}/products:
 *   get:
 *     summary: Get store products
 *     description: Retrieve products/categories for a specific store
 *     parameters:
 *       - in: path
 *         name: storeName
 *         required: true
 *         schema:
 *           type: string
 *         example: "espresso-lab"
 *         description: "Name of the store"
 *     responses:
 *       200:
 *         description: Store products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stores/:storeName/products', getStoreProducts);

/**
 * @swagger
 * /api/stores:
 *   delete:
 *     summary: Clear all stores
 *     description: Remove all stored stores from the database
 *     responses:
 *       200:
 *         description: All stores cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All stores cleared successfully"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/stores', clearAllStores);

/**
 * @swagger
 * /api/debug/data:
 *   get:
 *     summary: Debug data endpoint
 *     description: Get debug information about current stored data
 *     responses:
 *       200:
 *         description: Debug information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 storesCount:
 *                   type: integer
 *                   example: 5
 *                 dataSize:
 *                   type: string
 *                   example: "2.5 MB"
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 */
router.get('/debug/data', debugData);

module.exports = router;