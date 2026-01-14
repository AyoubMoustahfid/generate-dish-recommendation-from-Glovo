const { loadStoresData } = require('../models/storeModel');
const { parsePrice, formatPrice } = require('../middlewares/utils/helpers');

// Main algorithm to find dish combinations
function findDishCombinations(stores, budget, numPlates, maxCombinations = 10) {
    const budgetNum = parsePrice(budget);
    if (budgetNum <= 0 || numPlates <= 0) {
        return [];
    }

    // Flatten all dishes from all stores with store info
    const allDishes = [];

    stores.forEach(store => {
        if (store.categories && Array.isArray(store.categories)) {
            store.categories.forEach(category => {
                if (category.dishes && Array.isArray(category.dishes)) {
                    category.dishes.forEach(dish => {
                        const dishPrice = parsePrice(dish.price);
                        if (dishPrice > 0 && dishPrice <= budgetNum) {
                            allDishes.push({
                                storeInfo: {
                                    nameStore: store.nameStore,
                                    url: store.url,
                                    restaurant: store.restaurant || {}
                                },
                                category: category.category,
                                dish: {
                                    ...dish,
                                    priceNum: dishPrice,
                                    priceFormatted: dish.price
                                },
                                price: dishPrice
                            });
                        }
                    });
                }
            });
        }
    });

    // Sort dishes by price (ascending)
    allDishes.sort((a, b) => a.price - b.price);

    // Dynamic programming approach for finding combinations
    const results = [];
    const memo = new Map();

    function backtrack(start, remainingBudget, remainingPlates, currentCombination) {
        const key = `${start}-${remainingBudget}-${remainingPlates}-${currentCombination.length}`;

        if (memo.has(key)) {
            return memo.get(key);
        }

        // If we've found a valid combination
        if (remainingPlates === 0) {
            const totalPrice = currentCombination.reduce((sum, item) => sum + item.price, 0);
            const residual = budgetNum - totalPrice;

            // Group dishes by store
            const storesMap = new Map();
            currentCombination.forEach(item => {
                if (!storesMap.has(item.storeInfo.nameStore)) {
                    storesMap.set(item.storeInfo.nameStore, {
                        ...item.storeInfo,
                        products: []
                    });
                }

                const store = storesMap.get(item.storeInfo.nameStore);
                let categoryFound = store.products.find(p => p.category === item.category);

                if (!categoryFound) {
                    categoryFound = {
                        category: item.category,
                        dishes: []
                    };
                    store.products.push(categoryFound);
                }

                categoryFound.dishes.push(item.dish);
            });

            const result = {
                plates: Array.from(storesMap.values()),
                total_price: formatPrice(totalPrice),
                residual: formatPrice(residual),
                total_price_num: totalPrice,
                residual_num: residual
            };

            results.push(result);
            memo.set(key, [result]);
            return [result];
        }

        // If we've exhausted all dishes or budget
        if (start >= allDishes.length || remainingBudget <= 0 || remainingPlates <= 0) {
            memo.set(key, []);
            return [];
        }

        const combinations = [];

        // Try including the current dish
        const currentDish = allDishes[start];
        if (currentDish.price <= remainingBudget) {
            const withCurrent = backtrack(
                start + 1,
                remainingBudget - currentDish.price,
                remainingPlates - 1,
                [...currentCombination, currentDish]
            );
            combinations.push(...withCurrent);
        }

        // Try skipping the current dish
        const withoutCurrent = backtrack(
            start + 1,
            remainingBudget,
            remainingPlates,
            currentCombination
        );
        combinations.push(...withoutCurrent);

        memo.set(key, combinations);
        return combinations;
    }

    // Start backtracking
    backtrack(0, budgetNum, numPlates, []);

    // Filter and sort results
    const validResults = results
        .filter(result => result.total_price_num > 0)
        .sort((a, b) => {
            // Sort by lowest residual (closest to budget), then by highest total price
            if (a.residual_num !== b.residual_num) {
                return a.residual_num - b.residual_num;
            }
            return b.total_price_num - a.total_price_num;
        })
        .slice(0, maxCombinations);

    return validResults;
}

