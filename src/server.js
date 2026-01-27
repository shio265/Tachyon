import express from 'express';
import cors from 'cors';
import { loggingMiddleware } from './routes/middleware.js';
import { strinovaRouter, apiKeysRouter, mainRouter } from './routes/endpoint/index.js';
import { connectDB } from './database/client.js';
import process from 'process';

const port = process.env.PORT || 4000;
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(loggingMiddleware);

// REST API Routes
app.use('/api/v1/strinova', strinovaRouter);
app.use('/api/v1/admin/keys', apiKeysRouter);
app.use('/', mainRouter);

// Connect to MongoDB first, then start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Global endpoint available at: ${process.env.SERVER_URL || `http://localhost:${port}`}`);
    console.log(`Strinova API available at: ${process.env.SERVER_URL || `http://localhost:${port}`}/api/v1/strinova`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});