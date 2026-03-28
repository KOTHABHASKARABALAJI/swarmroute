# app/services/geocoder.py
import urllib.request
import urllib.parse
import json
import os

def geocode(place_name: str):
    """
    Converts a free-text city/address string to lat/lon using TomTom Search API.
    Falls back to Gemini AI for intelligent coordinate estimation if TomTom key is absent.
    """
    api_key = os.getenv("TOMTOM_API_KEY")
    
    if api_key:
        try:
            query = urllib.parse.quote(place_name)
            url = f"https://api.tomtom.com/search/2/geocode/{query}.json?key={api_key}&limit=1"
            req = urllib.request.Request(url, headers={"User-Agent": "SwarmRouteApp/1.0"})
            
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
            
            results = data.get("results", [])
            if results:
                pos = results[0]["position"]
                addr = results[0].get("address", {})
                return {
                    "lat": pos["lat"],
                    "lon": pos["lon"],
                    "city": addr.get("municipality", place_name.split(",")[0].strip()),
                    "country": addr.get("countryCode", "Unknown"),
                    "display": addr.get("freeformAddress", place_name)
                }
        except Exception as e:
            print(f"⚠️ TomTom Geocoding error: {e}")

    # Fallback: Use Gemini to estimate coordinates from city name
    from app.services.ai import ask_gemini
    prompt = f"""Return the latitude, longitude, city name, and 2-letter country code for: "{place_name}"
Respond ONLY in this exact JSON format, no markdown:
{{"lat": 0.0, "lon": 0.0, "city": "CityName", "country": "XX"}}"""
    
    raw = ask_gemini(prompt, json.dumps({"lat": 40.71, "lon": -74.01, "city": place_name, "country": "US"}))
    try:
        clean = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        return {
            "lat": float(result["lat"]),
            "lon": float(result["lon"]),
            "city": result.get("city", place_name),
            "country": result.get("country", "Unknown"),
            "display": f"{result.get('city', place_name)}, {result.get('country', '??')}"
        }
    except Exception:
        return {"lat": 40.71, "lon": -74.01, "city": place_name, "country": "Unknown", "display": place_name}