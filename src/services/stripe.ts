import Stripe from 'stripe';
import { config } from '../config';
import { db } from '../db';

// Initialize Stripe with your secret key (add to .env)
const stripe = new Stripe(config.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class StripeService {
  // Create a checkout session for Pro subscription
  async createProCheckout(userId: string, email: string) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'BeatMyBag Pro',
              description: 'Unlimited shots + 30-day history',
              images: ['https://beatmybag.com/pro-icon.png'],
            },
            unit_amount: 799, // $7.99 in cents
            recurring: {
              interval: 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${config.FRONTEND_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.FRONTEND_URL}/upgrade/cancel`,
      metadata: {
        userId,
      },
    });

    return session;
  }

  // Create a checkout session for Retailer subscription
  async createRetailerCheckout(userId: string, email: string) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'BeatMyBag Retailer',
              description: 'Advanced analytics + Lead generation',
              images: ['https://beatmybag.com/retailer-icon.png'],
            },
            unit_amount: 39900, // $399 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${config.FRONTEND_URL}/retailer/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.FRONTEND_URL}/retailer/cancel`,
      metadata: {
        userId,
      },
    });

    return session;
  }

  // Handle webhook events from Stripe
  async handleWebhook(signature: string, payload: string) {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.STRIPE_WEBHOOK_SECRET || ''
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object);
        break;
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    // Update user to Pro or Retailer based on amount
    const amount = session.amount_total || 0;
    const role = amount === 799 ? 'pro' : 'dealer';
    
    // Update user in database
    await db
      .updateTable('users')
      .set({ 
        role,
        stripeCustomerId: session.customer as string,
        subscriptionId: session.subscription as string
      })
      .where('id', '=', userId)
      .execute();
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    // Downgrade user to free tier
    await db
      .updateTable('users')
      .set({ 
        role: 'free',
        credits: config.FREE_SHOTS_PER_MONTH
      })
      .where('subscriptionId', '=', subscription.id)
      .execute();
  }

  // Create portal session for managing subscription
  async createPortalSession(customerId: string) {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${config.FRONTEND_URL}/account`,
    });

    return session;
  }
} 