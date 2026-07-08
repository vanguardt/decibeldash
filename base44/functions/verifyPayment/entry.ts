import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@16.10.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const sessionId = body?.session_id;

    if (!sessionId) {
      return Response.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return Response.json({ activated: false, status: session.payment_status });
    }

    const tierType = session.metadata?.tier_type || 'lifetime';
    const userEmail = session.customer_email || session.customer_details?.email || session.metadata?.user_email;

    console.log('verifyPayment:', { sessionId, tierType, userEmail });

    // Update the user's record in the DB via service role (auth.updateMe does NOT persist from backend functions)
    let updated = false;
    let userId = null;
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.id) userId = currentUser.id;
    } catch (e) {
      console.log('auth.me failed:', e.message);
    }

    // Path 1: authenticated user — update by their user ID
    if (userId) {
      try {
        console.log('Updating user via service role by ID:', userId);
        await base44.asServiceRole.entities.User.update(userId, {
          subscription_tier: 'pro',
          subscription_type: tierType,
        });
        updated = true;
      } catch (e) {
        console.error('Service role update by ID failed:', e.message);
      }
    }

    // Path 2: not authenticated — look up by email from Stripe session
    if (!updated && userEmail) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users && users.length > 0) {
          console.log('Updating user via service role by email:', users[0].id);
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_tier: 'pro',
            subscription_type: tierType,
          });
          updated = true;
        }
      } catch (e) {
        console.error('Service role update by email failed:', e.message);
      }
    }

    return Response.json({
      activated: updated,
      tier_type: tierType,
      email: userEmail,
      paid: true,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});