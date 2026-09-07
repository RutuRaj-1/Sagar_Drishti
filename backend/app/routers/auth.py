from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Local demo user database
DEMO_USERS = {
    "student": {
        "username": "student",
        "password": "student123",
        "name": "Arjun Sharma",
        "role": "student",
        "email": "arjun.student@incois.gov.in",
        "avatar": "🎓",
        "title": "Ocean Explorer & Student"
    },
    "forecaster": {
        "username": "forecaster",
        "password": "forecast123",
        "name": "Dr. Aditi Verma",
        "role": "forecaster",
        "email": "aditi.verma@incois.gov.in",
        "avatar": "⚓",
        "title": "Senior Oceanographer & Duty Forecaster"
    }
}

class LoginRequest(BaseModel):
    username: str
    password: str
    preferred_role: Optional[str] = "student"

class AuthResponse(BaseModel):
    success: bool
    token: str
    user: Dict[str, str]
    message: str

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    username = req.username.strip().lower()
    user_info = DEMO_USERS.get(username)
    
    if not user_info or user_info["password"] != req.password:
        # Fallback dynamic user generation if password matches role convention
        if req.password in ["student123", "forecast123", "demo123"]:
            role = req.preferred_role if req.preferred_role in ["student", "forecaster"] else "student"
            user_info = {
                "username": username,
                "password": req.password,
                "name": username.capitalize(),
                "role": role,
                "email": f"{username}@sagar-drishti.in",
                "avatar": "🎓" if role == "student" else "⚓",
                "title": "Student / Explorer" if role == "student" else "Duty Forecaster"
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = f"sd_token_{user_info['username']}_{user_info['role']}"
    return {
        "success": True,
        "token": token,
        "user": {
            "username": user_info["username"],
            "name": user_info["name"],
            "role": user_info["role"],
            "email": user_info["email"],
            "avatar": user_info["avatar"],
            "title": user_info["title"]
        },
        "message": f"Successfully authenticated as {user_info['role']}"
    }

@router.post("/logout")
def logout():
    return {"success": True, "message": "Logged out successfully"}

@router.get("/me")
def get_current_user(x_user_role: Optional[str] = Header(None, alias="X-User-Role")):
    role = x_user_role if x_user_role in ["student", "forecaster"] else "guest"
    if role == "guest":
        return {
            "authenticated": False,
            "user": {
                "username": "guest",
                "name": "Guest Explorer",
                "role": "guest",
                "email": "guest@sagar-drishti.in",
                "avatar": "🌐",
                "title": "Public Visitor"
            }
        }
    
    user_data = DEMO_USERS.get(role, DEMO_USERS["student"])
    return {
        "authenticated": True,
        "user": {
            "username": user_data["username"],
            "name": user_data["name"],
            "role": user_data["role"],
            "email": user_data["email"],
            "avatar": user_data["avatar"],
            "title": user_data["title"]
        }
    }
