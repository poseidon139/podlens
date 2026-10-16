# PodLens: Google Cloud Console Step-by-Step Deployment Guide

This guide walks you through deploying **PodLens** on **Google Cloud Platform (GCP)** using either the **Google Cloud Console Web UI** or the **Google Cloud Shell / `gcloud` CLI**.

---

## 1. Prerequisites
- A Google Cloud account with an active billing account ([Google Cloud Free Tier](https://cloud.google.com/free) gives \$300 credits).
- A Google Cloud Project (or create a new one).

---

## 2. Google Cloud Console (Web UI Walkthrough)

### Step 1: Create or Select Your GCP Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, click the **Project Dropdown** and select **New Project**.
3. Name your project (e.g. `podlens-app-2026`) and click **Create**.
4. Make sure your project is selected in the top bar.

---

### Step 2: Enable Required APIs
1. In the search bar at the top, type **"APIs & Services"** and click **Enabled APIs & Services**.
2. Click **+ ENABLE APIS AND SERVICES**.
3. Search and enable the following APIs:
   - **Vertex AI API** (`aiplatform.googleapis.com`) — required for Gemini 1.5 Flash and Google Search Grounding.
   - **Cloud Run Admin API** (`run.googleapis.com`) — required to host the serverless container.
   - **Cloud Build API** (`cloudbuild.googleapis.com`) — builds container images.
   - **Artifact Registry API** (`artifactregistry.googleapis.com`) — stores Docker images.
   - **Cloud Firestore API** (`firestore.googleapis.com`) — stores timestamped claims and episode sessions.
   - **Cloud Storage** (`storage.googleapis.com`) — stores raw media audio chunks and dossier exports.

---

### Step 3: Create Cloud Firestore Database
1. In the left navigation menu, go to **Databases > Firestore Studio**.
2. Click **Select Native Mode** (recommended for web/mobile apps).
3. Select your Database Location (e.g. `nam5 (United States)` or `us-central1`).
4. Keep the Database ID as `(default)` and click **Create Database**.

---

### Step 4: Create Artifact Registry Repository
1. In the search bar, search for **Artifact Registry** and open it.
2. Click **+ Create Repository**.
3. Fill in:
   - **Name:** `podlens-repo`
   - **Format:** `Docker`
   - **Mode:** `Standard`
   - **Region:** `us-central1`
4. Click **Create**.

---

### Step 5: Configure IAM & Service Account
1. In the search bar, search for **IAM & Admin > Service Accounts**.
2. Click **+ Create Service Account**:
   - **Service account name:** `podlens-runtime-sa`
   - Click **Create and Continue**.
3. In **Grant this service account access to project**, add these 3 roles:
   - **Vertex AI User** (`roles/aiplatform.user`)
   - **Cloud Datastore User** (`roles/datastore.user`)
   - **Storage Object Admin** (`roles/storage.objectAdmin`)
4. Click **Done**.

---

### Step 6: Deploy to Cloud Run (Option A: Cloud Shell / 1-Command)
The fastest way to deploy without installing Docker locally is using **Cloud Shell**:
1. In the top-right corner of Google Cloud Console, click the **Activate Cloud Shell** icon (`>_`).
2. Clone or upload the PodLens repository:
   ```bash
   cd podlens
   ```
3. Run the deployment script:
   ```bash
   ./deploy/deploy_cloud_run.sh YOUR_PROJECT_ID us-central1
   ```
4. Cloud Build will package the multi-stage Docker container and deploy it to Cloud Run.
5. At the end, Cloud Run prints your live prototype URL:
   ```
   https://podlens-xxxxxx-uc.a.run.app
   ```

---

### Step 7: Deploy via Cloud Run UI (Option B: Web Console)
If you already built the image or connected a Git repository (GitHub / GitLab):
1. Navigate to **Cloud Run** in the Google Cloud Console.
2. Click **Create Service**.
3. Choose **Deploy one revision from an existing container image** (or choose **Continuously deploy from a repository**).
4. Select the image: `us-central1-docker.pkg.dev/YOUR_PROJECT_ID/podlens-repo/podlens:latest`.
5. Configuration:
   - **Service name:** `podlens`
   - **Region:** `us-central1`
   - **Authentication:** Check **Allow unauthenticated invocations** (so anyone with the prototype link can open it).
   - **Container Port:** `8080`
   - **Memory:** `1 GiB`
   - **CPU:** `1`
   - **Service Account:** Select `podlens-runtime-sa` (created in Step 5).
6. Under **Environment variables**, add:
   - `GCP_PROJECT_ID` = `YOUR_PROJECT_ID`
   - `GCP_LOCATION` = `us-central1`
   - `GEMINI_MODEL` = `gemini-1.5-flash-001`
   - `DEMO_MODE` = `false`
7. Click **Create**.
8. Within ~60 seconds, your service is live and your prototype link is displayed at the top of the page!

---

## 3. Vertex AI Google Search Grounding Check
In Vertex AI:
- The Gemini 1.5 Flash model automatically accesses Google Search Grounding with zero extra configuration when deployed with the `Vertex AI User` role.
- If you want to test via API key instead of service account ADC, you can generate an API key in [Google AI Studio](https://aistudio.google.com/) and set the environment variable:
  ```
  GEMINI_API_KEY=AIzaSy...
  ```

---

## 4. Testing Your Deployed Prototype Link
Once deployed:
1. Open your Cloud Run URL (`https://podlens-xxxx-uc.a.run.app`).
2. You will see:
   - The interactive 65%/35% split screen.
   - The YouTube video player synchronized with the timeline ticks.
   - The Context Lens feed highlighting citations and grounded verdicts in real-time.
   - The **"Verify Claim"** playground to test any custom assertion live.
   - The **"Credibility Dossier"** button to export scores, Markdown, and Zotero bibliographies.
