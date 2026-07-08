import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier_type } = await req.json();
    if (!tier_type || (tier_type !== 'monthly' && tier_type !== 'lifetime')) {
      return Response.json({ error: 'Invalid tier type' }, { status: 400 });
    }

    // Generate a unique code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const newCode = `DD-PRO-${seg()}-${seg()}-${seg()}`;

    // Save to database with purchaser email
    const record = await base44.asServiceRole.entities.UnlockCode.create({
      code: newCode,
      tier_type,
      used: false,
      purchaser_email: user.email,
      emailed: false,
      redeemed_by_id: user.id,
    });

    return Response.json({
      success: true,
      code: newCode,
      code_id: record.id,
      tier_type,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});