from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database, auth
from upstash_redis import Redis
from dotenv import load_dotenv
import json
import os
import random

load_dotenv()

router = APIRouter(
    prefix="/signals",
    tags=["Signals"]
)

# connect to upstash redis
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
    # check redis cache first
    cached_data = r.get("market_signals")
    
    if cached_data:
        signals = json.loads(cached_data)
    else:
        # generate and cache for 5 mins
        signals = generate_market_data()
        r.setex("market_signals", 300, json.dumps(signals))
    
    # pro users get all signals, free users get limited
    if current_user.is_pro:
        return {
            "status": "success",
            "plan": "Pro",
            "data": signals
        }
    else:
        return {
            "status": "success",
            "plan": "Free",
            "message": "Upgrade to Pro to see all signals",
            "data": signals[:5]
        }