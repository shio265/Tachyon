import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { loggingMiddleware } from './routes/middleware.js';
import { v1, mainRouter } from './routes/index.js';
import { connectDB } from './database/client.js';
import swaggerSpec from './swagger.js';
import process from 'process';

const port = process.env.PORT || 4000;
const app = express();

app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(loggingMiddleware);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tamagochi API Documentation'
}));

// Main route (no version)
app.use('/', mainRouter);

// API v1 Routes
app.use('/api/v1/strinova', v1.strinovaRouter);
app.use('/api/v1/admin/keys', v1.apiKeysRouter);
app.use('/api/v1/rewards', v1.rewardsRouter);
app.use('/api/v1/uploaders', v1.uploadersRouter);

// API v2 Routes 
// app.use('/api/v2/strinova', v2.strinovaRouter);
// app.use('/api/v2/admin/keys', v2.apiKeysRouter);

// Connect to MongoDB first, then start server
connectDB().then(() => {
  app.listen(port, () => {
    if (process.env.ENV !== 'development') {
      console.log(`Global endpoint available at: ${process.env.PRODUCTION_SERVER_URL}`);
      console.log(`Strinova API available at: ${process.env.PRODUCTION_SERVER_URL}/api/v1/strinova`);
      console.log(`API Documentation available at: ${process.env.PRODUCTION_SERVER_URL}/api-docs`);
    }
    else {
      console.log(`Global endpoint available at: ${process.env.SERVER_URL || `http://localhost:${port}`}`);
      console.log(`Strinova API available at: ${process.env.SERVER_URL || `http://localhost:${port}`}/api/v1/strinova`);
      console.log(`API Documentation available at: ${process.env.SERVER_URL || `http://localhost:${port}`}/api-docs`);
    }
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});