const puppeteer = require('puppeteer');
const { isValidGlovoUrl, extractStoreNameFromUrl, delay, CASABLANCA_COORDS } = require('../middlewares/utils/helpers');
const { saveStoreData, convertImagesToBase64 } = require('../models/storeModel');

// Main scraping function
async function scrapeGlovoStore(storeUrl, storeName) {
    let browser = null;

    try {
        console.log(`🚀 Starting Glovo scrape for: ${storeUrl}`);

        // Launch browser
        browser = await puppeteer.launch({
            headless: false, // Keep visible to debug
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

        // STEP 1: Load main Glovo page
        console.log('🌐 Loading Glovo main page...');
        await page.goto('https://glovoapp.com/fr/ma', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        await delay(3000);

        // STEP 2: Set localStorage for Casablanca
        console.log('🧹 Clearing Glovo client-side data (cookies, localStorage, sessionStorage)...');

        await page.evaluate(() => {
            // === Bookmarklet cleanup ===
            try {
                localStorage.clear();
                sessionStorage.clear();

                document.cookie.split(";").forEach(c => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });

                console.log("Glovo fully cleared.");
            } catch (err) {
                console.error("Cleanup error:", err);
            }

            // === Inject fresh Casablanca configuration ===
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
        });


        await delay(2000);

        // Take screenshot after setting localStorage
        await page.screenshot({ path: './assets/screenshots/step1-after-localstorage.png' });
        console.log('📸 Screenshot saved: step1-after-localstorage.png');

        // STEP 3: Navigate to store
        console.log(`🏪 Navigating to store: ${storeUrl}`);
        await page.goto(storeUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        await delay(5000);

        // Take screenshot of store page
        await page.screenshot({ path: './assets/screenshots/step2-store-page.png' });
        console.log('📸 Screenshot saved: step2-store-page.png');

        // Check page state
        const pageState = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            return {
                title: document.title,
                url: window.location.href,
                hasMenu: bodyText.includes('MAD') ||
                    document.querySelectorAll('[data-testid="product-row"]').length > 0,
                hasAddressPrompt: bodyText.includes('adresse') ||
                    bodyText.includes('address') ||
                    bodyText.includes('zone de livraison'),
                localStorageAddresses: localStorage.getItem('glv_user_addresses'),
                selectedAddress: localStorage.getItem('glv_selected_address_id')
            };
        });

        console.log('📊 Page state:', JSON.stringify(pageState, null, 2));

        // If we still have address prompt, try to handle it
        if (pageState.hasAddressPrompt && !pageState.hasMenu) {
            console.log('⚠️ Address prompt detected, trying to handle...');

            await page.evaluate(() => {
                // Try to find address input
                const addressInputs = document.querySelectorAll('input[placeholder*="adresse"], input[placeholder*="address"], input[type="text"]');

                if (addressInputs.length > 0) {
                    const input = addressInputs[0];
                    input.value = 'Casablanca, Morocco';
                    input.dispatchEvent(new Event('input', { bubbles: true }));

                    // Try to find submit button
                    const buttons = document.querySelectorAll('button');
                    for (const button of buttons) {
                        const text = button.textContent.toLowerCase();
                        if (text.includes('rechercher') ||
                            text.includes('search') ||
                            text.includes('trouver') ||
                            text.includes('find') ||
                            button.getAttribute('type') === 'submit') {
                            button.click();
                            console.log('Clicked submit button');
                            break;
                        }
                    }
                }
            });

            await delay(5000);
            await page.screenshot({ path: './assets/screenshots/step3-after-address-fix.png' });
            console.log('📸 Screenshot saved: step3-after-address-fix.png');
        }

        // Wait for menu content
        console.log('⏳ Waiting for menu to load...');

        // Try multiple selectors with timeout
        const menuSelectors = [
            '[data-testid="product-row"]',
            '.ItemRow_itemRow__k4ndR',
            '.pintxo-typography-body1',
            '[class*="item"]',
            '[class*="Item"]'
        ];

        let menuFound = false;
        for (const selector of menuSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                console.log(`✅ Found menu selector: ${selector}`);
                menuFound = true;
                break;
            } catch (error) {
                // Continue to next selector
            }
        }

        if (!menuFound) {
            console.log('⚠️ No specific menu selectors found, checking for any content...');
            // Just wait a bit more for any content
            await delay(3000);
        }

        // Scroll to load lazy content
        await page.evaluate(() => {
            window.scrollBy(0, 500);
        });
        await delay(1000);
        await page.evaluate(() => {
            window.scrollBy(0, 500);
        });
        await delay(1000);

        // Take final screenshot
        await page.screenshot({ path: './assets/screenshots/step4-final-menu.png' });
        console.log('📸 Screenshot saved: step4-final-menu.png');

        // STEP 4: Extract dishes by category
        console.log('🍽️ Extracting dishes by category...');
        const categoriesWithDishes = await page.evaluate(() => {
            const categories = [];

            // Selector for category sections
            const categorySelectors = [
                '.List_list__ey__x',
                '[data-testid="category-section"]',
                '.Category_category__H4zGp',
                'section[class*="list"]',
                'section[class*="category"]'
            ];

            // Find all category containers
            let categoryContainers = [];

            // Try .List_list__ey__x first
            const listContainers = document.querySelectorAll('.List_list__ey__x');
            if (listContainers.length > 0) {
                categoryContainers = Array.from(listContainers);
            } else {
                // Try other selectors
                for (const selector of categorySelectors) {
                    const containers = document.querySelectorAll(selector);
                    if (containers.length > 0) {
                        categoryContainers = Array.from(containers);
                        break;
                    }
                }
            }

            console.log(`Found ${categoryContainers.length} category containers`);

            // Process each category container
            categoryContainers.forEach((container, index) => {
                try {
                    // Extract category name
                    let categoryName = '';

                    // Try multiple ways to find category title
                    const categoryTitleSelectors = [
                        '.pintxo-typography-title3',
                        '.List_title__Sqg6j',
                        'h2, h3, h4',
                        '[class*="title"]',
                        '[class*="Title"]'
                    ];

                    for (const selector of categoryTitleSelectors) {
                        const titleElement = container.querySelector(selector);
                        if (titleElement) {
                            const text = titleElement.textContent.trim();
                            // Filter out non-category text (like prices, buttons, etc.)
                            if (text && text.length > 1 && text.length < 100 &&
                                !text.includes('MAD') &&
                                !text.includes('€') &&
                                !text.includes('DH')) {
                                categoryName = text;
                                break;
                            }
                        }
                    }

                    // If no category name found, generate one
                    if (!categoryName) {
                        categoryName = `Category ${index + 1}`;
                    }

                    console.log(`Processing category: ${categoryName}`);

                    // Find dishes within this category container
                    const dishes = [];

                    // Dish selectors
                    const dishSelectors = {
                        productRow: '[data-testid="product-row"]',
                        itemRow: '.ItemRow_itemRow__k4ndR',
                        title: '.pintxo-typography-body1',
                        price: '.pintxo-typography-body2',
                        originalPrice: '.ItemRow_originalPrice__3QZpk',
                        description: '.ItemRow_description__PfM7O',
                        discount: '.Tag_pintxo-tag__xJB7L',
                        image: 'img[loading="lazy"], .Thumbnail_pintxo-thumbnail__y4F3o img, img[src*="glovoapp"]'
                    };

                    // Find dish containers within this category
                    const dishContainers = container.querySelectorAll(dishSelectors.productRow) ||
                        container.querySelectorAll(dishSelectors.itemRow) ||
                        container.querySelectorAll('[data-testid*="product"], [class*="item"], [class*="Item"]');

                    console.log(`Found ${dishContainers.length} dish containers in ${categoryName}`);

                    // Extract data from each dish container
                    dishContainers.forEach(dishContainer => {
                        try {
                            // Find title
                            let title = '';
                            const titleElement = dishContainer.querySelector(dishSelectors.title) ||
                                dishContainer.querySelector('h2, h3, h4, [class*="title"], [class*="Title"]');
                            if (titleElement) {
                                title = titleElement.textContent.trim();
                            }

                            // Find price
                            let price = '';
                            const priceElement = dishContainer.querySelector(dishSelectors.price) ||
                                dishContainer.querySelector('[class*="price"], [class*="Price"]');
                            if (priceElement) {
                                price = priceElement.textContent.trim();
                            }

                            // If no price found, look for MAD in text
                            if (!price) {
                                const containerText = dishContainer.textContent || '';
                                const priceMatch = containerText.match(/(\d+[.,]\d+)\s*MAD/);
                                if (priceMatch) {
                                    price = priceMatch[0];
                                }
                            }

                            // Find image
                            let image = '';
                            const imageElement = dishContainer.querySelector(dishSelectors.image) ||
                                dishContainer.querySelector('img[src*="glovo"], img[src*="cloudfront"], img[src*="amazonaws"]') ||
                                dishContainer.querySelector('img');

                            if (imageElement) {
                                image = imageElement.src;
                                if (image.startsWith('//')) {
                                    image = 'https:' + image;
                                }
                            }

                            // Find description
                            let description = '';
                            const descElement = dishContainer.querySelector(dishSelectors.description) ||
                                dishContainer.querySelector('[class*="description"], [class*="Description"]');
                            if (descElement) {
                                description = descElement.textContent.trim();
                            }

                            // Find original price
                            let originalPrice = '';
                            const originalPriceElement = dishContainer.querySelector(dishSelectors.originalPrice);
                            if (originalPriceElement) {
                                originalPrice = originalPriceElement.textContent.trim();
                            }

                            // Find discount
                            let discount = '';
                            const discountElement = dishContainer.querySelector(dishSelectors.discount);
                            if (discountElement) {
                                discount = discountElement.textContent.trim();
                            }

                            // Only add if we have at least a title
                            if (title && title.length > 2) {
                                dishes.push({
                                    image: image || '',
                                    title: title,
                                    price: price,
                                    originalPrice: originalPrice,
                                    description: description,
                                    discount: discount
                                });
                            }
                        } catch (error) {
                            console.error('Error extracting dish:', error);
                        }
                    });

                    // Remove duplicate dishes within category
                    const uniqueDishes = [];
                    const seenTitles = new Set();

                    dishes.forEach(dish => {
                        if (dish.title && !seenTitles.has(dish.title)) {
                            seenTitles.add(dish.title);
                            uniqueDishes.push(dish);
                        }
                    });

                    // Add category only if it has dishes
                    if (uniqueDishes.length > 0) {
                        categories.push({
                            category: categoryName,
                            dishes: uniqueDishes
                        });
                        console.log(`✅ Added category "${categoryName}" with ${uniqueDishes.length} dishes`);
                    }

                } catch (error) {
                    console.error('Error processing category:', error);
                }
            });

            // If no categories found with the structure above, try fallback method
            if (categories.length === 0) {
                console.log('No categories found with structure, trying fallback extraction...');

                // Extract all dishes first
                const allDishes = [];
                const dishSelectors = [
                    '[data-testid="product-row"]',
                    '.ItemRow_itemRow__k4ndR',
                    '.pintxo-typography-body1'
                ];

                let dishElements = [];
                for (const selector of dishSelectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        dishElements = Array.from(elements);
                        break;
                    }
                }

                // Group by common parent containers (likely categories)
                const parentContainers = new Map();

                dishElements.forEach(dishElement => {
                    try {
                        // Find parent that might be a category container
                        let parent = dishElement;
                        let categoryName = 'Uncategorized';

                        // Try to find a category title in ancestor elements
                        for (let i = 0; i < 5; i++) {
                            parent = parent.parentElement;
                            if (!parent) break;

                            // Look for category titles in this parent
                            const possibleTitle = parent.querySelector('.pintxo-typography-title3, h2, h3, [class*="title"]');
                            if (possibleTitle) {
                                const text = possibleTitle.textContent.trim();
                                if (text && !text.includes('MAD') && !text.includes('€') && text.length < 100) {
                                    categoryName = text;
                                    break;
                                }
                            }
                        }

                        // Extract dish info
                        const title = dishElement.textContent.trim();
                        let price = '';
                        let image = '';

                        // Find price nearby
                        const priceElement = dishElement.closest('div').querySelector('.pintxo-typography-body2, [class*="price"]');
                        if (priceElement) {
                            price = priceElement.textContent.trim();
                        }

                        // Find image nearby
                        const imgElement = dishElement.closest('div').querySelector('img');
                        if (imgElement) {
                            image = imgElement.src;
                            if (image.startsWith('//')) {
                                image = 'https:' + image;
                            }
                        }

                        if (title && title.length > 2) {
                            if (!parentContainers.has(categoryName)) {
                                parentContainers.set(categoryName, []);
                            }
                            parentContainers.get(categoryName).push({
                                image: image || '',
                                title: title,
                                price: price,
                                originalPrice: '',
                                description: '',
                                discount: ''
                            });
                        }
                    } catch (error) {
                        console.error('Error in fallback extraction:', error);
                    }
                });

                // Convert map to categories array
                parentContainers.forEach((dishes, categoryName) => {
                    if (dishes.length > 0) {
                        categories.push({
                            category: categoryName,
                            dishes: dishes
                        });
                    }
                });
            }

            console.log(`Total categories: ${categories.length}`);
            let totalDishes = categories.reduce((sum, cat) => sum + cat.dishes.length, 0);
            console.log(`Total dishes across all categories: ${totalDishes}`);

            return categories;
        });

        console.log(`✅ Extracted ${categoriesWithDishes.length} categories`);

        // Display sample if we have categories
        if (categoriesWithDishes.length > 0) {
            console.log('\nSample categories:');
            categoriesWithDishes.slice(0, 3).forEach((category, i) => {
                console.log(`${i + 1}. ${category.category} - ${category.dishes.length} dishes`);
                if (category.dishes.length > 0) {
                    console.log(`   Sample dish: ${category.dishes[0].title} - ${category.dishes[0].price}`);
                }
            });
        }

        await browser.close();

        // Prepare response
        const totalDishes = categoriesWithDishes.reduce((sum, cat) => sum + cat.dishes.length, 0);
        const response = {
            success: true,
            storeName: storeName || extractStoreNameFromUrl(storeUrl) || 'Unknown Store',
            url: storeUrl,
            data: categoriesWithDishes, // Now contains categories with dishes
            totalCategories: categoriesWithDishes.length,
            totalDishes: totalDishes,
            timestamp: new Date().toISOString(),
            debug: {
                screenshots: [
                    'step1-after-localstorage.png',
                    'step2-store-page.png',
                    'step3-after-address-fix.png',
                    'step4-final-menu.png'
                ],
                localStorageSet: true,
                geolocationSet: true
            }
        };

        if (totalDishes === 0) {
            response.warning = 'No dishes found. Possible reasons:';
            response.suggestions = [
                '1. Store might be closed or have no menu',
                '2. Delivery address might not be accepted',
                '3. Store requires login',
                '4. Check the screenshots to see what page loaded'
            ];
        }

        return response;

    } catch (error) {
        if (browser) {
            await browser.close();
        }

        console.error('❌ Scraping error:', error.message);

        return {
            success: false,
            error: error.message,
            storeName: storeName || extractStoreNameFromUrl(storeUrl) || 'Unknown Store',
            url: storeUrl,
            timestamp: new Date().toISOString(),
            suggestion: 'Check the saved screenshots for debugging. You might need to manually interact with the page.'
        };
    }
}

