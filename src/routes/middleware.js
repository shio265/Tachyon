function loggingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Normalize IPv6 loopback to IPv4
  let ip = req.ip;
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (res.statusCode >= 400 && res.statusCode < 500) {
      console.warn(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    } else {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
}

export { loggingMiddleware };