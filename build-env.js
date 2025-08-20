#!/usr/bin/env node

// Build script to generate env.js from environment variables for Vercel deployment
const fs = require('fs');
const path = require('path');

// Environment variables to extract
const envVars = {
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_DATABASE_URL: process.env.VITE_FIREBASE_DATABASE_URL,
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID,
  VITE_EXCHANGE_RATE_API_URL: process.env.VITE_EXCHANGE_RATE_API_URL,
  VITE_DEFAULT_USER_ID: process.env.VITE_DEFAULT_USER_ID
};

// Check for missing environment variables
const missingVars = Object.entries(envVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn('Warning: Missing environment variables:', missingVars.join(', '));
  console.warn('The application may not function correctly.');
}

// Generate env.js content
const envContent = `// Auto-generated environment configuration for production
// This file is generated during build time from environment variables

window.ENV = {
  VITE_FIREBASE_API_KEY: "${envVars.VITE_FIREBASE_API_KEY || ''}",
  VITE_FIREBASE_AUTH_DOMAIN: "${envVars.VITE_FIREBASE_AUTH_DOMAIN || ''}",
  VITE_FIREBASE_DATABASE_URL: "${envVars.VITE_FIREBASE_DATABASE_URL || ''}",
  VITE_FIREBASE_PROJECT_ID: "${envVars.VITE_FIREBASE_PROJECT_ID || ''}",
  VITE_FIREBASE_STORAGE_BUCKET: "${envVars.VITE_FIREBASE_STORAGE_BUCKET || ''}",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "${envVars.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}",
  VITE_FIREBASE_APP_ID: "${envVars.VITE_FIREBASE_APP_ID || ''}",
  VITE_FIREBASE_MEASUREMENT_ID: "${envVars.VITE_FIREBASE_MEASUREMENT_ID || ''}",
  VITE_EXCHANGE_RATE_API_URL: "${envVars.VITE_EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest/USD'}",
  VITE_DEFAULT_USER_ID: "${envVars.VITE_DEFAULT_USER_ID || 'default-user'}"
};

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.ENV;
}
`;

// Write env.js file
const outputPath = path.join(__dirname, 'env.js');
try {
  fs.writeFileSync(outputPath, envContent, 'utf8');
  console.log('✅ env.js generated successfully at:', outputPath);
  console.log('Environment variables loaded:', Object.keys(envVars).filter(key => envVars[key]).length, '/', Object.keys(envVars).length);
} catch (error) {
  console.error('❌ Failed to generate env.js:', error.message);
  process.exit(1);
}