import urllib.request
import urllib.parse
import json
import random
import os

def get_risk(query="logistics port strike disrupt"):
    """
    Fetches real-time Geopolitical & Supply Chain news using NewsAPI.org
    Gracefully falls back to smart simulation if the API key is not mapped.
    """
    api_key = os.getenv("NEWS_API_KEY") 
    
    if api_key:
        try:
            url = f"https://newsapi.org/v2/everything?q={urllib.parse.quote(query)}&sortBy=publishedAt&apiKey={api_key}"
            req = urllib.request.Request(url, headers={'User-Agent': 'SwarmRouteApp/1.0'})
            
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                
            articles = data.get("articles", [])
            if len(articles) > 0:
                # Use Gemini AI to intelligently score news severity
                headline = articles[0].get("title", "")
                description = articles[0].get("description", "")
                
                from app.services.ai import score_news_severity
                severity = score_news_severity(headline, description)
                
                return {
                    "module": "Geopolitics", 
                    "risk_score": severity["score"], 
                    "explanation": f"📰 {headline} — AI Assessment: {severity['reason']}"
                }
            else:
                return {"module": "Geopolitics", "risk_score": 0.1, "explanation": "No geopolitical disruptions reported in press."}
        except Exception as e:
            print(f"⚠️ News API Error / Fallback Triggered: {e}")
            pass

    return {"module": "Geopolitics", "risk_score": 0.5, "explanation": "Live News API Unreachable — No Data"}
