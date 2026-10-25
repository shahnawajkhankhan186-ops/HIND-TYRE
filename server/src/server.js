const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');

async function startServer() {
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connectDB(config.MONGODB_URI);
      const PORT = config.PORT || 5001;
      app.listen(PORT, () => {
        console.log(`[Server] HIND TYRES AND ACCESSORIES API running on http://localhost:${PORT}`);
      });
      return;
    } catch (error) {
      console.error(`[Server] Connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt === maxRetries) {
        console.error('[Server] Exiting after max retries');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
