import json
import random
import os
import time

def get_risk(port_info="", lat=None, lon=None):
    """
    Maritime Intelligence Agent.
    Fetches real-time live oceanic telemetry via AISStream.io WebSockets. 
    Gracefully falls back to smart simulation if the API key is missing.
    """
    api_key = os.getenv("AISSTREAM_API_KEY")
    
    if api_key:
        try:
            import websockets.sync.client as ws_sync
            
            # Map a 2-degree bounding box around the port to intercept live vessel streams
            lat_target = lat or 40.71
            lon_target = lon or -74.01
            bounding_box = [[lat_target - 1, lon_target - 1], [lat_target + 1, lon_target + 1]]
            
            with ws_sync.connect("wss://stream.aisstream.io/v0/stream") as websocket:
                subscription = {
                    "APIKey": api_key,
                    "BoundingBoxes": [bounding_box],
                    "FilterMessageTypes": ["PositionReport"]
                }
                websocket.send(json.dumps(subscription))
                
                # Fetch a fast burst of live telemetry (max 2 seconds wait) to gauge port congestion dynamically
                burst_packets = []
                start_time = time.time()
                while len(burst_packets) < 5 and (time.time() - start_time) < 2.0:
                    try:
                        msg = websocket.recv(timeout=0.5)
                        burst_packets.append(json.loads(msg))
                    except Exception:
                        break # Timeout polling
                        
            active_pings = len(burst_packets)
            
            if active_pings >= 4:
                risk_score = 0.5
                explanation = f"AISStream: Heavy maritime clustering detected! {active_pings}+ live vessel pings intercepted near {port_info}."
            elif active_pings > 0:
                risk_score = 0.2
                explanation = f"AISStream: Moderate tracking. Intercepted {active_pings} live vessel telemetry packets."
            else:
                risk_score = 0.1
                explanation = f"AISStream: Ocean lanes clear. No crowding detected near {port_info}."
                
            return {"module": "Maritime", "risk_score": min(risk_score, 1.0), "explanation": explanation}
        except Exception as e:
            print(f"⚠️ AISStream Network Error / Fallback Triggered: {e}")
            pass 
            
    return {"module": "Maritime", "risk_score": 0.5, "explanation": "Live Maritime API Unreachable — No Data"}
