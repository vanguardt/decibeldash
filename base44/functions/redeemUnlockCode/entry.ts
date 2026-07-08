import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate the user from the request token
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const code = body?.code;

    if (!code || !code.trim()) {
      return Response.json({ success: false, error: 'Please enter a code' });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Look up the code using user-scoped client (UnlockCode RLS allows read for all)
    const matches = await base44.entities.UnlockCode.filter({
      code: normalizedCode
    });

    if (!matches || matches.length === 0) {
      return Response.json({ success: false, error: 'Invalid code' });
    }

    const unlockCode = matches[0];
    if (unlockCode.used) {
      return Response.json({ success: false, error: 'This code has already been used' });
    }

    // Mark the code as used (UnlockCode RLS allows update for all)
    await base44.entities.UnlockCode.update(unlockCode.id, {
      used: true,
      redeemed_by_id: user.id,
    });

    const tierType = unlockCode.tier_type || 'lifetime';

    return Response.json({
      success: true,
      tier_type: tierType,
      message: 'Pro activated successfully'
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
});