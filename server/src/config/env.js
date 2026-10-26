const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env, root .env, or process.cwd()
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const config = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hind_tyres?replicaSet=rs0',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_hind_tyres_jwt_key_998877665544332211',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.SMTP_FROM || '"HIND TYRES & ACCESSORIES" <billing@hindtyres.com>',
  },
  ADMIN_RECEIPT_EMAIL: process.env.ADMIN_RECEIPT_EMAIL || 'admin@hindtyres.com',
  SUPABASE: {
    URL: process.env.SUPABASE_URL || '',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    DB_URL: process.env.SUPABASE_DB_URL || '',
  },
};

module.exports = config;
