const functions = require('firebase-functions/v1');
const { Resend } = require('resend');

/**
 * Auth trigger: invia l'email di benvenuto quando un nuovo utente viene creato.
 * Si attiva sia per signup email/password che Google Sign In.
 *
 * Per impostare la chiave Resend (una sola volta):
 *   firebase functions:secrets:set RESEND_API_KEY
 */
exports.sendWelcomeEmail = functions
  .runWith({ secrets: ['RESEND_API_KEY'] })
  .auth.user()
  .onCreate(async (user) => {
    if (!user.email) {
      console.log('No email on user, skipping welcome email');
      return null;
    }
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set, skipping welcome email');
      return null;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = user.displayName ? user.displayName.split(' ')[0] : null;
    const blogUrl = 'https://officinadelsuono-87986.web.app/?page=blog';
    const shopUrl = 'https://officinadelsuono-87986.web.app/?page=shop';
    const siteUrl = 'https://officinadelsuono-87986.web.app';

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Benvenuto in Officina del Suono</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#fafafa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0d0d0d;border-radius:20px;overflow:hidden;border:1px solid #1f1f1f;box-shadow:0 30px 80px rgba(0,0,0,0.6);">
          <tr>
            <td style="padding:28px 36px;background:linear-gradient(135deg,#0d0d0d 0%,#161616 100%);border-bottom:1px solid #1f1f1f;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F27D26;">Officina del Suono</td>
                  <td align="right" style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#52525b;">Est. 2025</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td><img src="https://images.unsplash.com/photo-1571266028243-3716f02d7d31?q=80&w=1600&auto=format&fit=crop" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" /></td>
          </tr>
          <tr>
            <td style="padding:48px 40px 8px 40px;">
              <p style="margin:0 0 12px 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#F27D26;font-weight:700;">— Benvenuto a bordo</p>
              <h1 style="margin:0 0 20px 0;font-size:34px;line-height:1.15;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                ${firstName ? `Ciao ${firstName},` : 'Ciao,'}<br>il tuo sound è appena salito di livello.
              </h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#d4d4d8;">
                La tua registrazione è confermata. Da oggi fai parte di una community di DJ, producer e appassionati che non si accontenta del solito hype: testiamo, smontiamo e raccontiamo solo l'attrezzatura che merita davvero di stare nel tuo setup.
              </p>
            </td>
          </tr>
          <tr><td style="padding:32px 40px 0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);"></div></td></tr>
          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <p style="margin:0 0 24px 0;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#71717a;font-weight:600;">Cosa trovi dentro</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="56" valign="top" style="padding-bottom:24px;"><div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F27D26,#FB923C);text-align:center;line-height:44px;font-size:20px;">★</div></td>
                  <td valign="top" style="padding:4px 0 24px 4px;"><div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:4px;">Recensioni senza filtri</div><div style="font-size:14px;line-height:1.6;color:#a1a1aa;">Controller, synth, monitor da studio: testati a fondo per dirti cosa vale davvero i tuoi soldi.</div></td>
                </tr>
                <tr>
                  <td width="56" valign="top" style="padding-bottom:24px;"><div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F27D26,#FB923C);text-align:center;line-height:44px;font-size:20px;">♪</div></td>
                  <td valign="top" style="padding:4px 0 24px 4px;"><div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:4px;">Tips & guide esclusive</div><div style="font-size:14px;line-height:1.6;color:#a1a1aa;">Tecniche di mixaggio, segreti di produzione e workflow professionali per studio e cabina.</div></td>
                </tr>
                <tr>
                  <td width="56" valign="top"><div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F27D26,#FB923C);text-align:center;line-height:44px;font-size:20px;">%</div></td>
                  <td valign="top" style="padding:4px 0 0 4px;"><div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:4px;">Offerte in anteprima</div><div style="font-size:14px;line-height:1.6;color:#a1a1aa;">Sconti, novità e drop dell'industria audio prima che arrivino a tutti gli altri.</div></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 16px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#F27D26,#FB923C);box-shadow:0 12px 30px rgba(242,125,38,0.35);">
                    <a href="${blogUrl}" style="display:inline-block;padding:18px 44px;font-size:14px;font-weight:700;color:#0a0a0a;text-decoration:none;text-transform:uppercase;letter-spacing:2px;border-radius:12px;">Esplora il blog →</a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0 0;font-size:13px;color:#71717a;">oppure <a href="${shopUrl}" style="color:#F27D26;text-decoration:none;font-weight:600;">visita lo shop</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 40px 40px;">
              <div style="background:#141414;border-left:3px solid #F27D26;padding:20px 24px;border-radius:0 12px 12px 0;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#d4d4d8;font-style:italic;">"Senza musica, la vita sarebbe un errore."</p>
                <p style="margin:8px 0 0 0;font-size:12px;color:#71717a;letter-spacing:1px;text-transform:uppercase;">— Friedrich Nietzsche</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#070707;padding:32px 40px;text-align:center;border-top:1px solid #1f1f1f;">
              <p style="margin:0 0 6px 0;font-size:13px;color:#a1a1aa;">Alza il volume.</p>
              <p style="margin:0 0 20px 0;font-size:14px;color:#ffffff;font-weight:700;letter-spacing:0.5px;">Il team di Officina del Suono</p>
              <p style="margin:0;font-size:11px;color:#52525b;line-height:1.6;">Hai ricevuto questa email perché ti sei registrato su <a href="${siteUrl}" style="color:#71717a;text-decoration:underline;">officinadelsuono.it</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      const result = await resend.emails.send({
        from: 'Officina del Suono <onboarding@resend.dev>',
        to: user.email,
        subject: 'Benvenuto in Officina del Suono — alza il volume',
        html,
      });
      console.log('Welcome email sent:', result);
    } catch (err) {
      console.error('Error sending welcome email:', err);
    }
    return null;
  });
