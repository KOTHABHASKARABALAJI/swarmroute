# SwarmRoute AI Backend

This is the Python FastAPI backend for the SwarmRoute AI logistics platform.

## Features Supported
1. **Smart Shipment Input System** - REST API (`POST /api/shipments/`)
2. **Automatic Route Classification** - Logic in `swarm.py` classifies Local, National, International.
3. **Multi-Agent Intelligence System** - Context-aware activation of Weather, Traffic, Geopolitical, Infrastructure, and Pollution agents.
4. **Real-Time Risk Scoring Engine** - Composite scoring for routes based on activated agents.
5. **Route Optimization & Multi-Modal Intelligence** - Generates paths for Road, Air, and Sea and recommends the fastest, cheapest, or safest option.
6. **Continuous Monitoring & Live Tracking** - WebSocket API (`WS /api/tracking/live/{shipment_id}`) to simulate real-time disruption detection and dynamic rerouting.

## Local Setup

1. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate
   # Or on Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Server**:
   ```bash
   python main.py
   # Or using uvicorn: uvicorn main:app --reload
   ```

The API documentation will be available at `http://localhost:8000/docs`.
