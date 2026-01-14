const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { delay, CASABLANCA_COORDS } = require('../middlewares/utils/helpers');

// Data directory
const DATA_DIR = './data';

// Add this function to scrape establishments from category pages
async function scrapeEstablishmentsFromCategory(categoryUrl) {
    let browser = null;

    try {
        console.log(`🚀 Starting establishments scrape for: ${categoryUrl}`);

        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1200,800'
            ]
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set viewport
        await page.setViewport({ width: 1200, height: 800 });

        // Set geolocation (Casablanca)
        await page.setGeolocation(CASABLANCA_COORDS);

        // Set extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'fr-FR,fr;q=0.9'
        });

        // Override permissions for geolocation
        const context = browser.defaultBrowserContext();
        await context.overridePermissions('https://glovoapp.com', ['geolocation']);

        // Set localStorage for Casablanca
        console.log('🌐 Loading category page...');
        await page.goto(categoryUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        await delay(3000);

        // Set localStorage for Casablanca
        await page.evaluate(() => {
            try {
                localStorage.setItem("glv_city", "Casablanca");
                localStorage.setItem("glv_country", "ma");
                localStorage.setItem("glv_currency", "MAD");
                localStorage.setItem("glv_language", "fr");
                localStorage.setItem("glv_platform", "web");

                const addressData = {
                    "DELIVERY.casablanca_main": {
                        fullText: "Casablanca, Morocco",
                        placeId: "casablanca_main",
                        city: "Casablanca",
                        country: "ma",
                        lat: 33.5731,
                        lng: -7.5898,
                        addressLine: "Casablanca",
                        zoneId: "casablanca_zone",
                        isDefault: true,
                        createdAt: new Date().toISOString()
                    }
                };

                localStorage.setItem("glv_user_addresses", JSON.stringify(addressData));
                localStorage.setItem("glv_selected_address_id", "DELIVERY.casablanca_main");
            } catch (err) {
                console.error("Error setting localStorage:", err);
            }
        });

        await delay(2000);

        // Take screenshot
        await page.screenshot({ path: 'establishments-category-page.png' });
        console.log('📸 Screenshot saved: establishments-category-page.png');

        // Function to scroll and load more restaurants
        async function scrollToLoadAll() {
            console.log('🔄 Scrolling to load all restaurants...');

            let previousHeight = 0;
            let currentHeight = await page.evaluate(() => document.body.scrollHeight);
            let scrollAttempts = 0;
            const maxScrollAttempts = 20;

            while (scrollAttempts < maxScrollAttempts) {
                // Scroll to bottom
                await page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                });

                await delay(2000); // Wait for content to load

                // Check if new content was loaded
                currentHeight = await page.evaluate(() => document.body.scrollHeight);

                if (currentHeight === previousHeight) {
                    // No more content loading, check if we have "Load more" button
                    const loadMoreButton = await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        return buttons.find(btn =>
                            btn.textContent.includes('Voir plus') ||
                            btn.textContent.includes('Load more') ||
                            btn.textContent.includes('Afficher plus')
                        );
                    });

                    if (loadMoreButton) {
                        console.log('📝 Found "Load more" button, clicking...');
                        await page.evaluate((btn) => btn.click(), loadMoreButton);
                        await delay(3000);
                    } else {
                        console.log('✅ No more content to load');
                        break;
                    }
                }

                previousHeight = currentHeight;
                scrollAttempts++;
                console.log(`🔄 Scroll attempt ${scrollAttempts}/${maxScrollAttempts}`);
            }

            // One final scroll to top
            await page.evaluate(() => {
                window.scrollTo(0, 0);
            });
            await delay(1000);
        }

        // Scroll to load all restaurants
        await scrollToLoadAll();

        // Take screenshot after loading all content
        await page.screenshot({ path: 'establishments-after-scroll.png' });
        console.log('📸 Screenshot saved: establishments-after-scroll.png');

        // Extract establishments data
        console.log('🏪 Extracting establishments data...');
        const establishments = await page.evaluate(() => {
            const establishments = [];

            // Selector for store cards
            const storeCardSelectors = [
                'a.StoreCardStoreWall_wrapper__u8Dc8',
                '.StoreCardStoreWall_wrapper__u8Dc8',
                '[data-testid="store-card"]',
                'a[href*="/stores/"]'
            ];

            // Find all store cards
            let storeCards = [];
            for (const selector of storeCardSelectors) {
                const cards = document.querySelectorAll(selector);
                if (cards.length > 0) {
                    storeCards = Array.from(cards);
                    console.log(`Found ${storeCards.length} store cards with selector: ${selector}`);
                    break;
                }
            }

            // If no specific cards found, try a broader search
            if (storeCards.length === 0) {
                console.log('No specific store cards found, trying broader search...');
                const allLinks = document.querySelectorAll('a');
                storeCards = Array.from(allLinks).filter(link =>
                    link.href.includes('/stores/') &&
                    link.querySelector('img, [class*="card"], [class*="Card"]')
                );
                console.log(`Found ${storeCards.length} store links via broader search`);
            }

            // Process each store card
            storeCards.forEach((card, index) => {
                try {
                    // Extract link
                    let link = card.href;
                    if (!link.startsWith('http')) {
                        link = 'https://glovoapp.com' + link;
                    }

                    // Extract image
                    let image = '';
                    const imgElement = card.querySelector('img');
                    if (imgElement) {
                        image = imgElement.src;
                        if (image.startsWith('//')) {
                            image = 'https:' + image;
                        }
                    }

                    // Extract name
                    let name = '';
                    const nameElement = card.querySelector('.StoreCardStoreWall_title__zlmbD, [class*="title"], [class*="Title"], h3, h4');
                    if (nameElement) {
                        name = nameElement.textContent.trim();
                    }

                    // Extract store details container
                    const detailsContainer = card.querySelector('.StoreCardStoreWall_details__dUL2v') || card;

                    // Extract delivery fee
                    let deliveryFee = '';
                    const deliveryFeeElement = detailsContainer.querySelector('.StoreDeliveryFee_deliveryFee__nUWP7, [class*="delivery"], [class*="Delivery"]');
                    if (deliveryFeeElement) {
                        deliveryFee = deliveryFeeElement.textContent.trim();
                    }

                    // Extract ETA
                    let eta = '';
                    const etaParagraph = detailsContainer.querySelector('p.StoreCardStoreWall_eta__PTtZY.pintxo-typography-caption');
                    if (etaParagraph) {
                        eta = etaParagraph.textContent.trim();
                    }

                    // Extract ratings
                    const ratingsElement = detailsContainer.querySelector('.StoreRatings_ratings__RuFH4, [class*="rating"], [class*="Rating"]');
                    let ratingTotal = '';
                    let ratingVotes = '';

                    if (ratingsElement) {
                        const totalElement = ratingsElement.querySelector('.pintxo-typography-caption-emphasis, [class*="total"], [class*="Total"]');
                        if (totalElement) {
                            ratingTotal = totalElement.textContent.trim();
                        }

                        const votesElement = ratingsElement.querySelector('.StoreRatings_votes__YV83D, [class*="votes"], [class*="Votes"]');
                        if (votesElement) {
                            ratingVotes = votesElement.textContent.trim();
                        }
                    }

                    // Fallback: extract rating from text if not found with selectors
                    if (!ratingTotal) {
                        const cardText = card.textContent || '';
                        const ratingMatch = cardText.match(/(\d+%)\s*\(([^)]+)\)/);
                        if (ratingMatch) {
                            ratingTotal = ratingMatch[1];
                            ratingVotes = ratingMatch[2];
                        }
                    }

                    // Extract discount/promotion badges
                    let discountBadge = '';
                    const discountElement = card.querySelector('.Tag_pintxo-tag__xJB7L, [class*="discount"], [class*="Discount"], [class*="badge"], [class*="Badge"]');
                    if (discountElement && !discountElement.closest('.StoreDeliveryFee_deliveryFee__nUWP7')) {
                        discountBadge = discountElement.textContent.trim();
                    }

                    // Only add if we have at least a name
                    if (name && name.length > 2) {
                        establishments.push({
                            link: link,
                            image: image,
                            name: name,
                            store_details: {
                                delivery_fee: deliveryFee,
                                eta: eta,
                                caption_emphasis: {
                                    total: ratingTotal,
                                    votes: ratingVotes
                                },
                                discount_badge: discountBadge
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error processing store card ${index}:`, error);
                }
            });

            // Remove duplicates based on link
            const uniqueEstablishments = [];
            const seenLinks = new Set();

            establishments.forEach(est => {
                if (est.link && !seenLinks.has(est.link)) {
                    seenLinks.add(est.link);
                    uniqueEstablishments.push(est);
                }
            });

            console.log(`Total unique establishments: ${uniqueEstablishments.length}`);
            return uniqueEstablishments;
        });

        console.log(`✅ Extracted ${establishments.length} establishments`);

        // Convert images to base64
        console.log('🖼️ Converting establishment images to base64...');
        const establishmentsWithBase64Images = await Promise.all(
            establishments.map(async (est) => {
                if (est.image && est.image.trim() !== '') {
                    try {
                        const response = await axios.get(est.image, {
                            responseType: "arraybuffer",
                            timeout: 5000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        });

                        const buffer = Buffer.from(response.data);
                        const base64String = buffer.toString('base64');
                        const contentType = response.headers["content-type"] || 'image/jpeg';

                        return {
                            ...est,
                            image: base64String,
                            image_content_type: contentType
                        };
                    } catch (error) {
                        console.error(`Error downloading image for ${est.name}:`, error.message);
                        return {
                            ...est,
                            image: null,
                            image_content_type: null
                        };
                    }
                } else {
                    return {
                        ...est,
                        image: null,
                        image_content_type: null
                    };
                }
            })
        );

        await browser.close();

        // Prepare response
        const response = {
            success: true,
            categoryUrl: categoryUrl,
            totalEstablishments: establishmentsWithBase64Images.length,
            establishments: establishmentsWithBase64Images,
            timestamp: new Date().toISOString(),
            debug: {
                screenshots: [
                    'establishments-category-page.png',
                    'establishments-after-scroll.png'
                ]
            }
        };

        if (establishmentsWithBase64Images.length === 0) {
            response.warning = 'No establishments found. Possible reasons:';
            response.suggestions = [
                '1. Category page might have different structure',
                '2. No restaurants in this category for current location',
                '3. Page requires login or has blocking',
                '4. Check the screenshots to see what loaded'
            ];
        }

        return response;

    } catch (error) {
        if (browser) {
            await browser.close();
        }

        console.error('❌ Establishments scraping error:', error.message);

        return {
            success: false,
            error: error.message,
            categoryUrl: categoryUrl,
            timestamp: new Date().toISOString(),
            suggestion: 'Check the saved screenshots for debugging.'
        };
    }
}

// Helper function to validate category URL
function isValidCategoryUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('glovoapp.com') &&
            urlObj.pathname.includes('/categories/');
    } catch (error) {
        return false;
    }
}

// Controller functions
const scrapeEstablishments = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        if (!isValidCategoryUrl(url)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Glovo category URL. URL should contain "/categories/"'
            });
        }

        console.log(`📨 Establishments scrape request for: ${url}`);
        const result = await scrapeEstablishmentsFromCategory(url);

        if (!result.success) {
            return res.status(500).json(result);
        }

        // Save to file
        try {
            const fileName = `establishments_${Date.now()}.json`;
            const filePath = path.join(DATA_DIR, fileName);
            await fs.writeFile(filePath, JSON.stringify(result.establishments, null, 2));
            console.log(`💾 Saved establishments to: ${filePath}`);

            result.savedFile = filePath;
        } catch (fileError) {
            console.error('Error saving establishments file:', fileError);
        }

        res.json(result);

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getEstablishments = async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL query parameter is required'
            });
        }

        if (!isValidCategoryUrl(url)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Glovo category URL. URL should contain "/categories/"'
            });
        }

        console.log(`📨 Establishments scrape request for: ${url}`);
        const result = await scrapeEstablishmentsFromCategory(url);

        res.json(result);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    scrapeEstablishments,
    getEstablishments
};