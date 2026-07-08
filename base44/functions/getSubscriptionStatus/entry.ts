import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch fresh user record from DB (bypasses stale JWT token data)
    const freshUser = await base44.asServiceRole.entities.User.get(user.id);

    return Response.json({
      subscription_tier: freshUser?.subscription_tier || 'free',
      subscription_type: freshUser?.subscription_type || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});