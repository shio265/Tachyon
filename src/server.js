import express from 'express';
import cors from 'cors';
import { loggingMiddleware } from './routes/middleware.js';
import { v1, mainRouter } from './routes/index.js';
import { connectDB } from './database/client.js';
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

// Main route (no version)
app.use('/', mainRouter);

// API v1 Routes
app.use('/api/v1/strinova', v1.strinovaRouter);
app.use('/api/v1/admin/keys', v1.apiKeysRouter);

// API v2 Routes (future)
// app.use('/api/v2/strinova', v2.strinovaRouter);
// app.use('/api/v2/admin/keys', v2.apiKeysRouter);

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