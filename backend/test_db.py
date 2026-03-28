import os
import sys

# Ensure backend modules can be imported
sys.path.append(os.path.abspath("."))

from app.services import db
import traceback

def test_local_sqlite():
    print("--- Starting Local SQLite DB Test ---")
    try:
        # 1. Test Initialization
        print("Testing init_db()...")
        db.init_db()
        print("Success: init_db()")

        # 2. Test Saving Shipment
        print("Testing save_shipment()...")
        db.save_shipment("TEST-123", "test@user.com", {"city": "Local"}, {"city": "Host"}, "truck")
        print("Success: save_shipment()")

        # 3. Test Reading Shipments
        print("Testing get_user_shipments()...")
        rows = db.get_user_shipments("test@user.com")
        print(f"Success: get_user_shipments() returned {len(rows)} records")

        # 4. Test Saving Routes
        print("Testing save_routes()...")
        db.save_routes([
            {"route_id": "R-1", "shipment_id": "TEST-123", "path": ["A", "B"], "distance": 100, "risk": 0.1, "time_hours": 2, "cost": 50, "type": "Eco"}
        ])
        print("Success: save_routes()")
        
        # 5. Test Reading Routes
        print("Testing get_shipment_routes()...")
        routes = db.get_shipment_routes("TEST-123")
        print(f"Success: get_shipment_routes() returned {len(routes)} records")
        
        # 6. Test Risk Logs
        print("Testing log_risk()...")
        db.log_risk("TEST-123", "2026-03-29", 0.5, "alert", "Testing logs")
        print("Success: log_risk()")
        
        print("\n✅ All Local SQLite Abstractions PASSED Successfully!")
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_local_sqlite()
