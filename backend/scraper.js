const axios = require('axios');
const cheerio = require('cheerio');

class GlovoScraper {
    constructor() {
        this.baseURL = 'https://glovoapp.com';
        this.timeout = 15000;
    }

    async scrapeStore(url) {
        try {
            console.log(`🌐 Scraping URL: ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                timeout: this.timeout
            });

            const html = response.data;
            console.log(`📄 HTML length: ${html.length} characters`);
            
            // Save HTML to file for debugging
            // require('fs').writeFileSync('debug.html', html);
            
            const $ = cheerio.load(html);

            const storeData = {
                storeName: this.extractStoreName($),
                url: url,
                sections: [],
                allDishes: [],
                totalDishes: 0,
                scrapedAt: new Date().toISOString()
            };

            // Try multiple selectors for sections
            const sectionSelectors = [
                '.List_list__ey__x', // Original selector
                '[class*="List_list"]', // Partial class match
                '[class*="list"]', // Any element with "list" in class
                'div[class*="List"]', // Div with "List" in class
                'section', // HTML5 section tag
                '.store-menu-section', // Alternative selector
                '.category-container' // Another alternative
            ];

            let sectionsFound = false;
            
            for (const selector of sectionSelectors) {
                const sections = $(selector);
                console.log(`🔍 Trying selector "${selector}": Found ${sections.length} elements`);
                
                if (sections.length > 0) {
                    console.log(`✅ Using selector: ${selector}`);
                    sectionsFound = true;
                    this.extractSections($, sections, storeData);
                    break;
                }
            }

            if (!sectionsFound) {
                console.log('⚠️ No sections found with standard selectors, trying to find any menu structure');
                this.fallbackExtraction($, storeData);
            }

            storeData.totalDishes = storeData.allDishes.length;
            console.log(`✅ Found ${storeData.sections.length} sections with ${storeData.totalDishes} total dishes`);
            
            return storeData;

        } catch (error) {
            console.error('❌ Error scraping store:', error.message);
            throw new Error(`Failed to scrape store: ${error.message}`);
        }
    }

    extractSections($, sectionElements, storeData) {
        sectionElements.each((sectionIndex, sectionElement) => {
            // Try multiple selectors for section title
            const titleSelectors = [
                '.List_title__Sqg6j',
                '.pintxo-typography-title3',
                'h2',
                'h3',
                '[class*="title"]',
                '[class*="Title"]'
            ];

            let sectionTitle = '';
            for (const selector of titleSelectors) {
                const title = $(sectionElement).find(selector).first().text().trim();
                if (title) {
                    sectionTitle = title;
                    break;
                }
            }

            const sectionId = $(sectionElement).attr('id') || 
                              $(sectionElement).attr('data-id') || 
                              `section-${sectionIndex}`;

            const section = {
                id: sectionId,
                title: sectionTitle || `Section ${sectionIndex + 1}`,
                dishes: []
            };

            console.log(`📋 Section ${sectionIndex + 1}: ${section.title}`);

            // Try multiple selectors for dishes
            const dishSelectors = [
                '[data-testid="product-row"]',
                '[class*="ItemRow"]',
                '[class*="item-row"]',
                '[class*="product"]',
                '.menu-item',
                '.dish-item',
                'article'
            ];

            let dishesFound = 0;
            
            for (const selector of dishSelectors) {
                const dishElements = $(sectionElement).find(selector);
                console.log(`   🍽️  Trying dish selector "${selector}": Found ${dishElements.length} elements`);
                
                if (dishElements.length > 0) {
                    dishElements.each((dishIndex, dishElement) => {
                        const dish = this.extractDishData($, dishElement);
                        if (dish && dish.name) {
                            dish.id = `${section.id}-dish-${dishesFound}`;
                            section.dishes.push(dish);
                            storeData.allDishes.push({
                                ...dish,
                                section: section.title,
                                sectionId: section.id
                            });
                            dishesFound++;
                        }
                    });
                    break;
                }
            }

            if (section.dishes.length > 0) {
                storeData.sections.push(section);
                console.log(`   ✅ Added ${section.dishes.length} dishes to section`);
            } else {
                console.log(`   ⚠️  No dishes found in section`);
            }
        });
    }

    fallbackExtraction($, storeData) {
        console.log('🔄 Using fallback extraction method');
        
        // Create a default section
        const section = {
            id: 'default-section',
            title: 'Menu',
            dishes: []
        };

        // Look for any potential dish items in the entire page
        const potentialDishSelectors = [
            'div[class*="item"]',
            'div[class*="product"]',
            'div[class*="card"]',
            'article',
            'li',
            'div.menu-item',
            'div.dish-item'
        ];

        let dishCount = 0;
        
        for (const selector of potentialDishSelectors) {
            const elements = $(selector);
            console.log(`Fallback selector "${selector}": ${elements.length} elements`);
            
            elements.each((index, element) => {
                // Check if this looks like a dish (has price, image, or name)
                const hasPrice = $(element).text().match(/MAD|€|\$|\d+,\d+/);
                const hasImage = $(element).find('img').length > 0;
                const hasTitle = $(element).find('h2, h3, h4, [class*="title"], [class*="name"]').length > 0;
                
                if ((hasPrice || hasImage || hasTitle) && dishCount < 50) { // Limit to 50 items
                    const dish = this.extractDishDataFallback($, element);
                    if (dish && dish.name) {
                        dish.id = `dish-${dishCount}`;
                        section.dishes.push(dish);
                        storeData.allDishes.push({
                            ...dish,
                            section: section.title,
                            sectionId: section.id
                        });
                        dishCount++;
                    }
                }
            });
            
            if (dishCount > 0) break;
        }

        if (section.dishes.length > 0) {
            storeData.sections.push(section);
        }
    }

    extractDishData($, dishElement) {
        try {
            // Try multiple selectors for each field
            const nameSelectors = [
                '.ItemRow_titleContainer__c_gHR h2',
                '[class*="title"] h2',
                'h2',
                'h3',
                '[class*="name"]',
                '[class*="Name"]',
                '.dish-name',
                '.product-name'
            ];

            const priceSelectors = [
                '.ItemRow_priceContainer__G5B13 .pintxo-typography-body2',
                '[class*="price"]',
                '[class*="Price"]',
                '.price',
                '.current-price'
            ];

            const originalPriceSelectors = [
                '.ItemRow_originalPrice__3QZpk',
                '.original-price',
                '[class*="original"]',
                's', // strikethrough tag
                '.strikethrough'
            ];

            const discountSelectors = [
                '.ItemRow_tagsContainer__dPkGg .Tag_pintxo-tag__xJB7L',
                '.discount',
                '[class*="discount"]',
                '[class*="promo"]',
                '.tag',
                '.badge'
            ];

            const descriptionSelectors = [
                '.ItemRow_description__PfM7O',
                '[class*="description"]',
                '[class*="desc"]',
                '.desc',
                'p'
            ];

            const imageSelectors = [
                '.Thumbnail_pintxo-thumbnail__y4F3o img',
                '[class*="thumbnail"] img',
                '[class*="image"] img',
                'img'
            ];

            const dish = {
                name: this.findText($, dishElement, nameSelectors),
                description: this.findText($, dishElement, descriptionSelectors),
                currentPrice: this.findText($, dishElement, priceSelectors),
                originalPrice: this.findText($, dishElement, originalPriceSelectors),
                discount: this.findText($, dishElement, discountSelectors),
                image: this.findAttribute($, dishElement, imageSelectors, 'src'),
                alt: this.findAttribute($, dishElement, imageSelectors, 'alt')
            };

            // Clean up values
            Object.keys(dish).forEach(key => {
                if (typeof dish[key] === 'string') {
                    dish[key] = dish[key].replace(/&nbsp;/g, ' ').trim();
                }
            });

            // Only return dish if it has at least a name
            if (!dish.name || dish.name.length < 2) {
                return null;
            }

            return dish;
        } catch (error) {
            console.error('Error extracting dish data:', error);
            return null;
        }
    }

    extractDishDataFallback($, element) {
        try {
            const dish = {
                name: $(element).find('h2, h3, h4').first().text().trim() ||
                      $(element).text().split('\n')[0].substring(0, 100).trim(),
                description: $(element).find('p').first().text().trim(),
                currentPrice: this.extractPrice($(element).text()),
                originalPrice: '',
                discount: '',
                image: $(element).find('img').first().attr('src') || '',
                alt: $(element).find('img').first().attr('alt') || ''
            };

            // Clean up
            dish.name = dish.name.replace(/&nbsp;/g, ' ').trim();
            
            if (dish.name.length < 2) {
                return null;
            }

            return dish;
        } catch (error) {
            return null;
        }
    }

    findText($, element, selectors) {
        for (const selector of selectors) {
            const text = $(element).find(selector).first().text().trim();
            if (text) return text;
        }
        return '';
    }

    findAttribute($, element, selectors, attribute) {
        for (const selector of selectors) {
            const attr = $(element).find(selector).first().attr(attribute);
            if (attr) return attr;
        }
        return '';
    }

    extractPrice(text) {
        const priceMatch = text.match(/(\d+[.,]\d+)\s*(MAD|€|\$)/);
        return priceMatch ? priceMatch[0] : '';
    }

    extractStoreName($) {
        // Try multiple methods to get store name
        const storeName = 
            $('meta[property="og:title"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            $('title').text().trim() ||
            $('h1').first().text().trim() ||
            $('header h1, header h2').first().text().trim();

        if (storeName) {
            return storeName
                .split('|')[0]
                .split('-')[0]
                .replace('Glovo', '')
                .trim() || 'Unknown Store';
        }

        return 'Glovo Store';
    }

    buildStoreUrl(country = 'fr', city = 'ma/casablanca', storeName) {
        if (!storeName) {
            throw new Error('Store name is required');
        }
        return `${this.baseURL}/${country}/${city}/stores/${storeName}`.toLowerCase();
    }

    async scrapeByStoreName(storeName, country = 'fr', city = 'ma/casablanca') {
        const url = this.buildStoreUrl(country, city, storeName);
        return this.scrapeStore(url);
    }
}

module.exports = GlovoScraper;


 [
    { // examlpe 1
        "plates": [
            {
                "nameStore": "espresso-lab",
                "url": "https://glovoapp.com/fr/ma/casablanca/stores/espresso-lab",
                "restaurant": {
                    "promotions": [
                        "Livraison gratuite à partir de 100 MAD",
                        "-30% sur les menus"
                    ],
                    "info_Details": {
                        "rating": "4.5 ★ (500+)",
                        "eta_store": "20-30 min",
                        "service_fee": "5 MAD",
                        "badge": "Prime",
                        "store_name": "Restaurant Name",
                        "store_category": "Fast Food • Burger",
                        "delivery_fee": "10 MAD",
                        "minimum_order": "40 MAD"
                    },
                },
                "products": [
                    {
                        "category": "",
                        "dishes": [
                            {/*............*/}, // or more
                        ]
                    },
                    // or more dishes
                ],
                
            },

            {
                "nameStore": "sushi",
                "url": "https://glovoapp.com/fr/ma/casablanca/stores/sushi",
                "restaurant": {/*..........*/},
                "products": [
                    {
                        "category": "",
                        "dishes": [
                            {/*............*/}, // or more
                        ]
                    },
                    // or more dishes
                ],
                
            },
            // other restaurants
        ],
        "total_price": "", 
        "residual": ""  // for example total price is 300 MAD and it remains of 30 or 0
    },
    // ........ more plates (other examples)
]