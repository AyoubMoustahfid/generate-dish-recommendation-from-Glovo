# 🍽️ Glovo Dish Scraper API

A comprehensive REST API for scraping restaurant data from Glovo platform, featuring dish recommendations, establishment discovery, and interactive API documentation.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **🕷️ Web Scraping**: Automated scraping of Glovo restaurant pages using Puppeteer
- **🏪 Establishment Discovery**: Scrape all restaurants from category pages
- **🍽️ Dish Recommendations**: Intelligent meal planning with budget optimization
- **📊 Price Analytics**: Statistical analysis of dish prices across stores
- **📖 Interactive Documentation**: Complete Swagger API documentation
- **🏗️ MVC Architecture**: Clean, maintainable code structure
- **🔄 Multiple Algorithms**: Exact, optimized, and greedy recommendation algorithms
- **🖼️ Image Processing**: Automatic conversion of dish images to base64
- **💾 Data Persistence**: JSON-based data storage system

## 🏗️ Architecture

This application follows the **MVC (Model-View-Controller)** architectural pattern:

```
├── controllers/          # Business logic layer
│   ├── scrapeController.js
│   ├── storeController.js
│   ├── establishmentsController.js
│   └── recommendationsController.js
├── models/              # Data access layer
│   └── storeModel.js
├── routers/             # Route definitions
│   ├── scrapeRoutes.js
│   ├── storeRoutes.js
│   ├── establishmentsRoutes.js
│   └── recommendationsRoutes.js
├── middlewares/         # Express middlewares
│   ├── index.js
│   └── utils/
│       └── helpers.js
└── swagger.js           # API documentation
```

## 🛠️ Technologies

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Puppeteer** - Headless browser automation
- **Cheerio** - HTML parsing (backup scraper)

### Documentation & Testing
- **Swagger UI Express** - Interactive API documentation
- **Swagger JSDoc** - OpenAPI specification generation

### Utilities
- **Axios** - HTTP client for image downloads
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variable management
- **Nodemon** - Development auto-restart

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Windows/Linux/MacOS

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dish-scraper-api/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - API Base URL: `http://localhost:3000`
   - API Documentation: `http://localhost:3000/api-docs`

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Glovo Configuration
GLOVO_BASE_URL=https://glovoapp.com
DEFAULT_LOCATION=Casablanca, Morocco

# Scraping Configuration
HEADLESS_BROWSER=false
BROWSER_TIMEOUT=30000
SCROLL_ATTEMPTS=20

# Data Storage
DATA_DIR=./data
SCREENSHOTS_DIR=./assets/screenshots
```

## 📖 API Documentation

The API is fully documented using Swagger/OpenAPI 3.0 specification.

### Access Documentation
- **URL**: `http://localhost:3000/api-docs`
- **Format**: Interactive web interface
- **Features**:
  - Live API testing
  - Request/response examples
  - Schema validation
  - Download OpenAPI spec

## 🔗 API Endpoints

### Store Scraping
- `POST /api/scrape` - Scrape a specific Glovo store
- `GET /api/scrape` - Scrape store via query parameters

### Store Management
- `GET /api/stores` - Get all stored stores
- `GET /api/stores/:storeName` - Get specific store details
- `DELETE /api/stores/:storeName` - Delete a store
- `GET /api/stores/:storeName/products` - Get store products
- `DELETE /api/stores` - Clear all stores
- `GET /api/debug/data` - Debug data information

### Establishment Discovery
- `POST /api/establishments` - Scrape establishments from category
- `GET /api/establishments` - Scrape establishments via query

### Recommendations & Analytics
- `POST /api/recommendations` - Get dish recommendations
- `GET /api/recommendations` - Get recommendations via query
- `GET /api/price-stats` - Get price statistics

## 💡 Usage Examples

### Scrape a Store
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://glovoapp.com/fr/ma/casablanca/stores/joa",
    "storeName": "JOA"
  }'
```

### Get Recommendations
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "budget": "100 MAD",
    "numPlates": 3,
    "algorithm": "optimized"
  }'
```

### Scrape Establishments
```bash
curl -X POST http://localhost:3000/api/establishments \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://glovoapp.com/fr/ma/casablanca/categories/pizza"
  }'
```

### Get Price Statistics
```bash
curl http://localhost:3000/api/price-stats
```

## 📁 Project Structure

```
backend/
├── assets/
│   └── screenshots/          # Scraping screenshots
├── controllers/              # Business logic
│   ├── establishmentsController.js
│   ├── recommendationsController.js
│   ├── scrapeController.js
│   └── storeController.js
├── data/                     # JSON data storage
│   ├── stores.json
│   └── establishments_*.json
├── middlewares/              # Express middlewares
│   ├── index.js
│   └── utils/
│       └── helpers.js
├── models/                   # Data models
│   └── storeModel.js
├── routers/                  # Route definitions
│   ├── establishmentsRoutes.js
│   ├── recommendationsRoutes.js
│   ├── scrapeRoutes.js
│   └── storeRoutes.js
├── node_modules/             # Dependencies
├── .env                      # Environment variables
├── index.js                  # Application entry point
├── package.json              # Project metadata
├── swagger.js                # API documentation config
└── README.md                 # This file
```

## 🧪 Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Visit API docs: `http://localhost:3000/api-docs`
3. Use the interactive Swagger UI to test endpoints

### Automated Testing Scripts
```bash
# Test all endpoints
node test-endpoints.js

# Test Swagger documentation
node test-swagger.js
```

### Test Data
The application includes sample data in the `data/` directory:
- `stores.json` - Scraped restaurant data
- Various establishment JSON files

## 🔧 Development

### Available Scripts
```bash
npm start      # Start production server
npm run dev    # Start development server (with nodemon)
```

### Code Style
- Use ES6+ syntax
- Follow MVC pattern
- Add JSDoc comments for Swagger documentation
- Use async/await for asynchronous operations

### Adding New Features
1. Create controller logic in `controllers/`
2. Define routes in `routers/`
3. Add Swagger documentation
4. Update this README

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is for educational purposes only. Web scraping should be done responsibly and in accordance with the target website's terms of service. Always respect robots.txt and implement appropriate rate limiting.

## 📞 Support

For questions or issues:
- Check the API documentation at `/api-docs`
- Review the code comments
- Create an issue in the repository

---

**Built with ❤️ for food lovers and developers**