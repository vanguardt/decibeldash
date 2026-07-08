import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@16.10.0';

const PRICE_MAP = {
  monthly: { price_id: 'price_1TqmWALcTIhTuTUMSV8MWLQ8', tier_type: 'monthly' },
  lifetime: { price_id: 'price_1TqmWALcTIhTuTUMPaianAvf', tier_type: 'lifetime' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const planType = body?.plan_type;

    if (!planType || !PRICE_MAP[planType]) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const config = PRICE_MAP[planType];
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    const origin = body?.origin || 'https://decibeldash.com';
    const successUrl = `${origin}/payment-success?type=${planType}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing`;

    const session = await stripe.checkout.sessions.create({
      mode: planType === 'monthly' ? 'subscription' : 'payment',
      line_items: [{ price: config.price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        user_id: user.id,
        user_email: user.email || '',
        tier_type: config.tier_type,
        plan_type: planType,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});