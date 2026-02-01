function loggingMiddleware(req, res, next) {

  // Skip logging for Swagger static resources
  const swaggerResources = [
    '/favicon.ico',
    '/swagger-ui.css',
    '/swagger-ui-bundle.js',
    '/swagger-ui-standalone-preset.js',
    '/swagger-ui-init.js',
    '/favicon-32x32.png',
    '/favicon-16x16.png'
  ];
  
  if (swaggerResources.includes(req.path)) {
    return next();
  }
  
  const startTime = Date.now();
  
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() 
    || req.headers['x-real-ip'] 
    || req.socket.remoteAddress 
    || req.ip 
    || 'unknown';
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${res.statusCode} ${req.path} ${duration}ms | ip: ${ip}`);
  });
  
  next();
}

export { loggingMiddleware };