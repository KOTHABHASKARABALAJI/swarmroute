from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import db

router = APIRouter()

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(req: AuthRequest):
    success = db.create_user(req.email, req.password)
    if not success:
        raise HTTPException(status_code=400, detail="Email already registered")
    return {"message": "Account created successfully", "email": req.email}

@router.post("/login")
def login(req: AuthRequest):
    user = db.get_user(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"message": "Successfully logged in", "email": user["email"]}
