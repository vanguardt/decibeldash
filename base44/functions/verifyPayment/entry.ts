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
    const userId = session.client_reference_id || session.metadata?.user_id;

    // Try to find the user by ID first, then by email
    let updated = false;

    if (userId) {
      try {
        await base44.asServiceRole.entities.User.update(userId, {
          subscription_tier: 'pro',
          subscription_type: tierType,
        });
        updated = true;
      } catch (e) {
        console.error('Update by user_id failed:', e.message);
      }
    }

    if (!updated && userEmail) {
      const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
      if (users && users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          subscription_tier: 'pro',
          subscription_type: tierType,
        });
        updated = true;
      }
    }

    // Also try the currently authenticated user
    if (!updated) {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          await base44.auth.updateMe({
            subscription_tier: 'pro',
            subscription_type: tierType,
          });
          updated = true;
        }
      } catch (e) {
        console.error('No authenticated user to update:', e.message);
      }
    }

    return Response.json({
      activated: updated,
      tier_type: tierType,
      email: userEmail,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});