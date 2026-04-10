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

/**
 * Klarna: crea una sessione di pagamento e salva ordine preliminare in Firestore
 */
exports.createKlarnaSession = functions
  .runWith({ secrets: ['KLARNA_MERCHANT_ID', 'KLARNA_API_KEY'] })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(400).json({ error: 'POST only' });
      return;
    }

    const { items, total, customerEmail } = req.body;

    if (!items || !total || !customerEmail) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) admin.initializeApp();

      // Salva ordine preliminare in Firestore
      const ordersRef = admin.firestore().collection('orders');
      const newOrderRef = ordersRef.doc();

      const orderData = {
        id: newOrderRef.id,
        items,
        total,
        customerEmail,
        paymentMethod: 'Klarna',
        status: 'pending_payment',
        klarnaSessionId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await newOrderRef.set(orderData);

      // Crea sessione Klarna
      const klarnaUrl = 'https://api.klarna.com/checkout/v3/orders';
      const auth = Buffer.from(`${process.env.KLARNA_MERCHANT_ID}:${process.env.KLARNA_API_KEY}`).toString('base64');

      const klarnaPayload = {
        purchase_country: 'IT',
        purchase_currency: 'EUR',
        locale: 'it-IT',
        order_amount: Math.round(total * 100), // centesimi
        order_lines: items.map(item => ({
          type: 'physical',
          reference: item.id,
          name: item.name,
          quantity: item.quantity,
          quantity_unit: 'pcs',
          unit_price: Math.round(item.price * 100),
          total_amount: Math.round(item.price * item.quantity * 100),
          total_tax_amount: 0,
        })),
        merchant_urls: {
          success: 'https://officinadelsuono-87986.web.app/?page=shop&payment=success',
          cancel: 'https://officinadelsuono-87986.web.app/?page=shop&payment=canceled',
          failure: 'https://officinadelsuono-87986.web.app/?page=shop&payment=failed',
          notification: 'https://us-central1-officinadelsuono-87986.cloudfunctions.net/klarnaWebhook',
        },
      };

      const klarnaResponse = await fetch(klarnaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(klarnaPayload),
      });

      if (!klarnaResponse.ok) {
        throw new Error(`Klarna API error: ${klarnaResponse.statusText}`);
      }

      const klarnaSession = await klarnaResponse.json();

      // Aggiorna ordine con session ID Klarna
      await newOrderRef.update({
        klarnaSessionId: klarnaSession.order_id,
      });

      res.json({
        orderId: newOrderRef.id,
        redirectUrl: klarnaSession.redirect_url,
      });
    } catch (error) {
      console.error('Klarna session error:', error);
      res.status(500).json({ error: error.message });
    }
  });

/**
 * Klarna Webhook: riceve conferma pagamento e aggiorna ordine
 */
exports.klarnaWebhook = functions
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(400).send('POST only');
      return;
    }

    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) admin.initializeApp();

      const { order_id, status } = req.body;

      if (!order_id) {
        res.status(400).json({ error: 'Missing order_id' });
        return;
      }

      // Trova ordine per klarnaSessionId
      const snapshot = await admin.firestore()
        .collection('orders')
        .where('klarnaSessionId', '==', order_id)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`No order found for Klarna session ${order_id}`);
        res.status(200).json({ received: true });
        return;
      }

      const orderDoc = snapshot.docs[0];
      let orderStatus = 'pending_payment';

      if (status === 'AUTHORIZED' || status === 'CAPTURED') {
        orderStatus = 'paid';
      } else if (status === 'CANCELLED' || status === 'EXPIRED') {
        orderStatus = 'canceled';
      }

      await orderDoc.ref.update({
        status: orderStatus,
        klarnaStatus: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Order ${orderDoc.id} updated to ${orderStatus}`);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Klarna webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

/**
 * Pubblica un post su Facebook, Instagram e/o TikTok.
 *
 * Secrets da impostare (una sola volta):
 *   echo "TOKEN" | firebase functions:secrets:set META_ACCESS_TOKEN
 *   echo "ID"    | firebase functions:secrets:set META_PAGE_ID
 *   echo "ID"    | firebase functions:secrets:set META_IG_USER_ID
 *   echo "TOKEN" | firebase functions:secrets:set TIKTOK_ACCESS_TOKEN
 */
exports.publishToSocial = functions
  .runWith({ secrets: ['META_ACCESS_TOKEN', 'META_PAGE_ID', 'META_IG_USER_ID', 'TIKTOK_ACCESS_TOKEN'] })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(200).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

    const { text, imageUrl, platforms, postId } = req.body;
    if (!text || !Array.isArray(platforms) || platforms.length === 0) {
      res.status(400).json({ error: 'text e platforms sono obbligatori' });
      return;
    }

    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp();

    const results = {};
    const errors = {};

    // ── Facebook ──────────────────────────────────────────────────────────
    if (platforms.includes('facebook') && process.env.META_PAGE_ID && process.env.META_ACCESS_TOKEN) {
      try {
        const body = { message: text, access_token: process.env.META_ACCESS_TOKEN };
        if (imageUrl) body.link = imageUrl;
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${process.env.META_PAGE_ID}/feed`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        );
        const fbData = await fbRes.json();
        if (fbData.error) throw new Error(fbData.error.message);
        results.facebook = fbData.id;
      } catch (e) {
        errors.facebook = e.message;
        console.error('Facebook publish error:', e.message);
      }
    }

    // ── Instagram (richiede immagine; senza imageUrl usa carousel placeholder) ──
    if (platforms.includes('instagram') && process.env.META_IG_USER_ID && process.env.META_ACCESS_TOKEN) {
      try {
        const igBase = `https://graph.facebook.com/v19.0/${process.env.META_IG_USER_ID}`;
        const token = process.env.META_ACCESS_TOKEN;
        const containerBody = { caption: text, access_token: token };
        if (imageUrl) {
          containerBody.image_url = imageUrl;
        } else {
          // Senza immagine non si può pubblicare su IG — skip
          throw new Error('Instagram richiede un\'immagine. Aggiungi un URL immagine al post.');
        }
        const cRes = await fetch(`${igBase}/media`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(containerBody),
        });
        const cData = await cRes.json();
        if (cData.error) throw new Error(cData.error.message);

        const pRes = await fetch(`${igBase}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: cData.id, access_token: token }),
        });
        const pData = await pRes.json();
        if (pData.error) throw new Error(pData.error.message);
        results.instagram = pData.id;
      } catch (e) {
        errors.instagram = e.message;
        console.error('Instagram publish error:', e.message);
      }
    }

    // ── TikTok (text post via Content Posting API v2) ────────────────────
    if (platforms.includes('tiktok') && process.env.TIKTOK_ACCESS_TOKEN) {
      try {
        const tkRes = await fetch('https://open.tiktokapis.com/v2/post/publish/text/init/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({
            post_info: {
              title: text.slice(0, 150),
              privacy_level: 'PUBLIC_TO_EVERYONE',
              disable_comment: false,
              disable_duet: false,
              disable_stitch: false,
            },
            source_info: { source: 'PULL_FROM_URL' },
          }),
        });
        const tkData = await tkRes.json();
        if (tkData.error?.code && tkData.error.code !== 'ok') throw new Error(tkData.error.message || 'TikTok API error');
        results.tiktok = tkData.data?.publish_id;
      } catch (e) {
        errors.tiktok = e.message;
        console.error('TikTok publish error:', e.message);
      }
    }

    // ── Aggiorna post in Firestore ────────────────────────────────────────
    if (postId) {
      const successCount = Object.keys(results).length;
      const errorCount = Object.keys(errors).length;
      const status = successCount === 0 ? 'failed' : errorCount === 0 ? 'published' : 'partial';
      await admin.firestore().collection('social_posts').doc(postId).update({
        status,
        platformIds: results,
        publishErrors: Object.keys(errors).length > 0 ? errors : null,
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(err => console.error('Firestore update error:', err));
    }

    res.json({
      success: Object.keys(results).length > 0,
      results,
      errors,
    });
  });

/**
 * Recupera le statistiche dai social (followers, reach) e le salva in cache Firestore.
 *
 * Stessi secrets di publishToSocial (META_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID)
 */
exports.fetchSocialStats = functions
  .runWith({ secrets: ['META_ACCESS_TOKEN', 'META_PAGE_ID', 'META_IG_USER_ID'] })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(200).send(''); return; }

    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp();

    const stats = {};

    // Facebook Page
    if (process.env.META_PAGE_ID && process.env.META_ACCESS_TOKEN) {
      try {
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${process.env.META_PAGE_ID}?fields=fan_count,followers_count,name&access_token=${process.env.META_ACCESS_TOKEN}`
        );
        const fbData = await fbRes.json();
        if (!fbData.error) {
          stats.facebook = {
            followers: fbData.followers_count || fbData.fan_count || 0,
            name: fbData.name,
            connected: true,
          };
        }
      } catch (e) {
        stats.facebook = { error: e.message, connected: false };
      }
    }

    // Instagram Business
    if (process.env.META_IG_USER_ID && process.env.META_ACCESS_TOKEN) {
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/${process.env.META_IG_USER_ID}?fields=followers_count,media_count,username&access_token=${process.env.META_ACCESS_TOKEN}`
        );
        const igData = await igRes.json();
        if (!igData.error) {
          stats.instagram = {
            followers: igData.followers_count || 0,
            posts: igData.media_count || 0,
            username: igData.username,
            connected: true,
          };
        }
      } catch (e) {
        stats.instagram = { error: e.message, connected: false };
      }
    }

    // Salva in cache Firestore
    const cacheData = { ...stats, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    await admin.firestore().collection('settings').doc('social_stats').set(cacheData, { merge: true }).catch(() => {});

    // Aggiorna anche social_connections con dati live
    const connections = {};
    if (stats.facebook) connections.facebook = { connected: !!stats.facebook.connected, followers: stats.facebook.followers, accountName: stats.facebook.name };
    if (stats.instagram) connections.instagram = { connected: !!stats.instagram.connected, followers: stats.instagram.followers, accountName: `@${stats.instagram.username || ''}` };
    if (Object.keys(connections).length > 0) {
      await admin.firestore().collection('settings').doc('social_connections').set(connections, { merge: true }).catch(() => {});
    }

    res.json(stats);
  });
