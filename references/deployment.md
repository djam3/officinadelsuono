# Deployment — Firebase Hosting + Functions

## Environments

| Environment | Project | URL |
|---|---|---|
| Development | Local | `http://localhost:3000` |
| Staging | officinadelsuono-87986 (preview) | Firebase preview channel |
| Production | officinadelsuono-87986 | `https://officinadelsuono-87986.web.app` |

## Development

```bash
# Start development server (Express + Vite middleware)
npm run dev

# This runs: tsx server.ts
# Serves on http://localhost:3000
# Vite HMR is disabled (configured in vite.config.ts)
```

## Build

```bash
# Build production bundle
npm run build

# This runs: vite build
# Output: dist/ directory
```

### Build Verification Checklist
- [ ] Build completes without errors
- [ ] No TypeScript errors (`npm run lint`)
- [ ] Bundle size is reasonable (check dist/ size)
- [ ] No source maps in production build (security)
- [ ] Environment variables are properly injected

## Staging Deploy

```bash
# Deploy to staging (Firebase Hosting preview channel)
npm run build && firebase hosting:channel:deploy staging

# Or deploy to main hosting (staging project)
npm run build && firebase deploy --only hosting --project staging
```

### Staging Verification
- [ ] Site loads correctly at staging URL
- [ ] All pages render without errors
- [ ] Authentication works (Firebase Auth)
- [ ] Firestore reads work (products, reviews)
- [ ] Image uploads work (/api/upload)
- [ ] Email sending works or gracefully degrades
- [ ] Three.js canvas renders properly
- [ ] Responsive design works on mobile viewport

## Production Deploy

```bash
# Full production deployment
firebase deploy --only hosting,firestore:rules --project production

# Or use the convenience script
npm run deploy
# This runs: vite build && firebase deploy --only hosting
```

### Production Deployment Checklist
- [ ] All quality gates passed (see quality-control.md)
- [ ] Staging verification complete
- [ ] Rollback plan documented
- [ ] Database migrations applied (if any)
- [ ] Firestore rules tested
- [ ] No hardcoded development URLs
- [ ] API keys are in environment variables, not in code
- [ ] Error logging is active

## Firebase Configuration

### firebase.json
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

### Firestore Rules Deployment
```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Test rules locally first
firebase emulators:start --only firestore
```

### Cloud Functions Deployment
```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Functions are in functions/index.js
```

## Environment Variables

Required environment variables (configured in `.env` or hosting environment):

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google GenAI API key for AI features |
| `RESEND_API_KEY` | No | Resend API key for email sending |
| `STRIPE_SECRET_KEY` | No | Stripe key for payment processing |
| `APP_URL` | No | Application URL for self-referential links |

### Security Rules
- Never commit `.env` files (covered by `.gitignore`)
- Use Firebase environment config for Cloud Functions
- Validate all env vars at server startup

## Rollback Procedure

If a production deploy causes issues:

```bash
# Option 1: Rollback to previous Firebase Hosting version
firebase hosting:clone officinadelsuono-87986:live officinadelsuono-87986:live --version PREVIOUS_VERSION

# Option 2: Redeploy previous git commit
git checkout <previous-commit>
npm run build && firebase deploy --only hosting

# Option 3: Firebase Console
# Go to Firebase Console > Hosting > Release History
# Click "Rollback" on the previous working version
```

### Rollback Checklist
- [ ] Identify the problematic change
- [ ] Verify previous version works in staging
- [ ] Execute rollback
- [ ] Verify production is restored
- [ ] Log incident to `.loki/memory/episodic/`
- [ ] Create post-mortem task

## Monitoring Post-Deploy

After every deployment, monitor for 30 minutes:

1. Check Firebase Console for error spikes
2. Verify error_logs collection in Firestore
3. Test critical user flows manually
4. Monitor Cloud Function execution logs
5. Check email delivery status in Resend dashboard
