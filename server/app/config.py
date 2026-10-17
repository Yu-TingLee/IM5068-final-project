import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./data.db")

CLIENT_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CLIENT_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
