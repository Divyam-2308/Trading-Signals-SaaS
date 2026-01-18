from fastapi import FastAPI
from .routers import auth , signals,billing
from . import models, database
from fastapi.middleware.cors import CORSMiddleware
models.Base.metadata.create_all(bind=database.engine) 
app = FastAPI()

origins = [
    "http://localhost:5173", 
    "http://localhost:3000",
    "https://trading-signals-saas-webapp.vercel.app",
    "https://trading-signals-saas.vercel.app",
    "https://trading-signals-saas.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# routes
app.include_router(auth.router)
app.include_router(signals.router)
app.include_router(billing.router)

@app.get("/")
def root():
    return {"message": "Trading SaaS API is running."}