# Spec-Driven Development

## Principle

Write the API specification BEFORE any implementation.
The spec is the single source of truth for all data contracts.

## Workflow

### Step 1: Write OpenAPI 3.1 Spec

Before implementing any endpoint or data model, create or update the OpenAPI spec:

```yaml
openapi: 3.1.0
info:
  title: Officina del Suono API
  version: 1.0.0
  description: Backend API for DJ equipment e-commerce platform

servers:
  - url: http://localhost:3000
    description: Development
  - url: https://officinadelsuono-87986.web.app
    description: Production

paths:
  /api/products:
    get:
      summary: List all products
      responses:
        '200':
          description: Array of products
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Product'

  /api/upload:
    post:
      summary: Upload files to Cloud Storage
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                files:
                  type: array
                  items:
                    type: string
                    format: binary
      responses:
        '200':
          description: Upload URLs
          content:
            application/json:
              schema:
                type: object
                properties:
                  urls:
                    type: array
                    items:
                      type: string

components:
  schemas:
    Product:
      type: object
      required: [name, category, price]
      properties:
        id:
          type: string
        name:
          type: string
          minLength: 1
          maxLength: 100
        category:
          type: string
          minLength: 1
          maxLength: 50
        price:
          type: number
          minimum: 0
        image:
          type: string
          maxLength: 800000
        images:
          type: array
          maxItems: 5
          items:
            type: string
        badge:
          type: string
          maxLength: 50
        specs:
          type: object
        createdAt:
          type: string
```

### Step 2: Generate TypeScript Types

Use `openapi-typescript` to generate types from the spec:

```bash
npx openapi-typescript specs/openapi.yaml -o src/types/api.ts
```

This ensures frontend and backend always agree on data shapes.

### Step 3: Mock Server

For frontend development, run a mock server from the spec:

```bash
npx prism mock specs/openapi.yaml
```

This allows FrontendAgent to develop against realistic API responses
before BackendAgent finishes implementation.

### Step 4: Contract Tests

At deploy time, verify that the actual API matches the spec:

```typescript
// Contract test example
import { openapi } from '../specs/openapi.yaml';

describe('API Contract Tests', () => {
  it('GET /api/products returns valid Product[]', async () => {
    const response = await fetch('/api/products');
    const data = await response.json();
    
    // Validate response against OpenAPI schema
    expect(validateAgainstSchema(data, openapi.components.schemas.Product))
      .toBe(true);
  });
});
```

## Existing Data Models (officinadelsuono)

Based on `firestore.rules`, the current data models are:

### Product
| Field | Type | Required | Constraints |
|---|---|---|---|
| name | string | Yes | 1-100 chars |
| category | string | Yes | 1-50 chars |
| price | number | Yes | >= 0 |
| image | string | No | < 800KB |
| images | array | No | max 5 items |
| badge | string | No | < 50 chars |
| specs | map | No | - |
| createdAt | string | No | - |

### User
| Field | Type | Required | Constraints |
|---|---|---|---|
| email | string | Yes | 1-100 chars |
| role | string | Yes | 'admin' or 'user' |

### Review
| Field | Type | Required | Constraints |
|---|---|---|---|
| productId | string | Yes | 1-100 chars |
| userId | string | Yes | Must match auth.uid |
| userName | string | Yes | 1-100 chars |
| rating | number | Yes | 1-5 |
| text | string | Yes | max 1000 chars |
| createdAt | string | Yes | - |

### NewsletterSubscription
| Field | Type | Required | Constraints |
|---|---|---|---|
| email | string | Yes | 1-100 chars |
| privacyConsent | boolean | Yes | Must be true |
| timestamp | string | Yes | - |
| marketingConsent | boolean | No | - |
| source | string | No | - |

### ErrorLog
| Field | Type | Required | Constraints |
|---|---|---|---|
| message | string | Yes | < 2000 chars |
| timestamp | string | Yes | - |
| stack | string | No | < 5000 chars |
| url | string | No | < 500 chars |
| userAgent | string | No | < 500 chars |

## Rules

1. NEVER implement an endpoint without first defining it in the spec
2. NEVER add fields to a Firestore document without updating the spec AND rules
3. ALWAYS generate types after spec changes
4. ALWAYS run contract tests before deploy
5. Spec changes require ArchAgent review
