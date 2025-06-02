# BeatMyBag Frontend

Mobile-first golf shot tracking app with instant analysis.

## 🚀 Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/beargallbladder/golf&root-directory=frontend&env=VITE_GOOGLE_CLIENT_ID,VITE_API_URL)

### Option 2: Manual Deploy

1. **Push to GitHub** (already done!)

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - **IMPORTANT**: Set Root Directory to `frontend`
   - Click "Deploy"

3. **Add Environment Variables**:
   ```
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_API_URL=https://your-api.railway.app
   ```

## 🏃 Local Development

```bash
# From the frontend directory
npm install
npm run dev
```

## 📱 Features

- **Instant Capture**: One-tap shot analysis
- **Running Memory**: Last 10 shots always visible
- **Google Login**: Quick sign-in, no passwords
- **Mobile First**: Designed for phones at the range
- **Auto-Save**: All shots saved automatically

## 💰 Pricing

- **Free**: 30 shots (no login required)
- **Free with Google**: 60 shots/month
- **Pro**: $7.99/year - Unlimited shots + 30-day history
- **Retailers**: $399/month - Advanced features + lead generation

## 🎯 V1 Focus

This V1 is focused on:
1. **Speed**: Capture and analyze in seconds
2. **Simplicity**: Minimal UI, maximum clarity
3. **Mobile**: Works perfectly on phones
4. **Smart Defaults**: Auto-detects club type

## 🔗 API Connection

The frontend connects to your Railway API. Make sure to:
1. Deploy the API to Railway first
2. Get your Railway API URL
3. Set `VITE_API_URL` in Vercel to your Railway URL

That's it! Vercel will handle everything else. 🚀 