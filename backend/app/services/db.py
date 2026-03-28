import os
import json

DATABASE_URL = os.getenv("DATABASE_URL")
IS_POSTGRES = bool(DATABASE_URL and DATABASE_URL.startswith("postgres"))

if IS_POSTGRES:
    import psycopg2
else:
    import sqlite3

VOLUME_PATH = os.getenv("RAILWAY_VOLUME_MOUNT_PATH", ".")
DB_FILE = os.path.join(VOLUME_PATH, "swarmroute.db")

def get_conn():
    if IS_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    else:
        return sqlite3.connect(DB_FILE)

def init_db():
    conn = get_conn()
    cursor = conn.cursor()
    
    if IS_POSTGRES:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shipments (
                shipment_id TEXT PRIMARY KEY,
                user_email TEXT,
                source TEXT,
                destination TEXT,
                mode TEXT,
                status TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS routes (
                route_id TEXT PRIMARY KEY,
                shipment_id TEXT,
                path TEXT,
                distance REAL,
                risk REAL,
                time_hours REAL,
                cost REAL,
                route_type TEXT DEFAULT 'Primary'
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS risk_logs (
                log_id SERIAL PRIMARY KEY,
                shipment_id TEXT,
                timestamp TEXT,
                risk_score REAL,
                event TEXT,
                explanation TEXT
            )
        ''')
    else:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shipments (
                shipment_id TEXT PRIMARY KEY,
                user_email TEXT,
                source TEXT,
                destination TEXT,
                mode TEXT,
                status TEXT
            )
        ''')
        
        cursor.execute("PRAGMA table_info(shipments)")
        columns = [col[1] for col in cursor.fetchall()]
        if "user_email" not in columns:
            cursor.execute("ALTER TABLE shipments ADD COLUMN user_email TEXT")
            cursor.execute("UPDATE shipments SET user_email = 'operator@swarmroute.ai' WHERE user_email IS NULL")
            
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS routes (
                route_id TEXT PRIMARY KEY,
                shipment_id TEXT,
                path TEXT,
                distance REAL,
                risk REAL,
                time_hours REAL,
                cost REAL,
                route_type TEXT
            )
        ''')
        cursor.execute("PRAGMA table_info(routes)")
        route_columns = [col[1] for col in cursor.fetchall()]
        if "route_type" not in route_columns:
            cursor.execute("ALTER TABLE routes ADD COLUMN route_type TEXT DEFAULT 'Primary'")

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS risk_logs (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id TEXT,
                timestamp TEXT,
                risk_score REAL,
                event TEXT,
                explanation TEXT
            )
        ''')
        conn.commit()
    conn.close()

def create_user(email, password):
    conn = get_conn()
    cursor = conn.cursor()
    success = False
    try:
        if IS_POSTGRES:
            cursor.execute('INSERT INTO users VALUES (%s, %s) ON CONFLICT DO NOTHING', (email, password))
            success = cursor.rowcount > 0
        else:
            try:
                cursor.execute('INSERT INTO users VALUES (?, ?)', (email, password))
                conn.commit()
                success = True
            except sqlite3.IntegrityError:
                pass
    finally:
        conn.close()
    return success

