export const config = {
  // Server
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
  
  // Auth
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
  
  // External Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'beatmybag-shots',
  
  // Email
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@beatmybag.com',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // App Config
  FREE_SHOTS_PER_MONTH: 10,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  PRO_YEARLY_PRICE: 7.99,
  DEALER_MONTHLY_PRICE: 399,
}; 