// Controller functions
const getHome = (req, res) => {
    res.json({
        message: 'Glovo Store Menu Scraper API',
        version: '6.0',
        description: 'Scrapes Glovo store menus with proper authentication',
        endpoints: {
            scrape: 'POST /api/scrape',
            scrapeGet: 'GET /api/scrape?url=YOUR_URL&store=NAME'
        },
        example: {
            POST: '/api/scrape',
            body: {
                url: 'https://glovoapp.com/fr/ma/casablanca/stores/joa',
                storeName: 'JOA'
            }
        }
    });
};

const postScrape = async (req, res) => {
    try {
        const { url, storeName, convertImages = true } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        if (!isValidGlovoUrl(url)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Glovo URL'
            });
        }

        console.log(`📨 Scrape request for: ${url}`);
        
        // Get store name from body or extract from URL
        const finalStoreName = storeName || extractStoreNameFromUrl(url) || 'Unknown Store';
        
        const result = await scrapeGlovoStore(url, finalStoreName);
        
        if (!result.success) {
            return res.status(500).json(result);
        }
        
        // Check if we have data
        if (!result.data || result.data.length === 0) {
            return res.json({
                success: true,
                storeName: finalStoreName,
                url: url,
                warning: 'No categories found',
                totalCategories: 0,
                totalDishes: 0,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Extracted ${result.data.length} categories`);
        
        // Process images
        let processedCategories = result.data;
        let imageConversionStats = {
            totalDishes: result.data.reduce((sum, cat) => sum + cat.dishes.length, 0),
            succeeded: 0,
            failed: 0,
            format: 'url'
        };
        
        if (convertImages) {
            console.log('🖼️ Converting images to Buffer format...');
            try {
                processedCategories = await convertImagesToBase64(result.data);
                
                // Count successes and failures
                let succeeded = 0;
                let failed = 0;
                
                processedCategories.forEach(category => {
                    category.dishes.forEach(dish => {
                        if (dish.image.data !== null) {
                            succeeded++;
                        } else {
                            failed++;
                        }
                    });
                });
                
                imageConversionStats = {
                    totalDishes: succeeded + failed,
                    succeeded: succeeded,
                    failed: failed,
                    format: succeeded > 0 ? 'buffer' : 'url'
                };
                
                console.log(`📊 Image conversion: ${succeeded} succeeded, ${failed} failed`);
                
            } catch (convError) {
                console.error('❌ Error in image conversion process:', convError.message);
                imageConversionStats.error = convError.message;
            }
        }
        
        // Save to store-based structure
        try {
            await saveStoreData(finalStoreName, processedCategories, url);
            
            // Load and return all stores data
            const { loadStoresData } = require('../models/storeModel');
            const allStores = await loadStoresData();
            const currentStore = allStores.find(s => s.nameStore === finalStoreName);
            
            // Return response
            const response = {
                success: true,
                storeName: finalStoreName,
                url: url,
                totalCategories: processedCategories.length,
                totalDishes: imageConversionStats.totalDishes,
                imageConversion: imageConversionStats,
                storeData: currentStore ? {
                    nameStore: currentStore.nameStore,
                    url: currentStore.url,
                    lastScraped: currentStore.lastScraped,
                    totalCategories: currentStore.categories.length,
                    totalDishes: currentStore.categories.reduce((sum, cat) => sum + cat.dishes.length, 0)
                } : null,
                sampleCategories: processedCategories.slice(0, 2).map(cat => ({
                    category: cat.category,
                    dishCount: cat.dishes.length,
                    sampleDishes: cat.dishes.slice(0, 2)
                })),
                timestamp: new Date().toISOString()
            };
            
            res.json(response);
            
        } catch (saveError) {
            console.error('Error saving store data:', saveError);
            res.status(500).json({
                success: false,
                error: 'Failed to save store data',
                details: saveError.message,
                scrapedData: {
                    totalCategories: processedCategories.length,
                    totalDishes: processedCategories.reduce((sum, cat) => sum + cat.dishes.length, 0),
                    sampleCategories: processedCategories.slice(0, 2)
                }
            });
        }

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getScrape = async (req, res) => {
    try {
        const { url, store, convertImages = true } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL query parameter is required'
            });
        }

        if (!isValidGlovoUrl(url)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Glovo URL'
            });
        }

        console.log(`📨 Scrape request for: ${url}`);

        const finalStoreName = store || extractStoreNameFromUrl(url) || 'Unknown Store';
        const result = await scrapeGlovoStore(url, finalStoreName);

        if (!result.success) {
            return res.status(500).json(result);
        }

        // Convert image URLs to Buffer format if requested
        let processedProducts = result.data;
        if (convertImages && processedProducts && processedProducts.length > 0) {
            console.log('🖼️ Converting images to Buffer format...');
            try {
                processedProducts = await convertImagesToBase64(result.data);
                result.imageFormat = 'buffer';
                console.log(`✅ Converted ${processedProducts.length} images to Buffer format`);
            } catch (convError) {
                console.error('❌ Error converting images:', convError.message);
                result.imageConversionError = convError.message;
                result.imageFormat = 'url';
            }
        } else {
            result.imageFormat = 'url';
        }

        // Save to store-based structure
        if (processedProducts && processedProducts.length > 0) {
            try {
                await saveStoreData(finalStoreName, processedProducts, url);

                // Load and return store data
                const { loadStoresData } = require('../models/storeModel');
                const allStores = await loadStoresData();
                const storeData = allStores.find(s => s.nameStore === finalStoreName);

                // Return response
                res.json({
                    success: true,
                    storeName: finalStoreName,
                    url: url,
                    totalProducts: processedProducts.length,
                    storeData: storeData,
                    totalStores: allStores.length,
                    timestamp: new Date().toISOString()
                });

            } catch (saveError) {
                console.error('Error saving store data:', saveError);
                res.status(500).json({
                    success: false,
                    error: 'Failed to save store data',
                    details: saveError.message
                });
            }
        } else {
            res.json({
                success: true,
                storeName: finalStoreName,
                url: url,
                warning: 'No products found to save',
                totalProducts: 0,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getHome,
    postScrape,
    getScrape
};