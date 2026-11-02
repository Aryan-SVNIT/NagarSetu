# Deploy NagarSetu on Render

This project runs as one FastAPI web service and serves both the frontend and API from the same public origin. The included `render.yaml` is configured for a free public demo in Singapore.

## Before deployment

1. Create a GitHub repository and upload the contents of this folder (the repository root must contain `render.yaml`, `.python-version`, `backend/`, `assets/`, `citizen/`, and `admin/`).
2. Do **not** upload `.env`, `data/`, database files, API keys, or uploaded evidence. The `.gitignore` excludes these.
3. Create a long random officer key (at least 32 characters). Keep it private and share it only with authorized judges/officers. Example command in PowerShell: `python -c "import secrets; print(secrets.token_urlsafe(32))"`.

## Create the Render service

1. Sign in at https://render.com/.
2. Choose **New → Blueprint** and connect the GitHub repository.
3. Render reads `render.yaml`. When prompted for environment variables, enter the officer key and your Sightengine credentials. If the Blueprint flow does not prompt for an optional Sightengine value, add it later under the service's **Environment** page.
4. Create the service and wait for the deploy to finish.
5. Open the generated `https://<service-name>.onrender.com/` URL. Test `/api/health`, `/docs`, citizen guest sign-in, report submission, image upload, public incidents, and officer login.

## Important persistence limitation

The included Blueprint uses Render's **Free** compute plan and writes data under `/tmp/nagarsetu-data`. It does not attach a persistent disk. The app will run, but its SQLite database and uploaded evidence are stored on an ephemeral filesystem and can be lost when the service restarts or redeploys. Free web services can also spin down after inactivity. This is suitable for a temporary judging/demo URL, not for reliable long-term records.

For persistent reports and uploaded evidence, upgrade the web service to a paid plan and attach a persistent disk mounted at `/var/data`. Then change `CIVICLENS_DATA_DIR` to `/var/data` in Render Environment settings and redeploy. Render documents that persistent disks require a paid web service and preserve only files written beneath the mount path. The service uses SQLite, so keep it to one running instance.

## Environment variables

- `DEMO_MODE=false` — keeps the public demo OTP/admin bypass disabled.
- `ADMIN_ACCESS_KEY` — private key required to sign into `/admin/login.html`. Do not share it publicly or commit it to GitHub.
- `SIGHTENGINE_API_USER` and `SIGHTENGINE_API_SECRET` — optional. If provided, Sightengine checks can run where the app calls them; this does not guarantee every image is classifiable.
- `CIVICLENS_DATA_DIR=/tmp/nagarsetu-data` in the included free Blueprint; change to `/var/data` only after attaching a persistent disk there.

## Local admin access

The local `/api/auth/admin/demo` route remains available only when `DEMO_MODE=true`. Do not set this on a public deployment: it grants anyone who can reach the site demo administrator access.
