import urllib.request
import json
import urllib.error

url = "http://localhost:8000/api/shipments/intelligent"
payload = json.dumps({
    "user_email": "mohithgokul@gmail.com",
    "source_query": "mumbai",
    "destination_query": "guntur",
    "mode": "Road",
    "shipment_type": "Electronics",
    "departure_time": "2026-02-22T14:22:00Z",
    "deadline": "2026-02-22T14:22:00Z"
}).encode('utf-8')

req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as resp:
        print("Success:", resp.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:", e.read().decode())
except Exception as e:
    print("Other Error:", e)
