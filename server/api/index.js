const app = require('../src/app');
const config = require('../src/config/env');
const { connectDB } = require('../src/config/db');

module.exports = async (req, res) => {
  await connectDB(config.MONGODB_URI);
  return app(req, res);
};