// Alternative algorithm using iterative approach for better performance
function findDishCombinationsOptimized(stores, budget, numPlates, maxCombinations = 10) {
    const budgetNum = parsePrice(budget);
    if (budgetNum <= 0 || numPlates <= 0) {
        return [];
    }

    // Flatten and preprocess dishes
    const allDishes = [];

    stores.forEach(store => {
        if (store.categories && Array.isArray(store.categories)) {
            store.categories.forEach(category => {
                if (category.dishes && Array.isArray(category.dishes)) {
                    category.dishes.forEach(dish => {
                        const dishPrice = parsePrice(dish.price);
                        if (dishPrice > 0 && dishPrice <= budgetNum) {
                            allDishes.push({
                                storeInfo: {
                                    nameStore: store.nameStore,
                                    url: store.url,
                                    restaurant: store.restaurant || {}
                                },
                                category: category.category,
                                dish: {
                                    ...dish,
                                    priceNum: dishPrice,
                                    priceFormatted: dish.price
                                },
                                price: dishPrice,
                                storeId: store.nameStore
                            });
                        }
                    });
                }
            });
        }
    });

    // Sort by price
    allDishes.sort((a, b) => a.price - b.price);

    // Use BFS with pruning for better performance
    const results = [];

    // Queue: [index, remainingBudget, remainingPlates, combination, visitedStores]
    const queue = [[0, budgetNum, numPlates, [], new Set()]];

    while (queue.length > 0 && results.length < maxCombinations * 10) {
        const [index, remainingBudget, remainingPlates, combination, visitedStores] = queue.shift();

        // Base case: found valid combination
        if (remainingPlates === 0) {
            const totalPrice = combination.reduce((sum, item) => sum + item.price, 0);
            const residual = budgetNum - totalPrice;

            // Group dishes by store
            const storesMap = new Map();
            combination.forEach(item => {
                if (!storesMap.has(item.storeInfo.nameStore)) {
                    storesMap.set(item.storeInfo.nameStore, {
                        ...item.storeInfo,
                        products: []
                    });
                }

                const store = storesMap.get(item.storeInfo.nameStore);
                let categoryFound = store.products.find(p => p.category === item.category);

                if (!categoryFound) {
                    categoryFound = {
                        category: item.category,
                        dishes: []
                    };
                    store.products.push(categoryFound);
                }

                categoryFound.dishes.push(item.dish);
            });

            results.push({
                plates: Array.from(storesMap.values()),
                total_price: formatPrice(totalPrice),
                residual: formatPrice(residual),
                total_price_num: totalPrice,
                residual_num: residual
            });
            continue;
        }

        // Termination conditions
        if (index >= allDishes.length || remainingBudget <= 0 || remainingPlates <= 0) {
            continue;
        }

        const currentDish = allDishes[index];

        // Pruning: skip if dish is too expensive or if we've already included a dish from this store
        if (currentDish.price <= remainingBudget && !visitedStores.has(currentDish.storeId)) {
            // Include current dish
            const newVisitedStores = new Set(visitedStores);
            newVisitedStores.add(currentDish.storeId);

            queue.push([
                index + 1,
                remainingBudget - currentDish.price,
                remainingPlates - 1,
                [...combination, currentDish],
                newVisitedStores
            ]);
        }

        // Skip current dish
        queue.push([
            index + 1,
            remainingBudget,
            remainingPlates,
            combination,
            new Set(visitedStores)
        ]);
    }

    // Sort and limit results
    return results
        .filter(result => result.total_price_num > 0)
        .sort((a, b) => {
            // Prioritize combinations with dishes from different stores
            const aStoreCount = a.plates.length;
            const bStoreCount = b.plates.length;

            if (aStoreCount !== bStoreCount) {
                return bStoreCount - aStoreCount; // More stores first
            }

            // Then by lowest residual
            if (a.residual_num !== b.residual_num) {
                return a.residual_num - b.residual_num;
            }

            // Then by highest total price
            return b.total_price_num - a.total_price_num;
        })
        .slice(0, maxCombinations);
}

