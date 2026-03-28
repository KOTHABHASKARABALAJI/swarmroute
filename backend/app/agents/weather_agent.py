import urllib.request
import json

def get_risk(lat=51.51, lon=-0.13):
    """Fetches REAL weather data from the free Open-Meteo API."""
    try:
        # Fetching live weather based on exact dynamic coordinates
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read().decode())
        
        current = data.get("current_weather", {})
        temp = current.get("temperature", 20)
        windspeed = current.get("windspeed", 5)
        weathercode = current.get("weathercode", 0)
        
        risk_score = 0.1
        explanation = f"Real-time Live Weather: {temp}°C, Wind: {windspeed}km/h"
        
        if windspeed >= 20:
            risk_score += 0.4
            explanation = f"High winds detected via API: {windspeed}km/h"
        
        if weathercode >= 50:
            risk_score += 0.5
            explanation = f"Precipitation flagged. Live Temp: {temp}°C"
            
        return {"module": "Weather", "risk_score": min(risk_score, 1.0), "explanation": explanation}
    except Exception as e:
        # Fallback if connection fails
        return {"module": "Weather", "risk_score": 0.5, "explanation": "Live Weather Status Unknown — API Unavailable"}
