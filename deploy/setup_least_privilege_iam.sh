#!/usr/bin/env bash
# ==============================================================================
# PodLens - Least-Privilege IAM Provisioning Script
# Enforces item 2 ("Cloud Run Infrastructure & Security") of compliance checklist
#
# Roles scoped strictly to:
#  - roles/aiplatform.user          -> Vertex AI Gemini 1.5 & Search Grounding
#  - roles/datastore.user           -> Cloud Firestore session & claim persistence
#  - roles/logging.logWriter        -> Cloud Logging structured audit telemetry
#  - roles/monitoring.metricWriter  -> Cloud Monitoring latency & telemetry metrics
# ==============================================================================

set -euo pipefail

PROJECT_ID="${1:-${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}}"
SERVICE_NAME="podlens"
SERVICE_ACCOUNT_NAME="podlens-cloudrun-sa"

if [ -z "$PROJECT_ID" ]; then
  echo "[-] ERROR: GCP Project ID is required. Pass it as \$1 or set GCP_PROJECT_ID."
  echo "    Usage: $0 <PROJECT_ID>"
  exit 1
fi

echo "[*] Configuring Least-Privilege IAM for PodLens in Project: ${PROJECT_ID}"
SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# 1. Create Dedicated Service Account if it does not exist
if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "[+] Service account already exists: ${SA_EMAIL}"
else
  echo "[+] Creating dedicated service account: ${SERVICE_ACCOUNT_NAME}"
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
    --project="${PROJECT_ID}" \
    --display-name="PodLens Cloud Run Service Account (Scoped Least-Privilege)" \
    --description="Strictly scoped for Vertex AI, Firestore, Logging, and Monitoring."
fi

# 2. Grant Strictly Scoped Roles
SCOPED_ROLES=(
  "roles/aiplatform.user"
  "roles/datastore.user"
  "roles/logging.logWriter"
  "roles/monitoring.metricWriter"
)

for ROLE in "${SCOPED_ROLES[@]}"; do
  echo "[+] Binding role: ${ROLE} to ${SA_EMAIL}..."
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --condition=None \
    --quiet >/dev/null
done

# 3. Attach Service Account to Cloud Run Service (if service exists)
if gcloud run services describe "${SERVICE_NAME}" --project="${PROJECT_ID}" --region="us-central1" >/dev/null 2>&1; then
  echo "[+] Updating Cloud Run service ${SERVICE_NAME} to use dedicated service account: ${SA_EMAIL}..."
  gcloud run services update "${SERVICE_NAME}" \
    --project="${PROJECT_ID}" \
    --region="us-central1" \
    --service-account="${SA_EMAIL}" \
    --quiet
else
  echo "[i] Cloud Run service '${SERVICE_NAME}' not yet deployed in us-central1."
  echo "    When deploying, specify: --service-account=\"${SA_EMAIL}\""
fi

echo "[✓] Least-Privilege IAM configuration complete for PodLens."
