import sys
import os
sys.path.append(os.getcwd())

from app.models.shipment import ShipmentInput, Location
from app.agents import swarm
from datetime import datetime
import traceback

try:
    s = ShipmentInput(
        user_email="test",
        source=Location(city="L", country="UK", lat=51.51, lon=-0.13),
        destination=Location(city="P", country="FR", lat=48.8, lon=2.3),
        mode="road",
        shipment_type="test",
        departure_time=datetime.now(),
        deadline=datetime.now()
    )
    res = swarm.process_shipment(s)
    print("Success!")
except Exception as e:
    traceback.print_exc()
