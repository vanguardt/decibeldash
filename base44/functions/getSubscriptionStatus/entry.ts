import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // Try reading fresh from DB via service role for reliability
    try {
      const dbUser = await base44.asServiceRole.entities.User.get(user.id);
      if (dbUser) {
        return Response.json({
          subscription_tier: dbUser.subscription_tier || 'free',
          subscription_type: dbUser.subscription_type || null,
        });
      }
    } catch (e) {
      console.log('Service role read failed, using auth.me data:', e.message);
    }

    return Response.json({
      subscription_tier: user.subscription_tier || 'free',
      subscription_type: user.subscription_type || null,
    });
  } catch (error) {
    return Response.json({
      subscription_tier: 'free',
      subscription_type: null,
    });
  }
});