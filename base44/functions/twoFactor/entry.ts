import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { authenticator } from 'npm:otplib@12.0.1';
import QRCode from 'npm:qrcode@1.5.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, code } = body;

    const profiles = await base44.entities.UserProfile.filter({}, '-created_date', 1);
    let profile = profiles[0];

    if (action === 'check') {
      return Response.json({ enabled: profile?.two_factor_enabled ?? false });
    }

    if (action === 'setup') {
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(user.email || 'bruker', 'AIVIND Tech Bladet', secret);

      if (profile) {
        await base44.entities.UserProfile.update(profile.id, { two_factor_secret: secret });
      } else {
        const now = new Date().toISOString();
        const parts = (user.full_name || '').split(' ');
        profile = await base44.entities.UserProfile.create({
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || '',
          email: user.email,
          two_factor_secret: secret,
          terms_accepted_at: now,
          privacy_accepted_at: now,
        });
      }

      const qrSvg = await QRCode.toString(otpauthUrl, { type: 'svg', margin: 1, width: 200 });
      return Response.json({ qr_svg: qrSvg, otpauth_url: otpauthUrl, secret });
    }

    if (action === 'verify_setup') {
      if (!profile?.two_factor_secret) {
        return Response.json({ error: 'Ingen 2FA-oppsett funnet' }, { status: 400 });
      }
      const isValid = authenticator.verify({ token: code, secret: profile.two_factor_secret });
      if (!isValid) {
        return Response.json({ error: 'Ugyldig kode' }, { status: 400 });
      }
      await base44.entities.UserProfile.update(profile.id, {
        two_factor_enabled: true,
        two_factor_enabled_at: new Date().toISOString(),
      });
      return Response.json({ success: true });
    }

    if (action === 'disable') {
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          two_factor_enabled: false,
          two_factor_secret: '',
        });
      }
      return Response.json({ success: true });
    }

    if (action === 'verify') {
      if (!profile?.two_factor_enabled || !profile.two_factor_secret) {
        return Response.json({ error: '2FA er ikke aktivert' }, { status: 400 });
      }
      const isValid = authenticator.verify({ token: code, secret: profile.two_factor_secret });
      if (!isValid) {
        return Response.json({ error: 'Ugyldig kode' }, { status: 400 });
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Ukjent handling' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});