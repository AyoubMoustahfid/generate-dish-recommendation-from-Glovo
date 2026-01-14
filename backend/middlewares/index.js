const cors = require('cors');
const express = require('express');

// Middleware setup
const setupMiddlewares = (app) => {
    app.use(cors({
        origin: 'http://localhost:4000', // Your React app's origin
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    }));
    app.use(express.json());
};

module.exports = {
    setupMiddlewares
};