def get_user(email):
    conn = get_conn()
    cursor = conn.cursor()
    if IS_POSTGRES:
        cursor.execute('SELECT email, password FROM users WHERE email = %s', (email,))
    else:
        cursor.execute('SELECT email, password FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()
    return {"email": row[0], "password": row[1]} if row else None

def save_shipment(shipment_id, user_email, source, destination, mode, status="Pending"):
    conn = get_conn()
    cursor = conn.cursor()
    if IS_POSTGRES:
        cursor.execute('''
            INSERT INTO shipments (shipment_id, user_email, source, destination, mode, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (shipment_id) DO UPDATE SET 
            user_email=EXCLUDED.user_email, source=EXCLUDED.source, destination=EXCLUDED.destination,
            mode=EXCLUDED.mode, status=EXCLUDED.status
        ''', (shipment_id, user_email, json.dumps(source), json.dumps(destination), mode, status))
    else:
        cursor.execute('INSERT OR REPLACE INTO shipments (shipment_id, user_email, source, destination, mode, status) VALUES (?, ?, ?, ?, ?, ?)',
                       (shipment_id, user_email, json.dumps(source), json.dumps(destination), mode, status))
        conn.commit()
    conn.close()

def save_routes(routes_data):
    conn = get_conn()
    cursor = conn.cursor()
    for r in routes_data:
        if IS_POSTGRES:
            cursor.execute('''
                INSERT INTO routes (route_id, shipment_id, path, distance, risk, time_hours, cost, route_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (route_id) DO UPDATE SET 
                shipment_id=EXCLUDED.shipment_id, path=EXCLUDED.path, distance=EXCLUDED.distance, 
                risk=EXCLUDED.risk, time_hours=EXCLUDED.time_hours, cost=EXCLUDED.cost, route_type=EXCLUDED.route_type
            ''', (r['route_id'], r.get('shipment_id', ''), json.dumps(r.get('path', [])), r.get('distance', 0), r.get('risk', 0), r.get('time_hours', 1), r.get('cost', 100), r.get('type', 'Primary')))
        else:
            cursor.execute('''
                INSERT OR REPLACE INTO routes (route_id, shipment_id, path, distance, risk, time_hours, cost, route_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (r['route_id'], r.get('shipment_id', ''), json.dumps(r.get('path', [])), r.get('distance', 0), r.get('risk', 0), r.get('time_hours', 1), r.get('cost', 100), r.get('type', 'Primary')))
    if not IS_POSTGRES:
        conn.commit()
    conn.close()

def log_risk(shipment_id, timestamp, risk_score, event, explanation):
    conn = get_conn()
    cursor = conn.cursor()
    if IS_POSTGRES:
        cursor.execute('''
            INSERT INTO risk_logs (shipment_id, timestamp, risk_score, event, explanation)
            VALUES (%s, %s, %s, %s, %s)
        ''', (shipment_id, timestamp, risk_score, event, explanation))
    else:
        cursor.execute('''
            INSERT INTO risk_logs (shipment_id, timestamp, risk_score, event, explanation)
            VALUES (?, ?, ?, ?, ?)
        ''', (shipment_id, timestamp, risk_score, event, explanation))
        conn.commit()
    conn.close()

def get_user_shipments(user_email=""):
    conn = get_conn()
    cursor = conn.cursor()
    if IS_POSTGRES:
        if user_email:
            cursor.execute('SELECT shipment_id, source, destination, mode, status FROM shipments WHERE user_email = %s ORDER BY shipment_id DESC', (user_email,))
        else:
            cursor.execute('SELECT shipment_id, source, destination, mode, status FROM shipments ORDER BY shipment_id DESC')
    else:
        if user_email:
            cursor.execute('SELECT shipment_id, source, destination, mode, status FROM shipments WHERE user_email = ? ORDER BY shipment_id DESC', (user_email,))
        else:
            cursor.execute('SELECT shipment_id, source, destination, mode, status FROM shipments ORDER BY shipment_id DESC')
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_shipment_routes(shipment_id):
    conn = get_conn()
    cursor = conn.cursor()
    if IS_POSTGRES:
        cursor.execute('SELECT route_id, route_type, distance, time_hours, cost, risk, path FROM routes WHERE shipment_id = %s ORDER BY cost ASC', (shipment_id,))
    else:
        cursor.execute('SELECT route_id, route_type, distance, time_hours, cost, risk, path FROM routes WHERE shipment_id = ? ORDER BY cost ASC', (shipment_id,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_shipment_by_id(shipment_id):
    conn = get_conn()
    cursor = conn.cursor()
    if IS_POSTGRES:
        cursor.execute("SELECT source, destination, mode FROM shipments WHERE shipment_id = %s", (shipment_id,))
    else:
        cursor.execute("SELECT source, destination, mode FROM shipments WHERE shipment_id = ?", (shipment_id,))
    row = cursor.fetchone()
    conn.close()
    return row

# Initialize DB on import if possible locally
try:
    init_db()
except Exception as e:
    print(f"Warning: DB initialization skipped during import: {e}")
