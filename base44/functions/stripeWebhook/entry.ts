import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@16.10.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userEmail = session.customer_email || session.metadata?.user_email || session.customer_details?.email;
      const userId = session.client_reference_id || session.metadata?.user_id;
      const tierType = session.metadata?.tier_type || 'lifetime';
      const updateData = { subscription_tier: 'pro', subscription_type: tierType };

      console.log('Webhook processing:', { userId, userEmail, tierType });

      // Try updating by user_id first
      if (userId) {
        try {
          await base44.asServiceRole.entities.User.update(userId, updateData);
          console.log('Updated by user_id:', userId);
        } catch (e) {
          console.error('Failed to update by user_id:', e.message);
        }
      }

      // Fall back to email lookup
      if (userEmail) {
        try {
          const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
          if (users && users.length > 0) {
            await base44.asServiceRole.entities.User.update(users[0].id, updateData);
            console.log('Updated by email:', users[0].id);
          }
        } catch (e) {
          console.error('Failed to update by email:', e.message);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});