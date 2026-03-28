from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class Location(BaseModel):
    city: str
    state: Optional[str] = None
    country: str
    lat: Optional[float] = None
    lon: Optional[float] = None

class ShipmentInput(BaseModel):
    user_email: str = Field(description="Email of user requesting shipment")
    source: Location
    destination: Location
    mode: str = Field(description="Mode of transport: road, air, sea, rail")
    shipment_type: str = Field(description="Fragile, bulk, standard, etc.")
    departure_time: datetime
    deadline: datetime
    priorities: List[str] = Field(default_factory=list)

class IntelligentShipmentInput(BaseModel):
    user_email: str
    source_query: str
    destination_query: str
    mode: str
    shipment_type: str
    departure_time: str
    deadline: str
    priorities: List[str] = Field(default_factory=list)

class Option(BaseModel):
    mode: str
    cost: float
    time_hours: float
    risk_score: float
    recommendation: str

class RouteResult(BaseModel):
    shipment_id: str
    classification: str
    activated_agents: List[str]
    best_route_description: str
    composite_risk_score: float
    transport_options: List[Option]
    routes: List[dict] = Field(default_factory=list)
    status: str
    source_parsed: Optional[Location] = None
    destination_parsed: Optional[Location] = None