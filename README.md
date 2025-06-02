# BeatMyBag - Golf Shot Analyzer

AI-powered golf shot tracking with instant analysis. Mobile-first design for one-tap capture.

## 🚀 Quick Start

### Backend (Railway)
```bash
# Install dependencies (requires Bun)
bun install

# Run locally
bun run dev
```

### Frontend (Vercel)
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

- **Backend**: Bun + Hono + SQLite/Turso + OpenAI
- **Frontend**: React + TypeScript + Tailwind + Vite
- **Auth**: JWT + Google OAuth + Magic Links
- **Payments**: Stripe ($7.99/year Pro plan)

## 📱 Features

- **Instant Shot Capture**: One-tap photo analysis
- **AI Analysis**: Ball speed, launch angle, spin rate, carry distance
- **Smart Pricing**: 30 free shots → 60 with Google → Unlimited Pro
- **Mobile First**: Optimized for on-course use

## 🔧 Environment Variables

### Backend (.env)
```
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
JWT_SECRET=your-secret
OPENAI_API_KEY=sk-your-key
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🚀 Deployment

- **Backend**: Auto-deploys to Railway on push
- **Frontend**: Auto-deploys to Vercel on push

## 📄 License

MIT 