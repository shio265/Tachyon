import swaggerJsdoc from 'swagger-jsdoc';
import process from 'process';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tamagochi API',
      version: '1.0.0',
      description: 'REST API for managing Strinova redeem codes, rewards, and API keys',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.PRODUCTION_SERVER_URL,
        description: 'Production server',
      },
      {
        url: process.env.SERVER_URL || 'http://localhost:4000',
        description: 'Development server',
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authentication',
        },
        AdminAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Admin authentication key',
        },
      },
      schemas: {
        RedeemCode: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '6979f1120a08f8372fad355d' },
            uploader_id: { type: 'string', example: '6979f06fd05710e613574c79' },
            code: { type: 'string', example: 'STRINOVA2026' },
            expired_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            rewards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  reward_id: { type: 'string' },
                  name: { type: 'string' },
                  icon: { type: 'string' },
                  amount: { type: 'integer' },
                },
              },
            },
          },
        },
        Reward: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '6979f06fd05710e613574c80' },
            name: { type: 'string', example: 'Bablo' },
            icon: { type: 'string', example: 'https://example.domain/bablo.png', nullable: true },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '69788bf6d3239aecdc899a50' },
            key: { type: 'string', example: 'fbd384e7f16f2a51546ba24b002a35cf...' },
            name: { type: 'string', example: 'Shiorin625' },
            discord_uid: { type: 'string', example: '123456789012345678', nullable: true },
            description: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            last_used_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
