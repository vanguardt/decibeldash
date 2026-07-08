import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = await req.json();
    console.log('redeemUnlockCode called with code:', code, 'user:', user?.id);
    if (!code || !code.trim()) {
      return Response.json({ success: false, error: 'Please enter a code' });
    }

    // Look up the code using service role (bypasses RLS)
    const matches = await base44.asServiceRole.entities.UnlockCode.filter({
      code: code.trim()
    });

    console.log('matches found:', matches?.length);

    if (!matches || matches.length === 0) {
      return Response.json({ success: false, error: 'Invalid code' });
    }

    const unlockCode = matches[0];
    if (unlockCode.used) {
      return Response.json({ success: false, error: 'This code has already been used' });
    }

    // Mark the code as used
    await base44.asServiceRole.entities.UnlockCode.update(unlockCode.id, {
      used: true,
      redeemed_by_id: user.id,
    });

    // Upgrade the user's tier directly in DB (bypasses stale JWT token issue)
    const tierType = unlockCode.tier_type || 'lifetime';
    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_tier: 'pro',
      subscription_type: tierType,
    });

    console.log('User upgraded to pro:', user.id);

    return Response.json({
      success: true,
      tier_type: tierType,
      message: 'Pro activated successfully'
    });
  } catch (error) {
    console.error('redeemUnlockCode error:', error.message, error.stack);
    return Response.json({ success: false, error: error.message });
  }
});