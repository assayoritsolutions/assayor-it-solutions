Deploy instructions for the Cloud Function

1) Enable required APIs in your GCP project:

gcloud services enable gmail.googleapis.com cloudfunctions.googleapis.com secretmanager.googleapis.com

2) Create a service account and download JSON key. In the Google Workspace Admin console, enable domain-wide delegation for that service account's client ID and add the scope:

https://www.googleapis.com/auth/gmail.send

3) Store the service account JSON in Secret Manager:

gcloud secrets create gmail-sa-key --replication-policy="automatic"
gcloud secrets versions add gmail-sa-key --data-file=key.json

4) Deploy the function (example):

gcloud functions deploy sendContactEmail \
  --runtime=node18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=sendContactEmail \
  --set-secrets="SERVICE_ACCOUNT_KEY_JSON=gmail-sa-key:latest" \
  --set-env-vars="EMAIL_IMPERSONATE=sales@assayor.com,TO_EMAIL=sales@assayor.com"

5) After deploy, copy the function URL and replace it in your site's `index.html` form submit URL.

Notes:
- The service account must have domain-wide delegation enabled and the Admin must grant the Gmail scope to the client ID.
- Alternatively, you may pass the key JSON via an environment variable (not recommended for production).
