// Helper functions
function isValidGlovoUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('glovoapp.com');
    } catch (error) {
        return false;
    }
}

function extractStoreNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');
        const storesIndex = pathSegments.indexOf('stores');
        if (storesIndex !== -1 && storesIndex + 1 < pathSegments.length) {
            return pathSegments[storesIndex + 1];
        }
        return null;
    } catch (error) {
        return null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// CASABLANCA coordinates
const CASABLANCA_COORDS = {
    latitude: 33.5731,
    longitude: -7.5898
};

// Add a helper function to parse price strings
function parsePrice(priceStr) {
    if (!priceStr) return 0;

    // Extract numeric value from price string like "119,40 MAD" or "119.40 MAD"
    const match = priceStr.match(/(\d+)[,.](\d+)/);
    if (match) {
        return parseFloat(`${match[1]}.${match[2]}`);
    }

    // Try to extract simple integer
    const intMatch = priceStr.match(/(\d+)/);
    return intMatch ? parseFloat(intMatch[1]) : 0;
}

// Add a helper function to format price back to MAD
function formatPrice(price) {
    return `${price.toFixed(2).replace('.', ',')} MAD`;
}

module.exports = {
    isValidGlovoUrl,
    extractStoreNameFromUrl,
    delay,
    CASABLANCA_COORDS,
    parsePrice,
    formatPrice
};