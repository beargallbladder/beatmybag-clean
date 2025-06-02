import { Hono } from 'hono';
import { StripeService } from '../services/stripe';
import { db } from '../db';

const billing = new Hono();
const stripeService = new StripeService();

// Create checkout session for Pro subscription
billing.post('/checkout/pro', async (c) => {
  const payload = c.get('jwtPayload');
  
  // Get user details
  const user = await db
    .selectFrom('users')
    .select(['id', 'email'])
    .where('id', '=', payload.sub)
    .executeTakeFirst();
    
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  try {
    const session = await stripeService.createProCheckout(user.id, user.email);
    return c.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

// Create checkout session for Retailer subscription
billing.post('/checkout/retailer', async (c) => {
  const payload = c.get('jwtPayload');
  
  // Get user details
  const user = await db
    .selectFrom('users')
    .select(['id', 'email'])
    .where('id', '=', payload.sub)
    .executeTakeFirst();
    
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  try {
    const session = await stripeService.createRetailerCheckout(user.id, user.email);
    return c.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

// Stripe webhook handler
billing.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();
  
  if (!signature) {
    return c.json({ error: 'No signature' }, 400);
  }
  
  try {
    await stripeService.handleWebhook(signature, body);
    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook failed' }, 400);
  }
});

// Create billing portal session
billing.post('/portal', async (c) => {
  const payload = c.get('jwtPayload');
  
  // Get user's Stripe customer ID
  const user = await db
    .selectFrom('users')
    .select(['stripeCustomerId'])
    .where('id', '=', payload.sub)
    .executeTakeFirst();
    
  if (!user?.stripeCustomerId) {
    return c.json({ error: 'No subscription found' }, 404);
  }
  
  try {
    const session = await stripeService.createPortalSession(user.stripeCustomerId);
    return c.json({ portalUrl: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

export { billing as billingRoutes }; 