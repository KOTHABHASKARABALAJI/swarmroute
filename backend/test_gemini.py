import os, sys, urllib.request, json
sys.path.append('.')
from dotenv import load_dotenv; load_dotenv('.env')

api_key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
prompt = "Hello"
payload = json.dumps({
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 300}
}).encode("utf-8")

try:
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json", "User-Agent": "A"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(resp.read().decode())
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
