import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@16.10.0';

const PRICE_MAP = {
  monthly: { price_id: 'price_1TqmWALcTIhTuTUMSV8MWLQ8', tier_type: 'monthly' },
  lifetime: { price_id: 'price_1TqmWALcTIhTuTUMPaianAvf', tier_type: 'lifetime' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const planType = body?.plan_type;
    const userEmail = body?.email;
    const userId = body?.user_id;

    if (!planType || !PRICE_MAP[planType]) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    if (!userEmail) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const config = PRICE_MAP[planType];
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    const origin = body?.origin || 'https://decibeldash.com';
    const successUrl = `${origin}/payment-success?type=${planType}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing`;

    const sessionParams: any = {
      mode: planType === 'monthly' ? 'subscription' : 'payment',
      line_items: [{ price: config.price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        user_email: userEmail,
        tier_type: config.tier_type,
        plan_type: planType,
      },
    };

    if (userId) {
      sessionParams.client_reference_id = userId;
      sessionParams.metadata.user_id = userId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});