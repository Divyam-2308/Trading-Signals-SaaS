from fastapi import APIRouter, Depends, HTTPException, Request, Header
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from .. import database, models, auth
import stripe
import os
from dotenv import load_dotenv
from upstash_redis import Redis

load_dotenv()

router = APIRouter(
    prefix="/billing",
    tags=["Billing"]
)

# stripe setup
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
PRO_PRICE_ID = os.getenv("STRIPE_PRICE_ID")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET") 

MY_DOMAIN = "https://trading-signals-saas-webapp.vercel.app"

# redis for idempotency
r = Redis(
    url=os.getenv("UPSTASH_REDIS_REST_URL"),
    token=os.getenv("UPSTASH_REDIS_REST_TOKEN")
)

@router.post("/create-checkout-session")
def create_checkout_session(current_user: models.User = Depends(auth.get_current_user)):
    # start stripe checkout
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=current_user.email,
            line_items=[
                {
                    'price': PRO_PRICE_ID,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=MY_DOMAIN + '/dashboard?success=true',
            cancel_url=MY_DOMAIN + '/dashboard?canceled=true',
            metadata={
                "user_id": current_user.id
            }
        )
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        print(f"stripe err: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(database.get_db)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # skip if already processed
    event_id = event['id']
    if r.get(f"webhook:{event_id}"):
        return {"status": "already_processed"}
    
    r.setex(f"webhook:{event_id}", 86400, "processed")

    # payment done - upgrade user
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        customer_email = session['customer_email']
        
        user = db.query(models.User).filter(models.User.email == customer_email).first()
        if user:
            user.is_pro = True
            user.stripe_customer_id = session.get('customer')
            user.stripe_subscription_id = session.get('subscription')
            user.subscription_end_date = datetime.now(timezone.utc) + timedelta(days=30)
            
            db.commit()

    return {"status": "success"}

@router.get("/status")
def get_billing_status(current_user: models.User = Depends(auth.get_current_user)):
    # check sub status
    if current_user.is_pro and current_user.subscription_end_date:
        sub_end = current_user.subscription_end_date
        if sub_end.tzinfo is None:
            sub_end = sub_end.replace(tzinfo=timezone.utc)
        
        is_active = sub_end > datetime.now(timezone.utc)
        
        return {
            "plan": "Pro" if is_active else "Free",
            "is_active": is_active,
            "subscription_end_date": sub_end.isoformat() if is_active else None,
            "stripe_subscription_id": current_user.stripe_subscription_id
        }
    
    return {
        "plan": "Free",
        "is_active": False,
        "subscription_end_date": None
    }