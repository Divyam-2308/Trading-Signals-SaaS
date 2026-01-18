# Trading Signals SaaS

A full-stack SaaS application for stock trading signals with JWT authentication, Stripe payments, and Redis caching.

## 🔗 Live Demo

- **Frontend:** [https://trading-signals-saas.vercel.app](https://trading-signals-saas.vercel.app)
- **Backend API:** [https://trading-signals-saas.onrender.com](https://trading-signals-saas.onrender.com)
- **Video Demo:** [Watch on Google Drive](https://drive.google.com/file/d/1wFcIRiNzEKIHZ9tOakYX9xyLmOq0Rum6/view?usp=sharing)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, SQLAlchemy, SQLite |
| Frontend | React + Vite |
| Cache | Redis (Upstash) |
| Payments | Stripe |
| Auth | JWT tokens (python-jose) |
| Hosting | Render (Backend), Vercel (Frontend) |

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
2. Free users see 3 signals, Pro users see all 10
3. Signals cached in Redis (5 min TTL)
4. Stripe webhook upgrades user to Pro on payment

## Features

- ✅ JWT authentication (signup/login)
- ✅ Rate limiting with Redis (5 req/min per IP)
- ✅ Redis caching for signals (5 min TTL)
- ✅ Stripe subscription payments (₹499/month)
- ✅ Webhook idempotency (prevent duplicate processing)
- ✅ Free tier (3 signals) vs Pro tier (10 signals)
- ✅ Subscription expiry tracking

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login, get JWT | No |
| GET | `/auth/me` | Get current user | Yes |
| GET | `/signals/` | Get market signals | Yes |
| POST | `/billing/create-checkout-session` | Start Stripe checkout | Yes |
| GET | `/billing/status` | Get subscription status | Yes |
| POST | `/billing/webhook` | Stripe webhook handler | No |

## Setup Instructions

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

Tests include:
- Signup endpoint test
- Login endpoint test
- Signals unauthorized access test
- Signals authorized access test

## Project Structure

```
trading-saas/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app + CORS
│   │   ├── auth.py          # JWT utilities
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── models.py        # DB models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── routers/
│   │       ├── auth.py      # auth endpoints + rate limiting
│   │       ├── billing.py   # stripe endpoints + webhooks
│   │       └── signals.py   # signals endpoint + caching
│   ├── tests/
│   │   └── test_api.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       └── Dashboard.jsx
    ├── vercel.json
    └── package.json
```

## Practical Challenges Addressed

### Webhook Idempotency
To prevent duplicate subscription upgrades when Stripe retries webhooks:

```python
# check if already processed
event_id = event['id']
if redis.get(f"webhook:{event_id}"):
    return {"status": "already_processed"}

redis.setex(f"webhook:{event_id}", 86400, "processed")
```

Each webhook event ID is stored in Redis for 24 hours.

### Caching Strategy
Signals are cached in Redis to reduce load:

```python
cached = redis.get("market_signals")
if cached:
    return json.loads(cached)

# generate fresh data
signals = generate_market_data()
redis.setex("market_signals", 300, json.dumps(signals))  # 5 min TTL
```

## Deployment Notes

For production on Render/Vercel:

1. Set all environment variables in dashboard
2. Update `MY_DOMAIN` in billing.py to production URL
3. Update CORS origins in main.py
4. Set up Stripe webhook endpoint to production URL

---

Built for Hashtechy Python Full Stack Developer Assignment
