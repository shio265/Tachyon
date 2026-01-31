function loggingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() 
    || req.headers['x-real-ip'] 
    || req.socket.remoteAddress 
    || req.ip 
    || 'unknown';
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (res.statusCode >= 400 && res.statusCode < 500) {
      console.warn(`[${new Date().toISOString()}] ${res.statusCode} ${req.method} ${req.path} ${duration}ms | ip: ${ip}`);
    } else {
      console.log(`[${new Date().toISOString()}] ${res.statusCode} ${req.method} ${req.path} ${duration}ms | ip: ${ip}`);
    }
  });
  
  next();
}

export { loggingMiddleware };