// Fast greedy algorithm for quick suggestions
function findDishCombinationsGreedy(stores, budget, numPlates, maxCombinations = 10) {
    const budgetNum = parsePrice(budget);
    if (budgetNum <= 0 || numPlates <= 0) {
        return [];
    }

    // Group dishes by store and sort by price
    const storeDishes = new Map();

    stores.forEach(store => {
        const storeDishesList = [];

        if (store.categories && Array.isArray(store.categories)) {
            store.categories.forEach(category => {
                if (category.dishes && Array.isArray(category.dishes)) {
                    category.dishes.forEach(dish => {
                        const dishPrice = parsePrice(dish.price);
                        if (dishPrice > 0 && dishPrice <= budgetNum) {
                            storeDishesList.push({
                                storeInfo: {
                                    nameStore: store.nameStore,
                                    url: store.url,
                                    restaurant: store.restaurant || {}
                                },
                                category: category.category,
                                dish: {
                                    ...dish,
                                    priceNum: dishPrice,
                                    priceFormatted: dish.price
                                },
                                price: dishPrice
                            });
                        }
                    });
                }
            });
        }

        if (storeDishesList.length > 0) {
            storeDishesList.sort((a, b) => a.price - b.price);
            storeDishes.set(store.nameStore, storeDishesList);
        }
    });

    const results = [];
    const storeNames = Array.from(storeDishes.keys());

    // Generate random combinations
    for (let i = 0; i < maxCombinations * 5 && results.length < maxCombinations; i++) {
        const selectedStores = new Set();
        const combination = [];
        let totalPrice = 0;
        let attempts = 0;

        // Try to build a combination
        while (combination.length < numPlates && attempts < 100) {
            attempts++;

            // Pick a random store
            const randomStore = storeNames[Math.floor(Math.random() * storeNames.length)];

            // Ensure we don't pick the same store twice (optional)
            if (selectedStores.has(randomStore) && selectedStores.size < storeNames.length) {
                continue;
            }

            const storeDishesList = storeDishes.get(randomStore);
            if (!storeDishesList || storeDishesList.length === 0) {
                continue;
            }

            // Pick a random dish from this store
            const randomDish = storeDishesList[Math.floor(Math.random() * storeDishesList.length)];

            // Check if adding this dish would exceed budget
            if (totalPrice + randomDish.price <= budgetNum) {
                combination.push(randomDish);
                totalPrice += randomDish.price;
                selectedStores.add(randomStore);
            }
        }

        // If we have a valid combination, process it
        if (combination.length === numPlates) {
            const residual = budgetNum - totalPrice;

            // Group dishes by store
            const storesMap = new Map();
            combination.forEach(item => {
                if (!storesMap.has(item.storeInfo.nameStore)) {
                    storesMap.set(item.storeInfo.nameStore, {
                        ...item.storeInfo,
                        products: []
                    });
                }

                const store = storesMap.get(item.storeInfo.nameStore);
                let categoryFound = store.products.find(p => p.category === item.category);

                if (!categoryFound) {
                    categoryFound = {
                        category: item.category,
                        dishes: []
                    };
                    store.products.push(categoryFound);
                }

                categoryFound.dishes.push(item.dish);
            });

            results.push({
                plates: Array.from(storesMap.values()),
                total_price: formatPrice(totalPrice),
                residual: formatPrice(residual),
                total_price_num: totalPrice,
                residual_num: residual
            });
        }
    }

    // Sort results
    return results
        .sort((a, b) => {
            // Sort by lowest residual
            if (a.residual_num !== b.residual_num) {
                return a.residual_num - b.residual_num;
            }
            // Then by number of different stores
            return b.plates.length - a.plates.length;
        })
        .slice(0, maxCombinations);
}

