# SwarmRoute Deployment Guide

This guide provides step-by-step instructions for deploying your SwarmRoute web application: the **Frontend on Vercel** and the **Backend on Railway**. Since your code is already pushed to GitHub (`https://github.com/KOTHABHASKARABALAJI/swarmroute`), both platforms can deploy directly from your repository!

---

## Part 1: Deploy Backend to Railway 🚂
We will deploy the backend first so that we can grab its Production URL and pass it to the frontend.

### Step 1: Create a Railway Account & Connect GitHub
1. Go to [railway.app](https://railway.app) and sign up (using your GitHub account is easiest).
2. Click **New Project** on your dashboard.
3. Select **Deploy from GitHub repo**.
4. Search for and select your repository: `KOTHABHASKARABALAJI/swarmroute`.

### Step 2: Configure the Backend Service
When Railway asks which folder to deploy (if it notices the monorepo structure), you need to ensure it targets the backend.
1. Click on the newly created deployment tile that represents your repository.
2. Go to **Settings** -> **Service** and scroll down to the **Root Directory** section.
3. Change the root directory to `/backend` and save.
4. Railway will automatically detect the `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`) and build your Python environment based on the `requirements.txt`.

### Step 3: Add a PostgreSQL Database
The application is currently utilizing a local `.db` SQLite file, but on Railway, we need a permanent production-grade database because the server goes to sleep and wipes local files.
1. Click the **+ New** button in the top right of your Railway project canvas.
2. Select **Database** -> **Add PostgreSQL**.
3. Wait a few moments for the database to spin up.

### Step 4: Configure Backend Environment Variables
With both the Database and the Backend Service running side-by-side, we need to pass out API Keys.
1. Click on your **Backend Service** tile again.
2. Go to the **Variables** tab.
3. Click **New Variable** and add the following from your local `backend/.env` file:
   - `TOMTOM_API_KEY` = `ZLk7acAF2AXKvlD7K7rFjOlxzIrKGYqs`
   - `NEWS_API_KEY` = `f1408fe4f73e4b60b400805a26b25398`
   - `AISSTREAM_API_KEY` = `5a264f021e7d3f0e3ac20c9a5f8da650e19e07d5`
   - `GEMINI_API_KEY` = `AIzaSyDtqaWdsdBaAR1qUWOk7l1RvS7Q5T2L4iA`
   - `DATABASE_URL` = (To get this, you can click on the Postgres tile, go to 'Connect', copy the Postgres Connection URL, and paste it here.) Alternatively, Railway sometimes automatically links them if you add referring variables.
5. Railway will automatically trigger a new deployment. Once complete, copy the **Public URL** located in the Settings tab, which looks something like `https://swarmroute-production.up.railway.app`.

---

## Part 2: Deploy Frontend to Vercel ▲

### Step 1: Import Project in Vercel
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `KOTHABHASKARABALAJI/swarmroute`.

### Step 2: Configure Frontend Framework
1. In the **Configure Project** screen, click the **Edit** button next to **Root Directory**.
2. Select the `frontend` folder.
3. Vercel will automatically detect that you are using **Vite**. Leave "Framework Preset" as **Vite**. The build command will automatically be `npm run build` and install command `npm install`.

### Step 3: Configure Frontend Environment Variables
Before clicking deploy, expand the **Environment Variables** section. You need to connect Vercel to the Railway backend URL you copied earlier:
1. Add `VITE_API_URL`
   - **Value:** `https://your-app.up.railway.app` *(Replace with your Railway generated backend HTTPS URL)*
2. Add `VITE_WS_URL`
   - **Value:** `wss://your-app.up.railway.app` *(Replace with your Railway generated backend WSS URL)*

### Step 4: Deploy & View
1. Click **Deploy**.
2. Wait a minute for Vercel to install dependencies, build the React frontend, and publish.
3. You'll get a screen congratulating you and providing the URL to your live SwarmRoute application!

---

> [!TIP] 
> Let me know if you run into any build compilation errors on either platform during the deployment! We can use standard Git workflows to push fixes to the frontend or backend!
