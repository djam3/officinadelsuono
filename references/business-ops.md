# Business Operations

## Analytics

### Key Metrics to Track

| Metric | Description | Target |
|---|---|---|
| Page Views | Total page views per day | Growth trend |
| Unique Visitors | Distinct users per day | Growth trend |
| Conversion Rate | Visitors who add to cart / total visitors | >3% |
| Cart Abandonment | Users who add to cart but do not complete order | <70% |
| Average Order Value | Total revenue / number of orders | Increase trend |
| Newsletter Signups | New subscriptions per week | Growth trend |
| Blog Engagement | Average time on blog posts | >2 minutes |
| AI Feature Usage | Number of AI feature interactions | Growth trend |

### Analytics Events

Implement tracking for these events:

```typescript
interface AnalyticsEvent {
  event: string;
  timestamp: string;
  userId?: string;
  properties: Record<string, unknown>;
}

// Key events:
// 'page_view' — { page: string }
// 'product_view' — { productId: string, category: string }
// 'add_to_cart' — { productId: string, price: number }
// 'remove_from_cart' — { productId: string }
// 'begin_checkout' — { cartTotal: number, itemCount: number }
// 'complete_order' — { orderId: string, total: number, method: string }
// 'newsletter_signup' — { source: string }
// 'ai_feature_used' — { feature: string, duration_ms: number }
// 'blog_read' — { postId: string, readTime: number }
// 'quiz_completed' — { results: object }
// 'search' — { query: string, results_count: number }
```

## Pricing Strategy

### Current Model
- Products listed with fixed prices in EUR
- Manual order processing (no automated payment yet)
- Payment methods: Bank transfer, manual processing
- Discount codes managed via admin dashboard

### Pricing Rules
1. All prices displayed include VAT (Italian law)
2. Shipping costs shown separately at checkout
3. Discount codes have expiration dates
4. Bundle pricing for related products
5. Newsletter subscribers get exclusive offers

### Discount Code Schema
```json
{
  "code": "WELCOME10",
  "type": "percentage",
  "value": 10,
  "minOrderValue": 50,
  "maxUses": 100,
  "usedCount": 0,
  "expiresAt": "2026-12-31T23:59:59Z",
  "active": true,
  "applicableCategories": ["all"]
}
```

## Onboarding Flows

### New User Onboarding
1. User visits site -> Cookie consent banner
2. User browses products -> Chatbot offers help
3. User signs up -> Welcome email (Resend) with:
   - Personal greeting
   - Feature highlights (reviews, guides, exclusive offers)
   - CTA to blog and shop
4. User completes first purchase -> Order confirmation email
5. Follow-up: Newsletter with relevant content

### Admin Onboarding
1. Admin accesses `/admin` page
2. Local password authentication (bypassing Firebase Auth)
3. Dashboard overview with key metrics
4. Product management (CRUD)
5. Blog post creation and publishing
6. Newsletter management
7. AI feature configuration

## Email Campaigns

### Automated Emails
| Trigger | Template | Timing |
|---|---|---|
| User registration | Welcome email | Immediate |
| First purchase | Order confirmation | Immediate |
| New blog post | Newsletter broadcast | On publish |
| Cart abandonment | Reminder | 24 hours later |
| Inactive user | Re-engagement | 30 days inactive |

### Email Best Practices
1. Use Resend API for reliable delivery
2. Dark theme emails matching site design (bg: #050505)
3. Brand orange (#F27D26) for CTAs and accents
4. Italian language for all user-facing emails
5. Unsubscribe link in every email (GDPR compliance)
6. Graceful degradation when RESEND_API_KEY is absent

## Revenue Operations

### Order Processing
1. User adds items to cart (Zustand store)
2. User selects payment method (bank transfer, etc.)
3. Manual order created via `/api/create-manual-order`
4. Confirmation email sent
5. Admin reviews and processes order
6. Shipping and fulfillment (manual)

### Future Integrations (Planned)
- Stripe payment processing (API key already in env)
- Automated inventory management
- Shipping provider integration
- Invoice generation
- Return/refund processing
