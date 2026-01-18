from fastapi import FastAPI
from .routers import auth , signals,billing
from . import models, database

models.Base.metadata.create_all(bind=database.engine) 
app = FastAPI()

# Include the Auth Router
app.include_router(auth.router)
app.include_router(signals.router)
app.include_router(billing.router)

@app.get("/")
def root():
    return {"message": "Trading SaaS API is running."}