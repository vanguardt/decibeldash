import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const userId = body?.user_id;

    if (!userId) {
      return Response.json({
        subscription_tier: 'free',
        subscription_type: null,
      });
    }

    // Fetch fresh user record from DB using service role (bypasses RLS & stale JWT)
    const freshUser = await base44.asServiceRole.entities.User.get(userId);

    return Response.json({
      subscription_tier: freshUser?.subscription_tier || 'free',
      subscription_type: freshUser?.subscription_type || null,
    });
  } catch (error) {
    return Response.json({
      subscription_tier: 'free',
      subscription_type: null,
    });
  }
});