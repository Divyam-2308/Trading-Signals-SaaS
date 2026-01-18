# Trading Signals SaaS

A full-stack SaaS platform for stock trading signals with user authentication, Stripe payments, and Redis caching.

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, SQLite
- **Frontend:** React + Vite
- **Cache:** Redis (Upstash)
- **Payments:** Stripe
- **Auth:** JWT tokens

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   React     │────▶│    FastAPI       │────▶│   SQLite    │
│  Frontend   │◀────│    Backend       │     │   Database  │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │  Redis   │  │  Stripe  │
              │ (Cache)  │  │ Payments │
              └──────────┘  └──────────┘
```

**Flow:**
1. User signs up/logs in → JWT token issued
2. Free users see 5 signals, Pro users see all 10
3. Signals cached in Redis (5 min TTL)
4. Stripe webhook upgrades user to Pro on payment

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Stripe CLI (for webhook testing)

### Backend Setup

```bash
cd trading-saas/backend

# create virtual env
python -m venv venv
venv\Scripts\activate  # windows
# source venv/bin/activate  # mac/linux

# install deps
pip install -r requirements.txt
```

Create `.env` file in project root:
```env
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./trading_saas.db
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Run backend:
```bash
uvicorn app.main:app --reload
```

Backend runs on http://localhost:8000

### Frontend Setup

```bash
cd trading-saas/frontend

npm install
npm run dev
```

Frontend runs on http://localhost:5173

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login, get JWT | No |
| GET | `/auth/me` | Get current user | Yes |
| GET | `/signals` | Get market signals | Yes |
| POST | `/billing/create-checkout-session` | Start Stripe checkout | Yes |
| GET | `/billing/status` | Get subscription status | Yes |
| POST | `/billing/webhook` | Stripe webhook handler | No |

## Testing Stripe Webhooks

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:8000/billing/webhook
```

4. Copy the webhook secret (starts with `whsec_`) to your `.env`

5. Make a test payment in the app - webhook should trigger and upgrade user

## Running Tests

```bash
cd trading-saas/backend
python -m pytest tests/test_api.py -v
```

## Features

- [x] JWT authentication (signup/login)
- [x] Rate limiting (5 req/min per IP)
- [x] Redis caching for signals (5 min TTL)
- [x] Stripe subscription payments
- [x] Webhook idempotency (no duplicate processing)
- [x] Free tier (5 signals) vs Pro tier (10 signals)
- [x] Subscription expiry tracking

## Project Structure

```
trading-saas/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app
│   │   ├── auth.py          # JWT utils
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── models.py        # DB models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── routers/
│   │       ├── auth.py      # auth endpoints
│   │       ├── billing.py   # stripe endpoints
│   │       └── signals.py   # signals endpoint
│   ├── tests/
│   │   └── test_api.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       └── Dashboard.jsx
    └── package.json
```

## Webhook Idempotency

To prevent duplicate subscription upgrades when Stripe retries webhooks:

```python
# check if already processed
event_id = event['id']
if redis.get(f"webhook:{event_id}"):
    return {"status": "already_processed"}

redis.setex(f"webhook:{event_id}", 86400, "processed")
```

Each webhook event ID is stored in Redis for 24 hours.

## Caching Strategy

Signals are cached in Redis to reduce load:

```python
cached = redis.get("market_signals")
if cached:
    return json.loads(cached)

# generate fresh data
signals = generate_market_data()
redis.setex("market_signals", 300, json.dumps(signals))  # 5 min TTL
```

## Deployment

For production deployment on Render/Railway:

1. Set all env variables in dashboard
2. Update `MY_DOMAIN` in billing.py to production URL
3. Update CORS origins in main.py
4. Set up Stripe webhook endpoint to production URL

## Demo

Video demo: []

Shows: Signup → Login → View Free Signals → Upgrade to Pro → Payment → View All Signals

---

Built for Hashtechy assignment