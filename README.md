# PestShield

PestShield is a precision-agriculture web application for monitoring pest reports, crop health, farm activity, and location-based outbreak risk. It combines a React web client, a Node.js/Express API backed by MongoDB, and an optional Python AI image-classification service.

## Features

- Farmer and administrator accounts with role-based access.
- Farm and crop management, with crop lifecycle guidance.
- Pest and disease reporting with photo uploads and report status tracking.
- Optional AI-assisted image predictions during reporting.
- Administrator report review, pest library maintenance, and user management.
- Outbreak alerts, map views, weather context, and field activity planning.
- English-only responsive interface.

## Project structure

```text
pestshield-app/
├── client/       React 18 + Vite application
│   └── src/
│       ├── api/         Axios API client
│       ├── components/  Shared navigation, dialogs, maps, and dashboard layout
│       ├── context/     Authentication context
│       └── pages/       Landing, auth, farmer, admin, map, and activity pages
├── server/       Express API and MongoDB models
│   ├── config/    Database connection
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/  Admin bootstrap and seed scripts
│   └── uploads/  Uploaded report images (local development)
└── ai-service/   FastAPI image prediction service (optional)
    └── models/   Trained model files and class_names.json
```

## Requirements

- Node.js and npm (the client uses Vite; the API requires Node.js).
- A MongoDB instance. The server validates the selected environment's database name.
- Python 3.10+ and pip if you want to run the AI service.
- The trained model files if you want AI predictions; see [ai-service/README.md](ai-service/README.md).

## Configuration

### API server

The API loads one of `server/.env.demo` or `server/.env.real`. `PESTSHIELD_MODE` selects which file is loaded; it defaults to `demo` when the environment variable is unset. The database name in `MONGO_URI` must be `pestshield_demo` in demo mode or `pestshield_real` in real mode. The server exits if the selected database name does not match.

Create the environment file you intend to use from the template, then fill in local values:

```powershell
Copy-Item server/.env.example server/.env.demo
```

Set `MONGO_URI` to your MongoDB connection string for the selected PestShield database and set `JWT_SECRET` to a long, private random value. Set `CLIENT_URL` to the client origin (normally `http://localhost:5173`). For the initial administrator account, set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`; the server bootstrap creates the administrator only when one does not already exist. `AI_SERVICE_URL` is optional and defaults to `http://localhost:8000`.

Do not commit `.env` files or real credentials. The server ignores `.env`; keep mode-specific files private as well. Use separate credentials and databases for demo and real environments.

### Client

The client reads `VITE_API_URL` at build/start time. Copy the template and point it at the API:

```powershell
Copy-Item client/.env.example client/.env
```

```env
VITE_API_URL=http://localhost:5000/api
```

The client defaults to that API URL when `VITE_API_URL` is not set.

### AI service

The Node API forwards prediction requests to `AI_SERVICE_URL` (default `http://localhost:8000`). The browser talks to the Node API, not directly to FastAPI. Put the trained model files and `class_names.json` under `ai-service/models/`. The model filenames currently expected by the service are `groundnut_mobilenet_v2.pt`, `potato_mobilenet_v2.pt`, and `chilli_mobilenet_v2.pt`. Full model setup and troubleshooting is in [ai-service/README.md](ai-service/README.md).

## Run locally

Install JavaScript dependencies once in each application directory:

```powershell
cd server
npm install
cd ../client
npm install
```

For local development, start the API and client in separate terminals from the project root:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

The API runs on port `5000` by default; the Vite client runs on port `5173`. Check API availability at `http://localhost:5000/api/health` (expected response: `{"status":"ok"}`). Open `http://localhost:5173` for the website.

To run the API in real mode, select it in the environment before starting the server. In PowerShell:

```powershell
$env:PESTSHIELD_MODE = 'real'
cd server
npm run dev
```

In bash:

```bash
export PESTSHIELD_MODE=real
cd server
npm run dev
```

Ensure `server/.env.real` points to the `pestshield_real` database. For demo mode, leave `PESTSHIELD_MODE` unset or set it to `demo`; configure `server/.env.demo` for `pestshield_demo`.

### Optional AI service

From a third terminal:

```powershell
cd ai-service
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

On macOS/Linux, activate the environment with `source venv/bin/activate`. The AI service exposes `GET /health` and `POST /predict`; the application calls prediction through the authenticated Node route `POST /api/pest-detection/predict`.

## Main application routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public | Sign in |
| `/register` | Public | Create a farmer account |
| `/dashboard` | Farmer or admin | Role-specific dashboard |
| `/create-farm` | Farmer | Add a farm |
| `/crop-lifecycle/:crop` | Signed-in user | Crop lifecycle information |
| `/report-pest` | Farmer | Submit a pest report and photo |
| `/my-reports` | Farmer | Review personal reports |
| `/activities` | Farmer | Manage field activities |
| `/map` | Signed-in user | View outbreak map |
| `/admin` | Admin | Review and manage pest reports |
| `/admin/users` | Admin | Manage users |
| `/admin/pests` | Admin | Manage pest library entries |

The API has a health check at `GET /api/health`. The API route groups are mounted under `/api`: `/auth`, `/farms`, `/pests`, `/pest-reports`, `/pest-detection`, `/alerts`, `/admin/users`, `/map`, `/activities`, `/dashboard`, and `/weather`. Authentication uses bearer tokens; the client attaches the stored token to API requests.

## Seed data and administrator account

The server bootstraps the first administrator from the selected environment's `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` if an administrator does not already exist. The pest seed command is intentionally restricted to the demo database:

```powershell
cd server
npm run seed
```

Do not run the seed script expecting it to populate a real database; it refuses non-demo databases.

## Build the client

```powershell
cd client
npm run build
```

To serve the generated production build locally:

```powershell
npm run preview
```

## Security and operational notes

- Never commit database URIs, JWT secrets, administrator passwords, or populated environment files.
- Use a unique, strong `JWT_SECRET` and restrict `CLIENT_URL` to the deployed frontend origin in production.
- Uploaded photos are stored by the API under `server/uploads` in the current configuration. Use persistent storage and appropriate backups when deploying.
- The API periodically checks and expires outdated outbreak alerts.
- The AI service requires compatible trained model files; without them, AI prediction cannot be used, though the rest of the application can run.

## Troubleshooting

- **MongoDB connection/database mismatch:** verify the selected mode, that its environment file exists, and that the URI uses `pestshield_demo` or `pestshield_real` as appropriate.
- **Missing JWT secret:** set `JWT_SECRET` in the selected server environment file.
- **Browser CORS error:** set `CLIENT_URL` to the exact client origin, including scheme and port.
- **AI prediction unavailable:** start FastAPI, confirm `AI_SERVICE_URL`, and check that all crop model files and `class_names.json` are in `ai-service/models/`.
- **Image upload fails:** confirm the API can write to `server/uploads` and that the request is made through the API.
- **Client cannot reach the API:** verify the server is running and `VITE_API_URL` points to its `/api` base URL.

