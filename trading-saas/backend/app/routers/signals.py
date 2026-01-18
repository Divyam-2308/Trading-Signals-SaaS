from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .. import models, database, auth
from upstash_redis import Redis
from dotenv import load_dotenv
import os
import json
import random

load_dotenv()

router = APIRouter(
    prefix="/signals",
    tags=["Signals"]
)

# redis cache
r = Redis(
    url=os.getenv("UPSTASH_REDIS_REST_URL"),
    token=os.getenv("UPSTASH_REDIS_REST_TOKEN")
)

def generate_market_data():
    stocks = ["NIFTY 50", "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "LT"]
    signals = []
    for stock in stocks:
        action = random.choice(["BUY", "SELL", "HOLD"])
        price = random.randint(1000, 3000)
        signals.append({
            "id": stock,
            "action": action,
            "price": price,
            "timestamp": "Just Now"
        })
    return signals

@router.get("/")
def get_signals(current_user: models.User = Depends(auth.get_current_user)):
    # try cache first
    cached_data = r.get("market_signals")
    
    if cached_data:
        signals = json.loads(cached_data)
    else:
        signals = generate_market_data()
        r.setex("market_signals", 300, json.dumps(signals))  # 5 min cache
    
    # check if pro is still valid
    is_active_pro = False
    if current_user.is_pro and current_user.subscription_end_date:
        sub_end = current_user.subscription_end_date
        if sub_end.tzinfo is None:
            sub_end = sub_end.replace(tzinfo=timezone.utc)
        
        is_active_pro = sub_end > datetime.now(timezone.utc)
    
    if is_active_pro:
        return {
            "status": "success",
            "plan": "Pro",
            "subscription_end_date": current_user.subscription_end_date.isoformat(),
            "data": signals
        }
    else:
        # free users get 5 only
        return {
            "status": "success",
            "plan": "Free",
            "message": "Upgrade to Pro to see all signals",
            "data": signals[:3]
        }