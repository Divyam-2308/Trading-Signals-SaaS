from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from .. import models, schemas, auth, database
from upstash_redis import Redis
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix = "/auth",
    tags = ["Authentication"]
)

# redis for rate limiting
r = Redis(
    url=os.getenv("UPSTASH_REDIS_REST_URL"),
    token=os.getenv("UPSTASH_REDIS_REST_TOKEN")
)

def check_rate_limit(request: Request):
    # 5 req/min per ip
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}"
    
    current = r.get(key)
    if current and int(current) >= 5:
        raise HTTPException(status_code=429, detail="Too many requests. Try again later.")
    
    r.incr(key)
    r.expire(key, 60)

@router.post("/signup", response_model=schemas.UserOut)
def signup(user: schemas.UserCreate, request: Request, db: Session = Depends(database.get_db)):
    check_rate_limit(request)
    
    # check if email taken
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # hash pwd and save
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    check_rate_limit(request)
    
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    # wrong creds
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # gen token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user