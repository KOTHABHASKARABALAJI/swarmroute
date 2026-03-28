from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import shipment, tracking, auth

app = FastAPI(
    title="SwarmRoute AI",
    description="An Adaptive Multi-Agent Logistics Routing System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/map")
def serve_map():
    return FileResponse("app/static/map.html")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(shipment.router, prefix="/api/shipments", tags=["Shipments"])
app.include_router(tracking.router, prefix="/api/tracking", tags=["Tracking"])

@app.get("/api/geocode")
def geocode_city(q: str = ""):
    """Resolve any free-text city name to lat/lon coordinates"""
    if not q.strip():
        return {"error": "Query parameter 'q' is required"}
    from app.services.geocoder import geocode
    return geocode(q.strip())

@app.get("/")
def read_root():
    return {"message": "Welcome to SwarmRoute AI API!"}

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
