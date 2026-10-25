/**
 * Central Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.url} -> ${statusCode}:`, err.message);
    if (statusCode === 500 && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler };
