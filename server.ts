import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import admin from "firebase-admin";
import fs from "fs";
import os from "os";
import { Resend } from "resend";

// Initialize Firebase Admin
let bucket: any;
try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfigData = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  
  if (!admin.apps.length) {
    let storageBucket = firebaseConfigData.storageBucket;
    
    // AI Studio buckets often use .appspot.com or .firebasestorage.app
    // We'll try to normalize it if it's just the project ID
    if (storageBucket && !storageBucket.includes('.')) {
      storageBucket = `${storageBucket}.firebasestorage.app`;
    }
    
    console.log(`Initializing Firebase Admin with project: ${firebaseConfigData.projectId} and bucket: ${storageBucket}`);
    
    admin.initializeApp({
      projectId: firebaseConfigData.projectId,
      storageBucket: storageBucket
    });
  }
  
  // Try to get the bucket. If it fails later, we'll try fallbacks in the route.
  bucket = admin.storage().bucket();
  console.log(`Bucket initialized: ${bucket.name}`);
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

const upload = multer({ dest: os.tmpdir() });

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Email endpoints
  app.post("/api/emails/welcome", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!process.env.RESEND_API_KEY) {
        console.log(`[Email Simulation] Welcome email sent to: ${email}`);
        return res.json({ success: true, simulated: true });
      }

      const { name } = req.body;
      const firstName = (name && typeof name === 'string') ? name.split(' ')[0] : null;
      const blogUrl = 'https://officinadelsuono-87986.web.app/?page=blog';
      const shopUrl = 'https://officinadelsuono-87986.web.app/?page=shop';
      const siteUrl = 'https://officinadelsuono-87986.web.app';

      const { data, error } = await getResend().emails.send({
        from: 'Officina del Suono <onboarding@resend.dev>',
        to: email,
        subject: 'Benvenuto in Officina del Suono — alza il volume',
        html: `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Benvenuto in Officina del Suono</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#fafafa;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Il tuo posto in prima fila tra recensioni, guide e offerte per chi vive di musica.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0d0d0d;border-radius:20px;overflow:hidden;border:1px solid #1f1f1f;box-shadow:0 30px 80px rgba(0,0,0,0.6);">

          <!-- Brand bar -->
          <tr>
            <td style="padding:28px 36px;background:linear-gradient(135deg,#0d0d0d 0%,#161616 100%);border-bottom:1px solid #1f1f1f;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F27D26;">
                    Officina del Suono
                  </td>
                  <td align="right" style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#52525b;">
                    Est. 2025
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="position:relative;">
              <img src="https://images.unsplash.com/photo-1571266028243-3716f02d7d31?q=80&w=1600&auto=format&fit=crop" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>

          <!-- Headline -->
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

          <!-- Divider -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);"></div>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <p style="margin:0 0 24px 0;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#71717a;font-weight:600;">Cosa trovi dentro</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="56" valign="top" style="padding-bottom:24px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F27D26,#FB923C);text-align:center;line-height:44px;font-size:20px;">★</div>
                  </td>
                  <td valign="top" style="padding:4px 0 24px 4px;">
                    <div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:4px;">Recensioni senza filtri</div>
                    <div style="font-size:14px;line-height:1.6;color:#a1a1aa;">Controller, synth, monitor da studio: testati a fondo per dirti cosa vale davvero i tuoi soldi.</div>
                  </td>
                </tr>
                <tr>
                  <td width="56" valign="top" style="padding-bottom:24px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F27D26,#FB923C);text-align:center;line-height:44px;font-size:20px;">♪</div>
                  </td>
                  <td valign="top" style="padding:4px 0 24px 4px;">
                    <div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:4px;">Tips & guide esclusive</div>
                    <div style="font-size:14px;line-height:1.6;color:#a1a1aa;">Tecniche di mixaggio, segreti di produzione e workflow professionali per studio e cabina.</div>
                  </td>
                </tr>
                <tr>
                  <td width="56" valign="top">
                    <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F27D26,#FB923C);text-align:center;line-height:44px;font-size:20px;">%</div>
                  </td>
                  <td valign="top" style="padding:4px 0 0 4px;">
                    <div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:4px;">Offerte in anteprima</div>
                    <div style="font-size:14px;line-height:1.6;color:#a1a1aa;">Sconti, novità e drop dell'industria audio prima che arrivino a tutti gli altri.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:40px 40px 16px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#F27D26,#FB923C);box-shadow:0 12px 30px rgba(242,125,38,0.35);">
                    <a href="${blogUrl}" style="display:inline-block;padding:18px 44px;font-size:14px;font-weight:700;color:#0a0a0a;text-decoration:none;text-transform:uppercase;letter-spacing:2px;border-radius:12px;">
                      Esplora il blog →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0 0;font-size:13px;color:#71717a;">
                oppure <a href="${shopUrl}" style="color:#F27D26;text-decoration:none;font-weight:600;">visita lo shop</a>
              </p>
            </td>
          </tr>

          <!-- Quote -->
          <tr>
            <td style="padding:32px 40px 40px 40px;">
              <div style="background:#141414;border-left:3px solid #F27D26;padding:20px 24px;border-radius:0 12px 12px 0;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#d4d4d8;font-style:italic;">
                  "Senza musica, la vita sarebbe un errore."
                </p>
                <p style="margin:8px 0 0 0;font-size:12px;color:#71717a;letter-spacing:1px;text-transform:uppercase;">— Friedrich Nietzsche</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#070707;padding:32px 40px;text-align:center;border-top:1px solid #1f1f1f;">
              <p style="margin:0 0 6px 0;font-size:13px;color:#a1a1aa;">Alza il volume.</p>
              <p style="margin:0 0 20px 0;font-size:14px;color:#ffffff;font-weight:700;letter-spacing:0.5px;">Il team di Officina del Suono</p>
              <p style="margin:0;font-size:11px;color:#52525b;line-height:1.6;">
                Hai ricevuto questa email perché ti sei registrato su <a href="${siteUrl}" style="color:#71717a;text-decoration:underline;">officinadelsuono.it</a>.<br>
                Se non riconosci questa registrazione, ignora pure questo messaggio.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      });

      if (error) {
        console.error("Welcome email error from Resend:", error);
        return res.status(400).json({ error: error.message || "Errore durante l'invio dell'email" });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Welcome email error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/emails/broadcast", async (req, res) => {
    try {
      const { emails, postTitle, postExcerpt, postUrl } = req.body;
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: "Emails array is required" });
      }

      if (!process.env.RESEND_API_KEY) {
        console.log(`[Email Simulation] Broadcast email sent to ${emails.length} subscribers about post: ${postTitle}`);
        return res.json({ success: true, simulated: true });
      }

      // Resend allows sending up to 50 emails per batch request
      // For simplicity, we'll send them in a loop or as a single batch if supported
      const { data, error } = await getResend().emails.send({
        from: 'onboarding@resend.dev', // Fallback for testing. In production, use your verified domain.
        to: emails, // Bcc is better for privacy, but Resend handles arrays in 'to' by sending individual emails if using batch API, or we can use bcc.
        bcc: emails,
        subject: `Nuovo Articolo: ${postTitle}`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #141414; color: #ffffff; border-radius: 10px;">
            <h1 style="color: #F27D26;">Nuovo Articolo Pubblicato!</h1>
            <h2>${postTitle}</h2>
            <p style="color: #cccccc; line-height: 1.6;">${postExcerpt}</p>
            <div style="margin-top: 30px;">
              <a href="${postUrl}" style="background-color: #F27D26; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Leggi l'articolo completo</a>
            </div>
          </div>
        `
      });

      if (error) {
        console.error("Broadcast email error from Resend:", error);
        return res.status(400).json({ error: error.message || "Errore durante l'invio dell'email" });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Broadcast email error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/emails/test", async (req, res) => {
    try {
      const { customMessage } = req.body;
      
      // Using the specific key provided by the user for this test endpoint
      const testResend = new Resend('re_FE2LjN2u_AnG8fiSAbW64pEPYiydPj8ii');

      const { data, error } = await testResend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'amerigodecristofaro8@gmail.com',
        subject: 'Hello World',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <p>Congrats on sending your <strong>first email</strong>!</p>
            ${customMessage ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #F27D26; color: #333;">
              <strong>Messaggio personalizzato:</strong><br/>
              ${customMessage}
            </div>` : ''}
          </div>
        `
      });

      if (error) {
        console.error("Test email error from Resend:", error);
        return res.status(400).json({ error: error.message || "Errore durante l'invio dell'email" });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Test email error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload endpoint
  app.post("/api/upload", upload.array('files', 10), async (req, res) => {
    try {
      if (!bucket) {
        throw new Error("Firebase Storage bucket is not initialized. Please check your Firebase configuration.");
      }
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Check if bucket exists, if not try fallback
      try {
        const [exists] = await bucket.exists();
        if (!exists) {
          console.warn(`Bucket ${bucket.name} does not exist, trying fallback...`);
          const projectId = admin.app().options.projectId;
          const fallbackBucketName = `${projectId}.appspot.com`;
          bucket = admin.storage().bucket(fallbackBucketName);
          const [fallbackExists] = await bucket.exists();
          if (!fallbackExists) {
             // Try one more: just the project ID
             bucket = admin.storage().bucket(projectId);
             const [idExists] = await bucket.exists();
             if (!idExists) {
               throw new Error(`Could not find a valid bucket. Tried: ${admin.app().options.storageBucket}, ${fallbackBucketName}, ${projectId}`);
             }
          }
          console.log(`Switched to fallback bucket: ${bucket.name}`);
        }
      } catch (e) {
        console.error("Error checking bucket existence:", e);
        // Continue anyway, it might be a permissions issue with exists()
      }

      const uploadPromises = files.map(async (file) => {
        const destination = `products/${Date.now()}_${file.originalname}`;
        const blob = bucket.file(destination);
        
        console.log(`Uploading ${file.originalname} to ${destination}...`);
        
        try {
          await bucket.upload(file.path, {
            destination,
            metadata: {
              contentType: file.mimetype,
            },
          });
          console.log(`Successfully uploaded ${file.originalname}`);
        } catch (uploadError: any) {
          console.error(`Error uploading ${file.originalname} to bucket:`, uploadError);
          throw uploadError;
        }

        // Try to make the file public, but don't fail if it doesn't work
        try {
          await blob.makePublic();
          console.log(`Successfully made ${file.originalname} public`);
        } catch (e) {
          console.warn(`Could not make ${file.originalname} public, it might already be public or permissions are restricted:`, e);
        }
        
        // Clean up local file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        // Return the public URL format for Firebase Storage
        return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
      });

      const urls = await Promise.all(uploadPromises);
      res.json({ urls });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API routes FIRST
  app.post("/api/create-manual-order", async (req, res) => {
    try {
      const { items, total, paymentMethod, customerEmail } = req.body;
      
      // Here you would typically save to Firestore
      const orderId = `ORD-${Math.floor(Math.random() * 1000000)}`;
      
      console.log(`Manual order created: ${orderId} for ${customerEmail} via ${paymentMethod}`);
      
      // Send confirmation email if Resend is configured
      if (process.env.RESEND_API_KEY) {
        try {
          await getResend().emails.send({
            from: 'ordini@officinadelsuono.it',
            to: customerEmail,
            subject: `Conferma Ordine #${orderId} - Officina del Suono`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff; border-radius: 10px;">
                <h1 style="color: #F27D26;">Grazie per il tuo ordine!</h1>
                <p>Il tuo ordine <strong>#${orderId}</strong> è stato ricevuto correttamente.</p>
                <p>Metodo di pagamento selezionato: <strong>${paymentMethod}</strong></p>
                <p>Totale: <strong>€${total.toFixed(2)}</strong></p>
                
                ${paymentMethod === 'Bonifico Bancario' ? `
                  <div style="background: #141414; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #333;">
                    <h3 style="color: #F27D26; margin-top: 0;">Dati per il Bonifico:</h3>
                    <p style="margin: 5px 0;">Beneficiario: <strong>Officina del Suono S.r.l.</strong></p>
                    <p style="margin: 5px 0;">IBAN: <strong>IT 00 X 00000 00000 000000000000</strong></p>
                    <p style="margin: 5px 0;">Causale: <strong>Ordine #${orderId}</strong></p>
                  </div>
                ` : `
                  <div style="background: #141414; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #333;">
                    <p style="margin: 0;">Ti contatteremo a breve per fornirti le istruzioni necessarie per completare il pagamento tramite <strong>${paymentMethod}</strong>.</p>
                  </div>
                `}
                
                <p style="color: #888; font-size: 14px; margin-top: 30px;">Ti avviseremo non appena l'ordine verrà elaborato e spedito.</p>
              </div>
            `
          });
        } catch (emailError) {
          console.error("Error sending manual order email:", emailError);
        }
      }

      res.json({ success: true, orderId });
    } catch (error: any) {
      console.error("Manual Order Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false, // Explicitly disable HMR
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler to ensure JSON responses for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('API Error:', err);
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    } else {
      next(err);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
