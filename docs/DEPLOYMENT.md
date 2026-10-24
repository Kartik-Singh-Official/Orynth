# Orynth Deployment Guide (Vercel & Cloud)

This guide walks you through deploying **Orynth** to production with **Vercel** for the frontend and **Render / Railway / Cloud Run** for the FastAPI Gemma RAG backend.

---

## 🚀 Part 1: Deploying Frontend to Vercel

The repository has been configured with root [`vercel.json`](file:///Users/karhiksingh/Orynth/vercel.json), root [`package.json`](file:///Users/karhiksingh/Orynth/package.json), and [`frontend/vercel.json`](file:///Users/karhiksingh/Orynth/frontend/vercel.json) for **zero-configuration** Vite deployments.

### Step-by-Step Vercel Deployment:

1. **Push your code to GitHub:**
   Your code is already committed on `main` at `https://github.com/Kartik-Singh-Official/Orynth`.

2. **Import into Vercel:**
   - Go to [https://vercel.com/new](https://vercel.com/new).
   - Sign in with your GitHub account.
   - Click **Import** next to `Orynth` (or search for it).

3. **Configure Project Settings:**
   - **Framework Preset:** Vite (Auto-detected).
   - **Root Directory:** `./` (Leave as default, or select `frontend`—both are supported!).
   - **Build Command:** Auto-detected from `vercel.json`.
   - **Output Directory:** Auto-detected (`frontend/dist` or `dist`).

4. **Add Environment Variables in Vercel:**
   In the Vercel deployment screen, expand **Environment Variables** and add:
   ```env
   VITE_SUPABASE_URL=https://eprkiarpqoquipjsxxcy.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_API_BASE_URL=https://your-deployed-backend.onrender.com
   ```
   *(Note: If your backend is not yet deployed, leave `VITE_API_BASE_URL` blank. The frontend will still load smoothly in offline demonstration mode!)*

5. **Deploy:**
   Click **Deploy**. In under 60 seconds, your site will be live at `https://orynth.vercel.app`!

---

## 🐍 Part 2: Deploying the Backend (Render / Railway / Fly)

Because Orynth uses local CPU embeddings (`sentence-transformers/all-MiniLM-L6-v2`) and Google Gemma 4 via `google-genai`, the backend requires Python 3.11+.

### Option A: 1-Click Free Deploy on Render
1. Go to [https://render.com](https://render.com) and click **New +** ➔ **Web Service**.
2. Connect your GitHub repository `Kartik-Singh-Official/Orynth`.
3. Set the following settings:
   - **Runtime:** Python
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `GOOGLE_API_KEY`: Your Google AI Studio API key (`AQ.Ab8RN6JR...`)
   - `GEMMA_MODEL`: `gemma-4-26b-a4b-it`
   - `GITHUB_TOKEN`: Your GitHub PAT (`github_pat_11B5...`)
5. Click **Deploy Web Service**.
6. Once deployed, copy your Render URL (e.g. `https://orynth-api.onrender.com`) and set it as `VITE_API_BASE_URL` in your Vercel project settings!

### Option B: Docker Container (Fly.io / Google Cloud Run / Railway)
The repository includes a production-ready [`Dockerfile`](file:///Users/karhiksingh/Orynth/Dockerfile):
```bash
# Build and run with Docker
docker build -t orynth-backend .
docker run -p 8000:8000 -e GOOGLE_API_KEY="your_key" orynth-backend
```

---

## ✅ Pre-flight Checklist

- [x] Root `vercel.json` configured with SPA routing rules.
- [x] Subfolder `frontend/vercel.json` configured for direct subfolder imports.
- [x] Dynamic API base in `frontend/src/api.ts` supporting `VITE_API_BASE_URL`.
- [x] Root `package.json` build orchestrator tested (`npm run build` passes in 213ms).
- [x] Zero TypeScript compilation errors (`tsc -b` clean).
- [x] All 7 automated backend tests pass.
- [x] Supabase connection and Gemma 4 model integration verified live.
