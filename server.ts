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

      const { data, error } = await getResend().emails.send({
        from: 'onboarding@resend.dev', // Fallback for testing. In production, use your verified domain.
        to: email,
        subject: '🎧 Sei dentro! Benvenuto nell\'Officina del Suono',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto in Officina del Suono</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #141414; border-radius: 16px; overflow: hidden; max-width: 600px; width: 100%; border: 1px solid #333333;">
          <!-- Header Image -->
          <tr>
            <td>
              <img src="https://images.unsplash.com/photo-1516280440502-65f67524650b?q=80&w=1200&auto=format&fit=crop" alt="DJ Controller" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #F27D26; font-size: 28px; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">Sei dentro. Benvenuto nel Club.</h1>
              
              <p style="font-size: 16px; line-height: 1.6; color: #e5e5e5; margin-bottom: 20px;">
                Ciao! Hai appena fatto il primo passo per portare il tuo sound al livello successivo. In <strong>Officina del Suono</strong> non ci limitiamo a parlare di attrezzatura; viviamo e respiriamo musica elettronica, djing e produzione.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #e5e5e5; margin-bottom: 30px;">
                Ecco cosa puoi aspettarti di ricevere direttamente nella tua casella di posta:
              </p>
              
              <!-- Features List -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                <tr>
                  <td width="30" valign="top" style="padding-bottom: 15px;"><span style="font-size: 20px;">🔥</span></td>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #ffffff; font-size: 16px;">Recensioni Senza Filtri:</strong><br>
                    <span style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">Testiamo i controller, i synth e i monitor da studio fino allo sfinimento per dirti cosa vale davvero i tuoi soldi.</span>
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="padding-bottom: 15px;"><span style="font-size: 20px;">💡</span></td>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #ffffff; font-size: 16px;">Tips & Tricks Esclusivi:</strong><br>
                    <span style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">Segreti di produzione, tecniche di mixaggio e guide step-by-step che fanno la differenza in pista e in studio.</span>
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top"><span style="font-size: 20px;">🎁</span></td>
                  <td>
                    <strong style="color: #ffffff; font-size: 16px;">Offerte & Novità in Anteprima:</strong><br>
                    <span style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">Sarai il primo a sapere quando pubblichiamo nuovi contenuti o quando ci sono sconti imperdibili sull'attrezzatura.</span>
                  </td>
                </tr>
              </table>
              
              <!-- Secondary Image -->
              <img src="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=800&auto=format&fit=crop" alt="Music Studio" width="540" style="display: block; width: 100%; max-width: 540px; height: auto; border-radius: 8px; margin-bottom: 30px;" />
              
              <p style="font-size: 16px; line-height: 1.6; color: #e5e5e5; margin-bottom: 30px; text-align: center;">
                Non vediamo l'ora di condividere con te la nostra passione. Nel frattempo, perché non dai un'occhiata ai nostri ultimi articoli?
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://officinadelsuono.it/blog" style="display: inline-block; background-color: #F27D26; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">Leggi il Blog</a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333333;">
              <p style="margin: 0; color: #71717a; font-size: 14px;">
                Alza il volume.<br>
                <strong style="color: #ffffff;">Il team di Officina del Suono</strong>
              </p>
              <p style="margin: 20px 0 0 0; color: #52525b; font-size: 12px;">
                Hai ricevuto questa email perché ti sei iscritto alla newsletter di Officina del Suono.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
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
