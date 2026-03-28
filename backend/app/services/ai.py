# app/services/ai.py
# Shared AI Intelligence Layer using Google Gemini API (Free Tier)
import urllib.request
import json
import os

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def ask_gemini(prompt: str, fallback: str = "") -> str:
    """
    Sends a prompt to Google Gemini and returns the text response.
    Falls back gracefully if the API key is missing or the call fails.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback

    try:
        url = f"{GEMINI_API_URL}?key={api_key}"
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 300
            }
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "SwarmRouteApp/1.0"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print(f"⚠️ Gemini API Error: {e}")
        return fallback


def score_news_severity(headline: str, description: str = "") -> dict:
    """
    Uses Gemini to intelligently score a news headline's impact on logistics (0.0–1.0).
    Returns {"score": float, "reason": str}
    """
    prompt = f"""You are a logistics risk analyst. Score this news headline's impact on 
global shipping and logistics operations on a scale of 0.0 to 1.0.

Rules:
- 0.0-0.2: No impact (routine inspections, minor delays)
- 0.2-0.5: Low impact (weather advisories, minor protests)  
- 0.5-0.7: Moderate impact (port congestion, regional conflicts)
- 0.7-0.9: High impact (strikes, major storms, trade sanctions)
- 0.9-1.0: Critical (port closures, wars, natural disasters)

Headline: {headline}
Description: {description}

Respond ONLY in this exact JSON format, no markdown:
{{"score": 0.0, "reason": "one sentence explanation"}}"""

    fallback = json.dumps({"score": 0.5, "reason": "Unable to assess — moderate default applied"})
    raw = ask_gemini(prompt, fallback)

    try:
        # Strip any markdown formatting Gemini might add
        clean = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        return {"score": min(1.0, max(0.0, float(result["score"]))), "reason": result.get("reason", "")}
    except Exception:
        return {"score": 0.5, "reason": "Live AI Parsing Unavailable — Status Unknown"}


def generate_route_explanation(agents_data: list, best_route: dict, routes: list, 
                                source: str, destination: str, risk_score: float) -> str:
    """
    Uses Gemini to synthesize all agent outputs into a single, clear,
    human-readable route recommendation explanation.
    """
    agent_summary = "\n".join([
        f"- {a['module']} Agent: risk={a['risk_score']}, detail=\"{a['explanation']}\""
        for a in agents_data
    ])

    route_summary = "\n".join([
        f"- {r.get('type','Route')}: {r.get('distance',0)}km, {r.get('time_hours',0)}h, ${r.get('cost',0)}, risk={r.get('risk',0)}"
        for r in routes
    ])

    prompt = f"""You are the SwarmRoute AI logistics advisor. Based on the following agent intelligence 
and route analysis, write a single concise paragraph (2-3 sentences max) explaining the route recommendation.

Shipment: {source} → {destination}
Composite Risk Score: {risk_score}

Agent Intelligence:
{agent_summary}

Available Routes:
{route_summary}

Selected Best Route: {best_route.get('type', 'Primary')} ({best_route.get('distance',0)}km, {best_route.get('time_hours',0)}h)

Write a clear, professional explanation like a logistics analyst would. 
Be specific about WHY this route was chosen and what risks were avoided. No markdown formatting."""

    fallback = f"{best_route.get('type','Primary')} route selected — composite risk {risk_score:.1%}. "
    fallback += " | ".join([a["explanation"] for a in agents_data if a["risk_score"] > 0.3]) or "Route optimized normally."

    return ask_gemini(prompt, fallback)


def should_reroute(agent_breakdown: dict, composite_risk: float,
                   mode: str, source: str, destination: str) -> dict:
    """
    Uses Gemini to reason about whether dynamic rerouting is warranted.
    Returns {"reroute": bool, "reason": str}
    """
    breakdown_str = "\n".join([
        f"- {name}: P = {score:.0%}" for name, score in agent_breakdown.items()
    ])

    prompt = f"""You are the SwarmRoute AI rerouting engine. Decide whether this active shipment 
