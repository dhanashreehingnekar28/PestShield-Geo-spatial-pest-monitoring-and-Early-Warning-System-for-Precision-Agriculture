# PestShield — 3 terminals
cd client
npm run dev

cd server 
npm run dev

cd ai-service
venv\Scripts\activate
python -m uvicorn app:app --reload --port 8000

Auth, farms, crop lifecycle, pest library,
and pest reporting (with photo upload) all work end-to-end. AI fields already
exist on the report schema

## Folder structure

pestshield-app/
├── server/                        # Express + MongoDB API
│   ├── server.js                  # entry point
│   ├── config/db.js               # MongoDB connection
│   ├── models/                    # User, Farm, Pest, PestReport
│   ├── middleware/                # auth.js (JWT), upload.js (multer)
│   ├── controllers/                # route logic
│   ├── routes/                    # route definitions
│   ├── data/                      # cropLifecycle.js, pests.js (seed data)
│   ├── scripts/seed.js            # run once to populate the Pest collection
│   └── uploads/                   # uploaded pest photos land here
│
├── ai-service/                    # Python FastAPI — serves your 3 trained models
│   ├── app.py                     # /predict endpoint
│   ├── models.py                  # ResNet18/MobileNetV2 architecture builders
│   ├── class_names.py             # class label lists (chilli needs a check — see below)
│   ├── models/                    # <- 3 .pt files here(one per crop-total3)
│   └── README.md                  # detailed setup + troubleshooting for this piece
│
└── client/                        # React (Vite) frontend
    └── src/
        ├── api/axios.js           # pre-configured axios instance
        ├── context/AuthContext.jsx
        ├── components/            # Navbar, ProtectedRoute
        └── pages/                 # Login, Register, Dashboard, CreateFarm,
                                    # CropLifecycle, ReportPest, MyReports, AdminPanel

This mirrors PestShield doc's module list (Auth, Farm Management, Crop
Lifecycle, Pest Library, Pest Reporting, Admin Panel) — each module is its
own model/controller/route file, so adding Maps, Notifications, or Outbreak
Detection later means adding new files in the same pattern, not restructuring
anything.

AI_SERVICE_URL=http://localhost:8000

## Step 1 — Get a MongoDB connection string (5 min)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), sign up free, create a free (M0) cluster.
2. Database Access → add a user with a password.
3. Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0) — demo.
4. Connect → Drivers → copy the connection string (looks like `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/`).
username: shafqatf_db_user
password: LSRIlKDtvhNnE3vv
connection string: mongodb+srv://shafqatf_db_user:LSRIlKDtvhNnE3vv@cluster0.onsavyv.mongodb.net/pestshield?appName=Cluster0
code:

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://shafqatf_db_user:LSRIlKDtvhNnE3vv@cluster0.onsavyv.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

## Step 2 — Backend setup

bash
cd server
npm install
copy .env.example .env


Open `.env` and fill in:
- `MONGO_URI` — the connection string from Step 1, with `/pestshield` added before the `?` (this becomes your database name)
- `JWT_SECRET` — any long random string, e.g. mash the keyboard for 40 characters

npm run dev > CTRL C then 
Seed the pest library (run once):
bash
npm run seed

result shoud be `Seeded 11 pests.`

Start the API:
bash
npm run dev

You should see `MongoDB connected` and `PestShield API running on port 5000`.

Quick check: open `http://localhost:5000/api/health` in a browser — should show `{"status":"ok"}`.

## Step 3 — Frontend setup

Open a second terminal:

bash
cd client
npm install
copy .env.example .env
npm run dev

Open `http://localhost:5173` — you should see the PestShield login page.

## Step 4 — Walk through the demo flow once yourself, tonight

1. Register as a farmer (name/email/password).
2. On the Dashboard, click + Add Farm → name it, pick a crop (Groundnut/Potato/Chilli) → Create.
3. Click your farm to view its Crop Lifecycle (day-by-day stages).
4. Go to Report Pest → select the farm, pick severity, attach a leaf photo, submit.
5. Go to My Reports → see your report with status "Pending".
6. Register a second account with role = Admin.
7. Log in as that admin → go to Admin in the navbar → see the pending report → click Verify.
8. Log back in as the farmer → My Reports now shows "Verified".


## Where the AI model plugs in later

- `PestReport` already has `aiPredictedPest`, `aiConfidence`, `detectionMethod` fields — no migration needed.
- `client/src/pages/ReportPest.jsx` has a clearly marked comment showing exactly where to call the prediction endpoint and show the suggestion.
- Add a new `server/routes/pestDetectionRoutes.js` that forwards the uploaded image to the FastAPI microservice (see PestShield Chapter 13) and returns `{predicted_class, confidence}` — this is additive, it won't touch any existing file.



- "MongoDB connection error" → check `.env` has the real password (not `<password>`) and that Network Access allows your current IP (or 0.0.0.0/0).
- CORS error in browser console → check `CLIENT_URL` in `server/.env` matches the URL you're actually opening (`http://localhost:5173`).
- Image upload fails → check the `server/uploads` folder exists (it should, it's already in this project).
- Blank page on frontend → check both `npm run dev` terminals are still running; check browser console for the actual error.