// Controller functions
const getRecommendations = async (req, res) => {
    try {
        const { budget, numPlates, algorithm = 'optimized', maxResults = 10 } = req.body;

        if (!budget) {
            return res.status(400).json({
                success: false,
                error: 'Budget is required (e.g., "300 MAD")'
            });
        }

        if (!numPlates || numPlates < 1) {
            return res.status(400).json({
                success: false,
                error: 'Number of plates must be at least 1'
            });
        }

        const budgetNum = parsePrice(budget);
        if (budgetNum <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid budget amount'
            });
        }

        // Load stores data
        const stores = await loadStoresData();

        if (stores.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No stores data found. Please scrape some stores first.'
            });
        }

        console.log(`🔍 Finding recommendations: ${numPlates} plates for ${budget} using ${algorithm} algorithm`);

        let combinations;
        const startTime = Date.now();

        switch (algorithm) {
            case 'exact':
                combinations = findDishCombinations(stores, budget, numPlates, maxResults);
                break;
            case 'optimized':
                combinations = findDishCombinationsOptimized(stores, budget, numPlates, maxResults);
                break;
            case 'greedy':
                combinations = findDishCombinationsGreedy(stores, budget, numPlates, maxResults);
                break;
            default:
                combinations = findDishCombinationsOptimized(stores, budget, numPlates, maxResults);
        }

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        if (combinations.length === 0) {
            return res.json({
                success: true,
                message: 'No valid combinations found for the given budget and number of plates',
                budget: budget,
                numPlates: numPlates,
                processing_time_ms: processingTime,
                suggestions: [
                    'Try increasing your budget',
                    'Try reducing the number of plates',
                    'Some stores might not have dishes in your price range'
                ]
            });
        }

        // Calculate statistics
        const avgPricePerPlate = combinations[0].total_price_num / numPlates;
        const minResidual = Math.min(...combinations.map(c => c.residual_num));
        const maxResidual = Math.max(...combinations.map(c => c.residual_num));

        res.json({
            success: true,
            budget: budget,
            numPlates: numPlates,
            algorithm: algorithm,
            processing_time_ms: processingTime,
            statistics: {
                total_combinations_found: combinations.length,
                average_price_per_plate: formatPrice(avgPricePerPlate),
                min_residual: formatPrice(minResidual),
                max_residual: formatPrice(maxResidual),
                stores_count: stores.length,
                total_dishes_considered: stores.reduce((sum, store) =>
                    sum + (store.categories ? store.categories.reduce((catSum, cat) =>
                        catSum + (cat.dishes ? cat.dishes.length : 0), 0) : 0), 0)
            },
            recommendations: combinations
        });

    } catch (error) {
        console.error('Recommendations API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getRecommendationsGET = async (req, res) => {
    try {
        const { budget, plates, algorithm = 'optimized', max = 10 } = req.query;

        if (!budget) {
            return res.status(400).json({
                success: false,
                error: 'Budget query parameter is required (e.g., "300 MAD")'
            });
        }

        if (!plates || plates < 1) {
            return res.status(400).json({
                success: false,
                error: 'Plates query parameter must be at least 1'
            });
        }

        const numPlates = parseInt(plates);
        const maxResults = parseInt(max) || 10;

        // Simulate POST request
        req.body = { budget, numPlates, algorithm, maxResults };
        return getRecommendations(req, res);

    } catch (error) {
        console.error('Recommendations GET API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getPriceStats = async (req, res) => {
    try {
        const stores = await loadStoresData();

        const allPrices = [];
        const storeStats = [];

        stores.forEach(store => {
            if (store.categories && Array.isArray(store.categories)) {
                const storePrices = [];

                store.categories.forEach(category => {
                    if (category.dishes && Array.isArray(category.dishes)) {
                        category.dishes.forEach(dish => {
                            const price = parsePrice(dish.price);
                            if (price > 0) {
                                allPrices.push(price);
                                storePrices.push(price);
                            }
                        });
                    }
                });

                if (storePrices.length > 0) {
                    storeStats.push({
                        nameStore: store.nameStore,
                        dish_count: storePrices.length,
                        min_price: formatPrice(Math.min(...storePrices)),
                        max_price: formatPrice(Math.max(...storePrices)),
                        avg_price: formatPrice(storePrices.reduce((a, b) => a + b, 0) / storePrices.length)
                    });
                }
            }
        });

        if (allPrices.length === 0) {
            return res.json({
                success: true,
                message: 'No price data available'
            });
        }

        allPrices.sort((a, b) => a - b);

        const percentiles = {
            p10: formatPrice(allPrices[Math.floor(allPrices.length * 0.1)]),
            p25: formatPrice(allPrices[Math.floor(allPrices.length * 0.25)]),
            p50: formatPrice(allPrices[Math.floor(allPrices.length * 0.5)]),
            p75: formatPrice(allPrices[Math.floor(allPrices.length * 0.75)]),
            p90: formatPrice(allPrices[Math.floor(allPrices.length * 0.9)])
        };

        res.json({
            success: true,
            total_stores: stores.length,
            total_dishes: allPrices.length,
            price_range: {
                min: formatPrice(Math.min(...allPrices)),
                max: formatPrice(Math.max(...allPrices)),
                avg: formatPrice(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
            },
            percentiles: percentiles,
            store_statistics: storeStats.slice(0, 20), // Top 20 stores
            suggestions: {
                low_budget: `For budget under ${percentiles.p25}, try ${Math.floor(parsePrice(percentiles.p25) / parsePrice(percentiles.p25))} plates`,
                medium_budget: `For budget around ${percentiles.p50}, try ${Math.floor(parsePrice(percentiles.p50) / parsePrice(percentiles.p50))} plates`,
                high_budget: `For budget over ${percentiles.p75}, try ${Math.floor(parsePrice(percentiles.p75) / parsePrice(percentiles.p75))} plates`
            }
        });

    } catch (error) {
        console.error('Price stats API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getRecommendations,
    getRecommendationsGET,
    getPriceStats
};