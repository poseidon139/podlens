#!/usr/bin/env bash
set -e

# ==============================================================================
# PodLens (CiteCast) - Cloud Run 1-Command Deployment Script
# Builds multi-stage container and deploys unified web + API to Google Cloud Run
# ==============================================================================

PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null)}
REGION=${2:-"us-central1"}
SERVICE_NAME="podlens"
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/podlens-repo/podlens:latest"
SA_EMAIL="podlens-runtime-sa@$PROJECT_ID.iam.gserviceaccount.com"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Project ID not specified."
  echo "Usage: ./deploy/deploy_cloud_run.sh <PROJECT_ID> [REGION]"
  exit 1
fi

echo "=================================================="
echo "🚀 Building & Deploying PodLens to Cloud Run"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "Image:   $IMAGE_TAG"
echo "=================================================="

# 1. Build & Push via Google Cloud Build (or local docker if available)
echo "📦 Submitting build to Google Cloud Build..."
gcloud builds submit --tag "$IMAGE_TAG" --project="$PROJECT_ID" .

# 2. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE_TAG" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="$SA_EMAIL" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=300 \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,GCP_LOCATION=$REGION,GEMINI_MODEL=gemini-1.5-flash-001,FIRESTORE_DATABASE=(default),DEMO_MODE=true"

# 3. Retrieve Live Service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform=managed --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')

echo "=================================================="
echo "✨ PodLens Prototype Deployed Successfully!"
echo "🔗 Prototype Live URL: $SERVICE_URL"
echo "=================================================="
