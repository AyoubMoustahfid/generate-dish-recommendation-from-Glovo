const express = require('express');
const router = express.Router();
const { getRecommendations, getRecommendationsGET, getPriceStats } = require('../controllers/recommendationsController');

/**
 * @swagger
 * /api/recommendations:
 *   post:
 *     summary: Get dish recommendations
 *     description: Find optimal dish combinations based on budget and number of plates using various algorithms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budget
 *               - numPlates
 *             properties:
 *               budget:
 *                 type: string
 *                 example: "100 MAD"
 *                 description: "Budget for the meal (e.g., '100 MAD')"
 *               numPlates:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *                 description: "Number of plates to recommend"
 *               algorithm:
 *                 type: string
 *                 enum: [exact, optimized, greedy]
 *                 default: optimized
 *                 example: "optimized"
 *                 description: "Algorithm to use for finding combinations"
 *               maxResults:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 example: 10
 *                 description: "Maximum number of recommendations to return"
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 budget:
 *                   type: string
 *                   example: "100 MAD"
 *                 numPlates:
 *                   type: integer
 *                   example: 3
 *                 algorithm:
 *                   type: string
 *                   example: "optimized"
 *                 processing_time_ms:
 *                   type: integer
 *                   example: 150
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_combinations_found:
 *                       type: integer
 *                       example: 5
 *                     average_price_per_plate:
 *                       type: string
 *                       example: "33,33 MAD"
 *                     min_residual:
 *                       type: string
 *                       example: "1,34 MAD"
 *                     max_residual:
 *                       type: string
 *                       example: "15,00 MAD"
 *                     stores_count:
 *                       type: integer
 *                       example: 4
 *                     total_dishes_considered:
 *                       type: integer
 *                       example: 120
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No stores data found
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
router.post('/recommendations', getRecommendations);

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get dish recommendations (GET method)
 *     description: Find optimal dish combinations using query parameters
 *     parameters:
 *       - in: query
 *         name: budget
 *         required: true
 *         schema:
 *           type: string
 *         example: "100 MAD"
 *         description: "Budget for the meal"
 *       - in: query
 *         name: plates
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 3
 *         description: "Number of plates to recommend"
 *       - in: query
 *         name: algorithm
 *         schema:
 *           type: string
 *           enum: [exact, optimized, greedy]
 *           default: optimized
 *         example: "optimized"
 *         description: "Algorithm to use"
 *       - in: query
 *         name: max
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         example: 10
 *         description: "Maximum number of recommendations"
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No stores data found
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
router.get('/recommendations', getRecommendationsGET);

/**
 * @swagger
 * /api/price-stats:
 *   get:
 *     summary: Get price statistics
 *     description: Retrieve statistical information about dish prices across all stored stores
 *     responses:
 *       200:
 *         description: Price statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceStats'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/price-stats', getPriceStats);

module.exports = router;