should be dynamically rerouted based on the current live risk telemetry.

Shipment: {source} → {destination}
Transport Mode: {mode}
Composite Risk (P(total) = 1 - Π(1-Pi)): {composite_risk:.1%}

Live Agent Risk Breakdown:
{breakdown_str}

Decision rules you must reason about:
1. If composite risk > 80% AND multiple agents flag high risk → REROUTE
2. If only one agent is high but others are low → probably DON'T reroute (isolated spike)
3. If weather is the dominant risk and it's sea/air transport → REROUTE (dangerous)
4. If traffic is the only high risk on road transport → DON'T reroute (congestion clears)
5. If geopolitics risk is high → REROUTE (unpredictable escalation)
6. Consider cost of rerouting — only recommend if risk clearly justifies the disruption

Respond ONLY in this exact JSON format, no markdown:
{{"reroute": true, "reason": "one sentence explanation of your decision"}}"""

    fallback_reroute = composite_risk > 0.70
    fallback = json.dumps({
        "reroute": fallback_reroute,
        "reason": f"Threshold fallback — composite risk {'exceeds' if fallback_reroute else 'within'} safety limits"
    })

    raw = ask_gemini(prompt, fallback)

    try:
        clean = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        return {"reroute": bool(result.get("reroute", False)), "reason": result.get("reason", "")}
    except Exception:
        return {"reroute": fallback_reroute, "reason": "AI parse fallback — threshold logic applied"}

def plan_shipment_context(source: str, destination: str, departure: str, deadline: str, mode: str) -> dict:
    """ Uses Gemini to extract and properly geocode origin and destination using context. """
    import urllib.parse
    prompt = f"""You are an advanced global logistics AI and geocoder. 
The user wants to ship goods from '{source}' to '{destination}' via '{mode}' transport.

Your tasks:
1. Identify the exact City, State/Province, and Country for both the source and destination. Resolve any ambiguity based on global knowledge (e.g., 'New York' is in New York state, United States, not Japan).
2. Provide precise geographic coordinates (latitude and longitude) for both locations.
3. Suggest 2-3 possible high-level routing options between these locations (e.g., 'Direct Air Freight', 'Pacific Ocean Route', 'Transcontinental Highway').

Respond ONLY in this exact JSON format (no markdown, no backticks, no extra text):
{{
  "source": {{"city": "CityName", "state": "StateName", "country": "CountryName", "lat": 0.0, "lon": 0.0}},
  "destination": {{"city": "CityName", "state": "StateName", "country": "CountryName", "lat": 0.0, "lon": 0.0}},
  "possible_routes": [
    {{"name": "Route 1", "description": "Description of route 1"}}
  ]
}}"""
    
    raw = ask_gemini(prompt, "")
    try:
        clean = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        if "source" in result and "destination" in result:
            return result
    except Exception:
        pass
        
    # Free OpenStreetMap Geocoding Fallback if Gemini is unavailable
    def fetch_nom(q):
        import re
        q_norm = re.sub(r'(?i)new\s*york', 'New York', q)
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q_norm)}&format=json&limit=1&accept-language=en"
            req = urllib.request.Request(url, headers={"User-Agent": "SwarmRouteAI-Local/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                if data:
                    display_name = data[0].get("display_name", "")
                    parts = [p.strip() for p in display_name.split(",")]
                    country = parts[-1] if len(parts) > 0 else "Unknown"
                    state = parts[-2] if len(parts) > 1 else "Unknown"
                    return {"city": data[0].get("name", q), "state": state, "country": country, "lat": float(data[0]["lat"]), "lon": float(data[0]["lon"])}
        except Exception:
            pass
        return {"city": q, "state": "Unknown", "country": "Unknown", "lat": 0.0, "lon": 0.0}

    return {
        "source": fetch_nom(source),
        "destination": fetch_nom(destination),
        "possible_routes": []
    }