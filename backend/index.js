const express = require('express');
const { setupMiddlewares } = require('./middlewares');
const scrapeRoutes = require('./routers/scrapeRoutes');
const storeRoutes = require('./routers/storeRoutes');
const establishmentsRoutes = require('./routers/establishmentsRoutes');
const recommendationsRoutes = require('./routers/recommendationsRoutes');
const productRoutes = require('./routers/productRoutes');
const { initDataStore } = require('./models/storeModel');
const { swaggerUi, specs } = require('./swagger');
const { connectDB } = require('./utils/db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup middlewares
setupMiddlewares(app);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Use routes
app.use('/api', scrapeRoutes);
app.use('/api', storeRoutes);
app.use('/api', establishmentsRoutes);
app.use('/api', recommendationsRoutes);
app.use('/api', productRoutes);

// Initialize data store and DB on server start
async function startServer() {
    await initDataStore();
    console.log('📂 Data store initialized');

    try {
        await connectDB();
    } catch (err) {
        console.error('Could not connect to MongoDB, continuing without DB.');
    }

    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Glovo Scraper API running on port ${PORT}`);
        console.log(`🌐 Base URL: http://localhost:${PORT}`);
        console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
        console.log(`📸 Screenshots will be saved to ./assets/screenshots`);
        console.log('\n💡 To test:');
        console.log(`curl -X POST http://localhost:${PORT}/api/scrape \\`);
        console.log('  -d \'{"url": "https://glovoapp.com/fr/ma/casablanca/stores/joa", "storeName": "JOA"}\'');
    });
}

startServer();

