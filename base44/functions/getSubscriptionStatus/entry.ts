import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate the user from the request token
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({
        subscription_tier: 'free',
        subscription_type: null,
      });
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