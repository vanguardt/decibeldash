import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { code_id } = await req.json();

    if (!code_id) {
      return Response.json({ error: 'Missing code_id' }, { status: 400 });
    }

    // Look up the code using service role
    const unlockCode = await base44.asServiceRole.entities.UnlockCode.get(code_id);
    if (!unlockCode) {
      return Response.json({ error: 'Code not found' }, { status: 404 });
    }

    // Already emailed — skip
    if (unlockCode.emailed) {
      return Response.json({ success: true, message: 'Already emailed' });
    }

    if (!unlockCode.purchaser_email) {
      return Response.json({ error: 'No purchaser email on record' }, { status: 400 });
    }

    const tierLabel = unlockCode.tier_type === 'lifetime' ? 'Lifetime' : 'Monthly';

    // Email the code to the purchaser
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: unlockCode.purchaser_email,
      subject: 'Your DecibelDash Pro Unlock Code',
      body: `Thank you for purchasing DecibelDash Pro (${tierLabel})!\n\nYour unlock code is:\n\n${unlockCode.code}\n\nOpen the DecibelDash app, go to the Pricing page, and enter this code to activate Pro.\n\nEnjoy!`,
    });

    // Mark as emailed
    await base44.asServiceRole.entities.UnlockCode.update(code_id, {
      emailed: true,
    });

    return Response.json({
      success: true,
      message: `Code emailed to ${unlockCode.purchaser_email}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});