const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');

async function startServer() {
  const PORT = config.PORT || 5001;

  // 1. Immediately bind HTTP port so Render and cloud hosts pass health checks instantly
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] HIND TYRES AND ACCESSORIES API running on http://localhost:${PORT} (0.0.0.0)`);
  });

  // 2. Connect to MongoDB with retries in background without blocking port binding
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connectDB(config.MONGODB_URI);
      console.log(`[Server] Database successfully connected and ready.`);
      return;
    } catch (error) {
      console.error(`[Server] Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 4000));
      } else {
        console.error('[Server] Warning: Could not connect to MongoDB after max retries. Server remains listening for health checks.');
      }
    }
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
