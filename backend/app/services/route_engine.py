# Route Generation and Optimization Engine
import urllib.request
import urllib.parse
import json
import uuid
import os

# Maps SwarmRoute transport modes to TomTom travelMode values
TRAVEL_MODE_MAP = {
    "road": "car",
    "rail": "car",    # TomTom doesn't have rail natively — car as proxy
    "air":  "car",    # Air routes use road legs to/from airports
    "sea":  "car",    # Sea routes use road legs to/from ports
    "ship": "car",
    "truck": "truck"
}

# Cost estimate per km by mode (USD)
COST_PER_KM = {
    "road": 1.5,
    "rail": 0.8,
    "air":  4.0,
    "sea":  0.4,
    "ship": 0.4,
    "truck": 1.5,
}

ROUTE_TYPES = ["fastest", "shortest", "eco", "thrilling"]


def generate_routes(source, destination, mode):
    """
    Calls TomTom calculateRoute API repeatedly (one per route type)
    to compute real distances, times, and geometric polyline pathways.
    Falls back gracefully to smart mathematical simulation if API key is missing.
    """
    api_key = os.getenv("TOMTOM_API_KEY")

    src_lat = source.lat or 51.51
    src_lon = source.lon or -0.13
    dst_lat = destination.lat or 48.85
    dst_lon = destination.lon or 2.35

    travel_mode = TRAVEL_MODE_MAP.get(mode.lower(), "car")
    cost_rate   = COST_PER_KM.get(mode.lower(), 1.5)

    routes = []

    if api_key:
        # Generate varied AI routing options utilizing TomTom logic
        for route_type in ROUTE_TYPES:
            route = _fetch_tomtom_route(
                api_key, src_lat, src_lon, dst_lat, dst_lon,
                route_type, travel_mode, cost_rate
            )
            if route:
                routes.append(route)

    # If API key missing or network calls failed, switch to intelligent geography fallback
    if not routes:
        print("⚠️ TomTom API unavailable — falling back to mathematical route mock")
        routes = _mock_routes(src_lat, src_lon, dst_lat, dst_lon, cost_rate)

    return routes


def _fetch_tomtom_route(api_key, src_lat, src_lon, dst_lat, dst_lon, route_type, travel_mode, cost_rate):
    """
    Executes an explicit TomTom calculateRoute network socket call and parses response 
    directly into SwarmRoute's normalized routing dict architecture.
    """
    try:
        locations = f"{src_lat},{src_lon}:{dst_lat},{dst_lon}"
        params = urllib.parse.urlencode({
            "routeType":   route_type,
            "travelMode":  travel_mode,
            "traffic":     "true",
            "key":         api_key
        })
        url = f"https://api.tomtom.com/routing/1/calculateRoute/{locations}/json?{params}"

        req = urllib.request.Request(
            url, headers={"User-Agent": "SwarmRouteApp/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())

        tomtom_route = data["routes"][0]
        summary      = tomtom_route["summary"]

        # Parse real geographic polyline from all rendered legs
        raw_path = []
        for leg in tomtom_route.get("legs", []):
            for pt in leg.get("points", []):
                raw_path.append({
                    "lat": pt["latitude"],
                    "lon": pt["longitude"]
                })
        
        # Performance scaling: Decimate geometry points uniformly (1 in 10) to guard Leaflet UI from lagging out
        path = raw_path[::10]

        distance_km  = round(summary["lengthInMeters"] / 1000, 2)
        time_hours   = round(summary["travelTimeInSeconds"] / 3600, 2)
        cost         = round(distance_km * cost_rate, 2)

        return {
            "route_id":   str(uuid.uuid4()),
            "type":       route_type.capitalize(),
            "path":       path,                       # Actual geographical polyline mapping
            "distance":   distance_km,
            "time_hours": time_hours,
            "cost":       cost,
            "risk":       0.0   # Hydrated subsequently by optimize_routes()
        }

    except Exception as e:
        print(f"⚠️ TomTom connection/parse error ({route_type}): {e}")
        return None


def _mock_routes(src_lat, src_lon, dst_lat, dst_lon, cost_rate):
    """
    Intelligent simulated fallback structure utilizing the math Haversine formula
    to estimate precise km distance spanning two global coordinates.
    """
    import math

    # Haversine formula calculation for precise straight-line distance (km)
    R = 6371
    dlat = math.radians(dst_lat - src_lat)
    dlon = math.radians(dst_lon - src_lon)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(src_lat)) *
         math.cos(math.radians(dst_lat)) *
         math.sin(dlon/2)**2)
    straight_line_km = R * 2 * math.asin(math.sqrt(a))

    # Standard highway road variance scaling (roughly 1.3x straight line geometry)
    base_km = round(straight_line_km * 1.3, 2)

    mid_lat = (src_lat + dst_lat) / 2
    mid_lon = (src_lon + dst_lon) / 2

    # Simulated configurations reflecting real algorithm variances
    configs = [
        ("Fastest",    1.00,      1.00,       0.0,    0.0),
        ("Shortest",   0.92,      1.15,       0.1,   -0.1),
        ("Eco",        1.05,      1.20,      -0.1,    0.1),
        ("Thrilling",  1.18,      1.35,       0.2,    0.2),
    ]

    routes = []
    for (rtype, dm, tm, olat, olon) in configs:
        dist = round(base_km * dm, 2)
        routes.append({
            "route_id":   str(uuid.uuid4()),
            "type":       rtype,
            "path": [
                {"lat": src_lat,           "lon": src_lon},
                {"lat": mid_lat + olat,    "lon": mid_lon + olon},
                {"lat": dst_lat,           "lon": dst_lon}
            ],
            "distance":   dist,
            "time_hours": round((dist / 80) * tm, 2),  # Scaling off global 80 km/h average velocity
            "cost":       round(dist * cost_rate, 2),
            "risk":       0.0
        })

    return routes


def optimize_routes(routes, base_aggregated_risk, remaining_time_hours):
    """
    Executes mathematical logic computing custom temporal factors for Route tracking
    and dynamically isolates the primary Best Route constraint minimizing Composite Score.
    Score = 0.5 × Risk + 0.3 × Time + 0.2 × Cost  (Lower metrics win mapping output)
    """
    if not routes:
        return [], None

    max_time = max(r["time_hours"] for r in routes) or 1
    max_cost = max(r["cost"]       for r in routes) or 1

    best_route        = None
    min_composite     = float("inf")

    for r in routes:
        # Apply Temporal Penalties
        time_pressure = (r["time_hours"] / remaining_time_hours if remaining_time_hours > 0 else 1.5)

        r["risk"] = min(0.99, round(base_aggregated_risk * time_pressure, 3))

        norm_time = r["time_hours"] / max_time
        norm_cost = r["cost"]       / max_cost

        # Advanced Normalized Algorithm Scoring
        composite = (0.5 * r["risk"]) + (0.3 * norm_time) + (0.2 * norm_cost)
        r["composite_score"] = round(composite, 3)

        if composite < min_composite:
            min_composite = composite
            best_route    = r

    return routes, best_route
