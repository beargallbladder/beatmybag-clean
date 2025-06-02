import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';
import { compress } from 'hono/compress';
import { etag } from 'hono/etag';
import { timing } from 'hono/timing';

import { authRoutes } from './routes/auth';
import { shotRoutes } from './routes/shots';
import { sessionRoutes } from './routes/sessions';
import { billingRoutes } from './routes/billing';
import { config } from './config';
import { auth } from './middleware/auth';

const app = new Hono();

// Global middleware
app.use('*', timing());
app.use('*', logger());
app.use('*', compress());
app.use('*', etag());
app.use('*', cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

// Public routes
app.route('/auth', authRoutes);

// Protected routes
app.use('/shots/*', jwt({ secret: config.JWT_SECRET }));
app.use('/sessions/*', jwt({ secret: config.JWT_SECRET }));

app.route('/shots', auth, shotRoutes);
app.route('/sessions', auth, sessionRoutes);
app.route('/billing', auth, billingRoutes);

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal server error' }, 500);
});

// Stripe webhook (no auth)
app.post('/stripe/webhook', async (c) => {
  const { billingRoutes } = await import('./routes/billing');
  return billingRoutes.fetch(c.req.raw, c.env);
});

export default {
  port: config.PORT,
  fetch: app.fetch,
}; 