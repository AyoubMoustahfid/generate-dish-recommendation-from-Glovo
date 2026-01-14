const express = require('express');
const router = express.Router();
const { getHome, postScrape, getScrape } = require('../controllers/scrapeController');

/**
 * @swagger
 * /api/:
 *   get:
 *     summary: Get API information
 *     description: Returns basic API information and available endpoints
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Glovo Scraper API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 */
// Home route
router.get('/', getHome);

/**
 * @swagger
 * /api/scrape:
 *   post:
 *     summary: Scrape a Glovo store
 *     description: Scrape dishes and menu information from a Glovo store page
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - storeName
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://glovoapp.com/fr/ma/casablanca/stores/joa"
 *                 description: "URL of the Glovo store to scrape"
 *               storeName:
 *                 type: string
 *                 example: "JOA"
 *                 description: "Name of the store"
 *     responses:
 *       200:
 *         description: Store scraped successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Scraping failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/scrape', postScrape);

/**
 * @swagger
 * /api/scrape:
 *   get:
 *     summary: Scrape a Glovo store (GET method)
 *     description: Scrape dishes and menu information from a Glovo store page using query parameters
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         example: "https://glovoapp.com/fr/ma/casablanca/stores/joa"
 *         description: "URL of the Glovo store to scrape"
 *       - in: query
 *         name: storeName
 *         required: true
 *         schema:
 *           type: string
 *         example: "JOA"
 *         description: "Name of the store"
 *     responses:
 *       200:
 *         description: Store scraped successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Scraping failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/scrape', getScrape);

module.exports = router;