function loggingMiddleware(req, res, next) {
  // Skip logging for favicon requests
  if (req.path === '/favicon.ico') {
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