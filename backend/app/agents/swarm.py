# Agent Orchestration Layer
import random
from app.agents import weather_agent, traffic_agent, news_agent
from app.services import route_engine, db

def generate_multi_modal_options():
    # Helper to satisfy original output
    return [{"mode": "Road", "cost": 500, "time_hours": 48, "risk_score": 15.2, "recommendation": "Safest option"}]

def process_shipment(shipment_input):
    # 2.1 Shipment Management - Save tracking info
    shipment_id = f"SR-{random.randint(1000, 9999)}"
    
    # 2.2 Route Generation
    raw_routes = route_engine.generate_routes(shipment_input.source, shipment_input.destination, shipment_input.mode)
    
    lat = shipment_input.source.lat or 51.51
    lon = shipment_input.source.lon or -0.13
    
    weather = weather_agent.get_risk(lat, lon)
    traffic = traffic_agent.get_risk(lat, lon)
    
    is_international = shipment_input.source.country.lower() != shipment_input.destination.country.lower()
    is_ocean = shipment_input.mode.lower() in ['ship', 'sea']
    
    agents_data = [weather, traffic]
    if is_international:
        agents_data.append(news_agent.get_risk())
    if is_ocean:
        from app.agents import maritime_agent
        d_lat = shipment_input.destination.lat or 40.71
        d_lon = shipment_input.destination.lon or -74.01
        agents_data.append(maritime_agent.get_risk(shipment_input.destination.city, d_lat, d_lon))
    
    # 🧠 Probabilistic Risk Model: P(total risk) = 1 - Π (1 - Pi)
    total_safe_prob = 1.0
    for a in agents_data:
        total_safe_prob *= max(0.01, 1.0 - a["risk_score"])
    
    base_aggregated_risk = round(1.0 - total_safe_prob, 3)
    
    # Calculate Remaining Time Hours
    from datetime import datetime
    try:
        dep = shipment_input.departure_time.replace(tzinfo=None)
        dl = shipment_input.deadline.replace(tzinfo=None)
        remaining_time_hours = max(1.0, (dl - dep).total_seconds() / 3600.0)
    except Exception:
        remaining_time_hours = 72.0
    
    explanations = [a["explanation"] for a in agents_data if "risk_score" in a and a["risk_score"] > 0.3]
    explanation_text = " | ".join(explanations) if explanations else "Route optimized normally."

    # 2.5 Route Optimization Engine (passing probabilistic risk & time)
    optimized_routes, best_route = route_engine.optimize_routes(raw_routes, base_aggregated_risk, remaining_time_hours)
    
    # 2.10 Database Management (Save shipments, routes, attached to user)
    db.save_shipment(shipment_id, shipment_input.user_email, shipment_input.source.model_dump(), shipment_input.destination.model_dump(), shipment_input.mode)
    
    for r in optimized_routes:
        r["shipment_id"] = shipment_id
    db.save_routes(optimized_routes)
    
    # 2.9 Explainable AI — Generate intelligent route explanation via Gemini
    from app.services.ai import generate_route_explanation
    source_str = f"{shipment_input.source.city}, "
    if hasattr(shipment_input.source, 'state') and getattr(shipment_input.source, 'state') and getattr(shipment_input.source, 'state') != 'Unknown':
        source_str += f"{shipment_input.source.state}, "
    source_str += shipment_input.source.country
        
    dest_str = f"{shipment_input.destination.city}, "
    if hasattr(shipment_input.destination, 'state') and getattr(shipment_input.destination, 'state') and getattr(shipment_input.destination, 'state') != 'Unknown':
        dest_str += f"{shipment_input.destination.state}, "
    dest_str += shipment_input.destination.country

    ai_reasons = generate_route_explanation(
        agents_data=agents_data,
        best_route=best_route,
        routes=optimized_routes,
        source=source_str,
        destination=dest_str,
        risk_score=base_aggregated_risk
    )
    
    return {
        "shipment_id": shipment_id,
        "classification": "International" if is_international else "National/Local",
        "activated_agents": [a["module"] for a in agents_data],
        "best_route_description": ai_reasons,
        "composite_risk_score": base_aggregated_risk,
        "transport_options": generate_multi_modal_options(),
        "routes": optimized_routes,
        "status": "Route Optimized and Monitored"
    }

