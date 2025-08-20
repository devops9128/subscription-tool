# Subscription Manager

A web-based subscription management application to track and control your monthly financial expenses.

## Features

- Add, edit, and delete subscriptions
- Multi-currency support (MYR, USD, CNY)
- Real-time exchange rate updates
- Category filtering and search
- Monthly expense tracking and statistics
- Firebase integration for data persistence

## Setup Instructions

### 1. Environment Variables

Copy the `.env.example` file to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Update the `.env` file with your Firebase project configuration:

- Get Firebase configuration from your [Firebase Console](https://console.firebase.google.com/)
- Create a new project or use an existing one
- Enable Realtime Database
- Copy the configuration values to your `.env` file

### 2. Local Development

For local development, you can use any static file server:

```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)
npx serve .

# Using PHP (if installed)
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

### 3. Deploy to Vercel

#### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard or via CLI:
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_DATABASE_URL
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID
vercel env add VITE_EXCHANGE_RATE_API_URL
vercel env add VITE_DEFAULT_USER_ID
```

#### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all the variables from your `.env` file

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | Firebase Database URL | `https://your-project-default-rtdb.region.firebasedatabase.app/` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc123` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID | `G-ABC123DEF` |
| `VITE_EXCHANGE_RATE_API_URL` | Exchange Rate API URL | `https://api.exchangerate-api.com/v4/latest/MYR` |
| `VITE_DEFAULT_USER_ID` | Default User ID | `default-user` |

## Security Notes

- Never commit the `.env` file to version control
- The `.gitignore` file is configured to exclude environment files
- All sensitive configuration is stored in environment variables
- Firebase security rules should be configured appropriately for production use

## Technologies Used

- Vanilla JavaScript (ES6+)
- Firebase Realtime Database
- CSS3 with Flexbox/Grid
- Font Awesome Icons
- Exchange Rate API

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Requires ES6+ support for modules and modern JavaScript features.