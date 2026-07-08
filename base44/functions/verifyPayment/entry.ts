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

    console.log('verifyPayment:', { sessionId, tierType, userEmail, userId });

    let updated = false;
    const updateData = {
      subscription_tier: 'pro',
      subscription_type: tierType,
    };

    // 1. If user is authenticated, get their ID and update directly via service role
    if (!updated) {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.id) {
          console.log('Updating user via service role:', currentUser.id);
          await base44.asServiceRole.entities.User.update(currentUser.id, updateData);
          updated = true;
        }
      } catch (e) {
        console.log('No authenticated user:', e.message);
      }
    }

    // 2. Fall back to userId from Stripe session metadata
    if (!updated && userId) {
      try {
        console.log('Updating by user_id from metadata:', userId);
        await base44.asServiceRole.entities.User.update(userId, updateData);
        updated = true;
      } catch (e) {
        console.error('Update by user_id failed:', e.message);
      }
    }

    // 3. Fall back to email lookup
    if (!updated && userEmail) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users && users.length > 0) {
          console.log('Updating by email:', users[0].id);
          await base44.asServiceRole.entities.User.update(users[0].id, updateData);
          updated = true;
        }
      } catch (e) {
        console.error('Update by email failed:', e.message);
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