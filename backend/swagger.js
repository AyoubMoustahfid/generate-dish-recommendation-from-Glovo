const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Glovo Dish Scraper API',
      version: '1.0.0',
      description: 'API for scraping dishes and establishments from Glovo platform',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Store: {
          type: 'object',
          properties: {
            nameStore: {
              type: 'string',
              example: 'espresso-lab',
            },
            url: {
              type: 'string',
              example: 'https://glovoapp.com/fr/ma/casablanca/stores/espresso-lab',
            },
            lastScraped: {
              type: 'string',
              format: 'date-time',
            },
            restaurant: {
              type: 'object',
              properties: {
                promotions: {
                  type: 'array',
                  items: { type: 'string' },
                },
                info_Details: {
                  type: 'object',
                  properties: {
                    rating: { type: 'string', example: '93%' },
                    eta_store: { type: 'string', example: '15-25 min' },
                    service_fee: { type: 'string', example: '10.00 MAD' },
                    badge: { type: 'string', example: 'Prime' },
                    store_name: { type: 'string', example: 'Espressolab' },
                  },
                },
              },
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', example: 'Top des ventes' },
                  dishes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', example: 'Café Latte' },
                        price: { type: 'string', example: '25,00 MAD' },
                        description: { type: 'string', example: 'Café au lait frais' },
                        image: { type: 'string', format: 'uri' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Establishment: {
          type: 'object',
          properties: {
            link: {
              type: 'string',
              format: 'uri',
              example: 'https://glovoapp.com/fr/ma/casablanca/stores/joa',
            },
            image: {
              type: 'string',
              format: 'base64',
              description: 'Base64 encoded image',
            },
            image_content_type: {
              type: 'string',
              example: 'image/jpeg',
            },
            name: {
              type: 'string',
              example: 'JOA',
            },
            store_details: {
              type: 'object',
              properties: {
                delivery_fee: { type: 'string', example: '10,00 MAD' },
                eta: { type: 'string', example: '15-25 min' },
                caption_emphasis: {
                  type: 'object',
                  properties: {
                    total: { type: 'string', example: '95%' },
                    votes: { type: 'string', example: '(127)' },
                  },
                },
                discount_badge: { type: 'string', example: '20% OFF' },
              },
            },
          },
        },
        Recommendation: {
          type: 'object',
          properties: {
            plates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nameStore: { type: 'string', example: 'espresso-lab' },
                  url: { type: 'string', format: 'uri' },
                  products: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string', example: 'Top des ventes' },
                        dishes: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              title: { type: 'string', example: 'Café Latte' },
                              price: { type: 'string', example: '25,00 MAD' },
                              priceNum: { type: 'number', example: 25 },
                              priceFormatted: { type: 'string', example: '25,00 MAD' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            total_price: { type: 'string', example: '75,00 MAD' },
            residual: { type: 'string', example: '25,00 MAD' },
            total_price_num: { type: 'number', example: 75 },
            residual_num: { type: 'number', example: 25 },
          },
        },
        PriceStats: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            total_stores: { type: 'integer', example: 5 },
            total_dishes: { type: 'integer', example: 150 },
            price_range: {
              type: 'object',
              properties: {
                min: { type: 'string', example: '15,00 MAD' },
                max: { type: 'string', example: '150,00 MAD' },
                avg: { type: 'string', example: '45,00 MAD' },
              },
            },
            percentiles: {
              type: 'object',
              properties: {
                p10: { type: 'string', example: '20,00 MAD' },
                p25: { type: 'string', example: '25,00 MAD' },
                p50: { type: 'string', example: '40,00 MAD' },
                p75: { type: 'string', example: '60,00 MAD' },
                p90: { type: 'string', example: '80,00 MAD' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routers/*.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};