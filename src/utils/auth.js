import process from 'process';

const AUTH_KEY  = process.env.AUTH_KEY;

/**
 * Middleware to authenticate admin requests
 * Checks for Authorization header with Bearer token
 */
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide Authorization header.'
    });
  }
  
  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  if (token !== AUTH_KEY ) {
    return res.status(403).json({
      success: false,
      error: 'Invalid auth key.'
    });
  }
  
  next();
}

export { adminAuth };
