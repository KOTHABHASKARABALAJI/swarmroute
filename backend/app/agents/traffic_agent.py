import urllib.request
import json
import random
import os

def get_risk(lat=51.51, lon=-0.13):
    """
    Fetches REAL traffic data globally using the TomTom Traffic API. 
    Gracefully falls back to real-world smart simulation if the API key is missing.
    """
    api_key = os.getenv("TOMTOM_API_KEY") # User can inject key here securely
    
    if api_key:
        try:
            url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={lat},{lon}&key={api_key}"
            with urllib.request.urlopen(url, timeout=5) as response:
                data = json.loads(response.read().decode())
                
            flow = data.get("flowSegmentData", {})
            current_speed = flow.get("currentSpeed", 50)
            free_flow_speed = flow.get("freeFlowSpeed", 50)
            
            risk_score = 0.1
            explanation = f"Traffic flowing smoothly at {current_speed}km/h"
            
            # Substantial traffic congestion detected algorithm
            if current_speed < (free_flow_speed * 0.5):
                risk_score += 0.6
                explanation = f"Heavy congestion! Speed dropped to {current_speed}km/h (Normally {free_flow_speed}km/h)"
                
            return {"module": "Traffic", "risk_score": min(risk_score, 1.0), "explanation": explanation}
        except Exception as e:
            # Proceed to mock if network fails
            print(f"⚠️ TomTom Traffic API Error / Fallback Triggered: {e}")
            pass 
            
    return {"module": "Traffic", "risk_score": 0.5, "explanation": "Live Traffic Status Unknown — API Unavailable / Key Expired"}
