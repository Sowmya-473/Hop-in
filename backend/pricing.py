import sys, json, joblib
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

# Load trained model
price_model = joblib.load("pricing_model.pkl")

data = json.loads(sys.argv[1])

distance_km = float(data.get("distance_km", 10))
duration_min = float(data.get("duration_min", 20))
available_seats = int(data.get("seats", 1))

dt = datetime.now()
day_of_week = dt.weekday()
time_of_day = dt.hour

# Deterministic traffic (seeded by distance/time)
seed = int(distance_km * 1000 + duration_min + time_of_day + day_of_week)
np.random.seed(seed)
traffic_level = np.random.choice([0, 1, 2])

X = np.array([[distance_km, duration_min, available_seats, day_of_week, time_of_day, traffic_level]])
price = price_model.predict(X)[0]

print(json.dumps({"price": round(float(price), 2)}))
