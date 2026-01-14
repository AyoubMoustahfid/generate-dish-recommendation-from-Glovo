const express = require('express');
const router = express.Router();
const { scrapeEstablishments, getEstablishments } = require('../controllers/establishmentsController');

/**
 * @swagger
 * /api/establishments:
 *   post:
 *     summary: Scrape establishments from category page
 *     description: Scrape all establishments (restaurants) from a Glovo category page
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://glovoapp.com/fr/ma/casablanca/categories/pizza"
 *                 description: "URL of the Glovo category page to scrape establishments from"
 *     responses:
 *       200:
 *         description: Establishments scraped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 categoryUrl:
 *                   type: string
 *                   format: uri
 *                   example: "https://glovoapp.com/fr/ma/casablanca/categories/pizza"
 *                 totalEstablishments:
 *                   type: integer
 *                   example: 25
 *                 establishments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Establishment'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 debug:
 *                   type: object
 *                   properties:
 *                     screenshots:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["establishments-category-page.png", "establishments-after-scroll.png"]
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
router.post('/establishments', scrapeEstablishments);

/**
 * @swagger
 * /api/establishments:
 *   get:
 *     summary: Scrape establishments from category page (GET method)
 *     description: Scrape all establishments (restaurants) from a Glovo category page using query parameters
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         example: "https://glovoapp.com/fr/ma/casablanca/categories/pizza"
 *         description: "URL of the Glovo category page to scrape establishments from"
 *     responses:
 *       200:
 *         description: Establishments scraped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 categoryUrl:
 *                   type: string
 *                   format: uri
 *                 totalEstablishments:
 *                   type: integer
 *                   example: 25
 *                 establishments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Establishment'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
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
router.get('/establishments', getEstablishments);

module.exports = router;