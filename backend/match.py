import sys, json, joblib
import numpy as np
from datetime import datetime
import warnings, sys
warnings.filterwarnings("ignore")
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass


# Load trained model
match_model = joblib.load("match_model.pkl")

# Read request data
data = json.loads(sys.argv[1])

# Extract fields
distance_km = np.random.randint(5, 30)   # TODO: replace with real haversine distance
duration_min = np.random.randint(10, 60) # TODO: replace with real ETA API
available_seats = data.get("seats", 1)

# Time features
dt = datetime.fromtimestamp(data.get("time_epoch", 1738123456))
day_of_week = dt.weekday()
time_of_day = dt.hour

# Traffic (dummy for now)
traffic_level = np.random.choice([0, 1, 2])

# Build feature vector
X = np.array([[distance_km, duration_min, available_seats, day_of_week, time_of_day, traffic_level]])

# Predict match
match_prob = match_model.predict_proba(X)[0][1]

# Dummy driver options
drivers = [
    {"id": "DRV001", "name": "Arun", "rating": 4.5, "eta_minutes": 8},
    {"id": "DRV002", "name": "Sneha", "rating": 4.7, "eta_minutes": 12}
]

# Add price suggestion (for demo)
for d in drivers:
    d["price_suggested"] = round(150 + match_prob * 100)

print(json.dumps(drivers))
