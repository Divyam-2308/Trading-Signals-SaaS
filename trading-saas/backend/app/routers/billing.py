from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from .. import database, models, auth
import stripe
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/billing",
    tags=["Billing"]
)

# setting up stripe config
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
PRO_PRICE_ID = os.getenv("STRIPE_PRICE_ID")

MY_DOMAIN = "http://localhost:5173"

@router.post("/create-checkout-session")
def create_checkout_session(current_user: models.User = Depends(auth.get_current_user)):
    # creates stripe checkout page for upgrading to pro plan
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
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, endpoint_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # retrieve the user_id we attached in metadata
        user_id = session.get('metadata', {}).get('user_id')

        if user_id:
            print(f"💰 Payment received for user_id: {user_id}")

            # update database
            db = database.SessionLocal()
            try:
                user = db.query(models.User).filter(models.User.id == int(user_id)).first()
                if user:
                    user.is_pro = True
                    user.stripe_customer_id = session.get('customer')
                    db.commit()
                    print(f"✅ User {user.email} upgraded to Pro.")
            finally:
                db.close()

    return {"status": "success"}

