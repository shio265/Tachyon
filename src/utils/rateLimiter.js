import rateLimit from 'express-rate-limit';
import process from 'process';
import { isValidApiKey, updateApiKeyLastUsed } from '../database/queries/api_keys.js';

const rateLimitTime = parseInt(process.env.RATE_LIMITER_TIME) || 60000;
const rateLimitMaxRequests = parseInt(process.env.RATE_LIMITER_MAX_REQUESTS) || null;

const limiter = rateLimit({
    windowMs: rateLimitTime,
    max: rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    skip: async (req) => {
        // Bypass rate limit if valid x-api-key is provided
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) return false;
        
        const isValid = await isValidApiKey(apiKey);
        
        if (isValid) {
            // Update last used timestamp (fire and forget)
            updateApiKeyLastUsed(apiKey).catch(console.error);
        }
        
        return isValid;
    },
    handler: function (req, res) {
        res.status(429).send({
            status: 500,
            message: 'Too many requests!',
        });
    }
});

export default limiter;