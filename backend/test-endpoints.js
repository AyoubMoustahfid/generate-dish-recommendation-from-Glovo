const axios = require('axios');

async function waitForServer(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await axios.get('http://localhost:3000/api/price-stats', { timeout: 1000 });
            console.log('✅ Server is ready!');
            return true;
        } catch (error) {
            console.log(`⏳ Waiting for server... attempt ${i + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    return false;
}

async function testEndpoints() {
    const baseURL = 'http://localhost:3000/api';

    // Wait for server to be ready
    const serverReady = await waitForServer();
    if (!serverReady) {
        console.error('❌ Server did not start properly');
        return;
    }

    try {
        console.log('Testing price-stats endpoint...');
        const priceStatsResponse = await axios.get(`${baseURL}/price-stats`);
        console.log('✅ Price stats endpoint works!');
        console.log('Total stores:', priceStatsResponse.data.total_stores);
        console.log('Total dishes:', priceStatsResponse.data.total_dishes);

        console.log('\nTesting recommendations endpoint...');
        const recommendationsResponse = await axios.post(`${baseURL}/recommendations`, {
            budget: '100 MAD',
            numPlates: 2,
            algorithm: 'greedy',
            maxResults: 3
        });
        console.log('✅ Recommendations endpoint works!');
        console.log('Found combinations:', recommendationsResponse.data.recommendations?.length || 0);

        console.log('\nAll endpoints are working correctly! 🎉');

    } catch (error) {
        console.error('❌ Error testing endpoints:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

testEndpoints();