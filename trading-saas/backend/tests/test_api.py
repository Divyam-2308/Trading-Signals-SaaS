import pytest
import sys
import os

# path fix for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

# setup db
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_signup():
    # basic signup test
    response = client.post("/auth/signup", json={
        "email": "newuser@example.com",
        "password": "testpassword123"
    })
    assert response.status_code in [200, 400]  # 400 = already exists
    if response.status_code == 200:
        assert "email" in response.json()

def test_login():
    # create user first
    client.post("/auth/signup", json={
        "email": "logintest@example.com",
        "password": "testpass123"
    })
    
    # now try login
    response = client.post("/auth/login", data={
        "username": "logintest@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_signals_unauthorized():
    # no token = 401
    response = client.get("/signals")
    assert response.status_code == 401

def test_signals_authorized():
    # signup + login
    client.post("/auth/signup", json={
        "email": "signaltest@example.com",
        "password": "testpass123"
    })
    
    login_res = client.post("/auth/login", data={
        "username": "signaltest@example.com",
        "password": "testpass123"
    })
    token = login_res.json()["access_token"]
    
    # hit signals with token
    response = client.get("/signals", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    assert "data" in response.json()
    assert response.json()["plan"] == "Free"