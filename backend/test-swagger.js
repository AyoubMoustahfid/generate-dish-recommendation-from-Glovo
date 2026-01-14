const axios = require('axios');

async function testSwagger() {
    try {
        console.log('Testing Swagger documentation endpoint...');
        const response = await axios.get('http://localhost:3000/api-docs');
        console.log('✅ Swagger UI is accessible!');
        console.log('Status:', response.status);

        // Test one of the API endpoints
        console.log('\nTesting price-stats endpoint...');
        const priceStatsResponse = await axios.get('http://localhost:3000/api/price-stats');
        console.log('✅ Price stats endpoint works!');
        console.log('Total stores:', priceStatsResponse.data.total_stores);
        console.log('Total dishes:', priceStatsResponse.data.total_dishes);

        console.log('\n🎉 All tests passed! Swagger documentation is working correctly.');
        console.log('📖 Visit: http://localhost:3000/api-docs');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

testSwagger();