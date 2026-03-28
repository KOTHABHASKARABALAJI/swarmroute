from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from datetime import datetime
from app.agents import weather_agent, traffic_agent, news_agent
from app.services import db
import json

router = APIRouter()

@router.websocket("/live/{shipment_id}")
async def live_tracking(websocket: WebSocket, shipment_id: str):
    await websocket.accept()
    
    try:
        # Secure properties from database
        from app.services import db
        row = db.get_shipment_by_id(shipment_id)

        source_info = json.loads(row[0]) if row else {}
        dest_info = json.loads(row[1]) if row else {}
        mode = row[2] if row else "road"
        
        is_intl = source_info.get("country", "").lower() != dest_info.get("country", "").lower()
        is_ocean = mode.lower() in ['ship', 'sea']

        while True:
            # Poll Real-Time APIs Location-Aware
            agents_data = []
            
            w = weather_agent.get_risk(source_info.get("lat", 51.51), source_info.get("lon", -0.13))
            t = traffic_agent.get_risk(source_info.get("lat", 51.51), source_info.get("lon", -0.13))
            agents_data.extend([w, t])
            
            if is_intl:
                agents_data.append(news_agent.get_risk())
            if is_ocean:
                from app.agents import maritime_agent
                agents_data.append(maritime_agent.get_risk(dest_info.get("city", "Unknown"), dest_info.get("lat", 51.51), dest_info.get("lon", -0.13)))
                
            # Perform Probabilistic Pi Mathematics (P(total risk) = 1 - Π (1 - Pi))
            total_safe_prob = 1.0
            agent_breakdown = {}
            for a in agents_data:
                # Math ceiling limits preventing absolute 100% total wipeout anomalies
                total_safe_prob *= max(0.01, 1.0 - a["risk_score"])
                agent_breakdown[a["module"]] = round(a["risk_score"], 3)
            
            new_risk = round(1.0 - total_safe_prob, 3)
            
            # 🧠 AI Rerouting Decision Engine — Gemini reasons about whether rerouting is warranted
            from app.services.ai import should_reroute
            decision = should_reroute(
                agent_breakdown=agent_breakdown,
                composite_risk=new_risk,
                mode=mode,
                source=f"{source_info.get('city', '?')}, {source_info.get('country', '?')}",
                destination=f"{dest_info.get('city', '?')}, {dest_info.get('country', '?')}"
            )
            
            rerouted = decision["reroute"]
            ai_reason = decision["reason"]
                
            explanations = [a["explanation"] for a in agents_data if a["risk_score"] > 0.3]
            agent_details = " | ".join(explanations) if explanations else ""
            
            if rerouted:
                message = f"🔄 AI Reroute: {ai_reason}" + (f" [{agent_details}]" if agent_details else "")
            else:
                message = ai_reason if new_risk > 0.3 else "Protocol nominal. Active tracing normal."
                
            event_type = "alert" if rerouted else "route_update"
            
            timestamp = datetime.utcnow().isoformat()
            
            db.log_risk(shipment_id, timestamp, new_risk, event_type, message)
            
            await websocket.send_json({
                "shipment_id": shipment_id,
                "current_risk_score": new_risk,
                "agent_breakdown": agent_breakdown,
                "event": event_type,
                "message": message,
                "timestamp": timestamp,
                "rerouted": rerouted,
                "ai_decision_reason": ai_reason
            })
            
            await asyncio.sleep(4)
            
    except WebSocketDisconnect:
        print(f"Tracking Socket Terminated for shipment {shipment_id}")
