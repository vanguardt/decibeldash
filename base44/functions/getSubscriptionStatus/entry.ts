import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@16.10.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({
        subscription_tier: 'free',
        subscription_type: null,
      });
    }

    // Read fresh from DB via service role for reliability
    let dbTier = 'free';
    let dbType = null;
    try {
      const dbUser = await base44.asServiceRole.entities.User.get(user.id);
      if (dbUser) {
        dbTier = dbUser.subscription_tier || 'free';
        dbType = dbUser.subscription_type || null;
      }
    } catch (e) {
      console.log('Service role read failed, using auth.me data:', e.message);
      dbTier = user.subscription_tier || 'free';
      dbType = user.subscription_type || null;
    }

    // If DB already shows Pro, return immediately (fast path)
    if (dbTier === 'pro') {
      return Response.json({
        subscription_tier: 'pro',
        subscription_type: dbType,
      });
    }

    // Fallback: check Stripe for active payments by user email.
    // This recovers Pro status if the payment was made before the account
    // was linked (guest checkout) or if the DB update failed.
    if (user.email) {
      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
          apiVersion: '2024-12-18.acacia' as any,
        });

        // Find Stripe customer by email
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;

          // Check for active monthly subscriptions
          const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 5,
          });
          if (subs.data.length > 0) {
            console.log('Recovered Pro monthly via Stripe for user:', user.id);
            await base44.asServiceRole.entities.User.update(user.id, {
              subscription_tier: 'pro',
              subscription_type: 'monthly',
            });
            return Response.json({
              subscription_tier: 'pro',
              subscription_type: 'monthly',
            });
          }

          // Check for paid one-time payments (lifetime)
          const sessions = await stripe.checkout.sessions.list({
            customer: customerId,
            limit: 50,
          });
          const paidOneTime = sessions.data.find(
            (s) => s.payment_status === 'paid' && s.mode === 'payment'
          );
          if (paidOneTime) {
            console.log('Recovered Pro lifetime via Stripe for user:', user.id);
            await base44.asServiceRole.entities.User.update(user.id, {
              subscription_tier: 'pro',
              subscription_type: 'lifetime',
            });
            return Response.json({
              subscription_tier: 'pro',
              subscription_type: 'lifetime',
            });
          }
        }
      } catch (e) {
        console.log('Stripe fallback check failed:', e.message);
      }
    }

    return Response.json({
      subscription_tier: 'free',
      subscription_type: null,
    });
  } catch (error) {
    console.error('getSubscriptionStatus error:', error.message);
    return Response.json({
      subscription_tier: 'free',
      subscription_type: null,
    });
  }
});