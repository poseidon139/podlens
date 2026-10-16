#!/usr/bin/env bash
set -e

# ==============================================================================
# PodLens (CiteCast) - Google Cloud Platform Setup Script
# Configures Vertex AI, Cloud Firestore, Cloud Storage, Artifact Registry & IAM
# ==============================================================================

PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null)}
REGION=${2:-"us-central1"}

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Project ID not provided and not set in gcloud config."
  echo "Usage: ./deploy/setup_gcp.sh <PROJECT_ID> [REGION]"
  exit 1
fi

echo "=================================================="
echo "🚀 Initializing PodLens on GCP Project: $PROJECT_ID ($REGION)"
echo "=================================================="

# 1. Enable Required Google Cloud APIs
echo "1️⃣  Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  pubsub.googleapis.com \
  --project="$PROJECT_ID"

# 2. Create Artifact Registry Repository for Docker images
echo "2️⃣  Creating Artifact Registry repository 'podlens-repo'..."
if ! gcloud artifacts repositories describe podlens-repo --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create podlens-repo \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker repository for PodLens services" \
    --project="$PROJECT_ID"
  echo "✅ Artifact Registry repository created."
else
  echo "ℹ️  Artifact Registry repository already exists."
fi

# 3. Create Cloud Firestore Database (Native Mode)
echo "3️⃣  Checking Cloud Firestore..."
if ! gcloud firestore databases describe --database="(default)" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "Creating Firestore Database in Native mode ($REGION)..."
  gcloud firestore databases create \
    --location="$REGION" \
    --type=firestore-native \
    --project="$PROJECT_ID" || true
else
  echo "ℹ️  Firestore database already exists."
fi

# 4. Create Cloud Storage Staging Bucket
STAGING_BUCKET="gs://podlens-staging-$PROJECT_ID"
echo "4️⃣  Checking Cloud Storage bucket: $STAGING_BUCKET..."
if ! gsutil ls -b "$STAGING_BUCKET" >/dev/null 2>&1; then
  gcloud storage buckets create "$STAGING_BUCKET" --location="$REGION" --project="$PROJECT_ID" || true
  echo "✅ Staging bucket created."
else
  echo "ℹ️  Staging bucket already exists."
fi

# 5. Service Account Setup for Cloud Run
SERVICE_ACCOUNT="podlens-runtime-sa"
SA_EMAIL="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"
echo "5️⃣  Setting up Runtime Service Account: $SA_EMAIL..."

if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
    --display-name="PodLens Cloud Run Runtime Service Account" \
    --project="$PROJECT_ID"
fi

# Assign Vertex AI User, Firestore User, and Storage Admin
echo "Granting IAM roles..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/datastore.user" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectAdmin" >/dev/null

echo "=================================================="
echo "🎉 Google Cloud Setup Completed Successfully!"
echo "Now run: ./deploy/deploy_cloud_run.sh $PROJECT_ID $REGION"
echo "=================================================="
