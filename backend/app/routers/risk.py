from fastapi import APIRouter
from app.agents import weather_agent, traffic_agent, news_agent
import math

router = APIRouter()

@router.get("/live")
def get_live_risk(
    src_lat: float = 51.51,
    src_lon: float = -0.13,
    dst_city: str = "",
    dst_lat: float = 51.51,
    dst_lon: float = -0.13,
    mode: str = "road",
    is_international: bool = False
):
    agents_data = []

    # Always run weather + traffic
    w = weather_agent.get_risk(src_lat, src_lon)
    t = traffic_agent.get_risk(src_lat, src_lon)
    agents_data.extend([w, t])

    # Conditional agents
    if is_international:
        agents_data.append(news_agent.get_risk())

    if mode.lower() in ["sea", "ship"]:
        from app.agents import maritime_agent
        agents_data.append(maritime_agent.get_risk(dst_city, dst_lat, dst_lon))

    # Apply the probabilistic formula: P(risk) = 1 - Π(1 - Pᵢ)
    safe_prob = 1.0
    steps = []
    for agent in agents_data:
        factor = max(0.01, 1.0 - agent["risk_score"])
        safe_prob *= factor
        steps.append({
            "agent":       agent["module"],
            "risk_score":  round(agent["risk_score"], 3),
            "safe_factor": round(factor, 4),
            "running_safe_prob": round(safe_prob, 4),
            "explanation": agent["explanation"]
        })

    final_risk = round(1.0 - safe_prob, 4)

    return {
        "agents":           agents_data,
        "formula_steps":    steps,
        "safe_probability": round(safe_prob, 4),
        "composite_risk":   final_risk,
        "composite_pct":    round(final_risk * 100, 1),
        "verdict": (
            "critical"  if final_risk >= 0.80 else
            "high"      if final_risk >= 0.60 else
            "elevated"  if final_risk >= 0.30 else
            "safe"
        )
    }