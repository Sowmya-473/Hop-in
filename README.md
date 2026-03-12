# Carpool Full-Stack App (Integrated)

## Structure
- `frontend/` — React + Vite app. Configure `VITE_API_URL` in `frontend/.env` (default: http://localhost:5004).
- `backend/` — Node/Express + MongoDB API.

## Environment
Create `backend/.env`:
```
PORT=5004
JWT_SECRET=dev_secret_change_me
MONGO_URL=mongodb://127.0.0.1:27017/carpool
GOOGLE_MAPS_API_KEY=YOUR_SERVER_KEY  # needed for /api/geocode
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5004
```

## Run
In one terminal:
```
cd backend
npm install
npm run dev
```

In another:
```
cd frontend
npm install
npm run dev
```

## Notes
- Frontend tabs now import `../lib/api` and `../lib/geocode`.
- Enter coordinates as `lat,lng` if you don’t have a Google key configured; otherwise the app will geocode text via server.
