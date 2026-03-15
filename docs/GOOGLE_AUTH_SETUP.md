# Google Auth setup for production

Your app uses **Google Identity Services (GIS)** — the "Continue with Google" button gets a credential in a popup and sends it to your backend. No redirect to Google.

## Checklist when "Continue with Google" doesn’t work

1. **Use a Web application client**  
   Desktop client IDs will not work. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**, create (or use) an OAuth client with type **Web application**.

2. **Authorized JavaScript origins**  
   In that Web application client, under **Authorized JavaScript origins** add:
   - `https://apply-ai-phi.vercel.app`
   - `http://localhost:3000` (if you test locally)  
   Save. It can take a few minutes to apply.

3. **Same Client ID everywhere**  
   The **exact same** Web application Client ID must be used in:
   - **Vercel** → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - **Render** → `GOOGLE_CLIENT_ID`  
   If one is Desktop or different, you get "Invalid Google token".

4. **CORS (backend)**  
   On **Render** → Environment → set:
   - `FRONTEND_URL` = `https://apply-ai-phi.vercel.app`  
   So the backend allows requests from your frontend.

5. **Redeploy**  
   After changing env vars on Vercel or Render, redeploy so the new values are used.

6. **See the real error**  
   On the site, open **F12 → Console**. Click "Continue with Google" and check the red error. The UI will also show a short message (e.g. "Invalid Google token" or "Cannot reach server").

## Optional: Authorized redirect URIs

For this popup flow you don’t redirect to Google. You can still add under **Authorized redirect URIs**:
- `https://apply-ai-phi.vercel.app`
- `http://localhost:3000`

## Multiple client IDs (dev + prod)

Backend supports comma-separated IDs. On Render you can set:
`GOOGLE_CLIENT_ID=123-prod.apps.googleusercontent.com,456-dev.apps.googleusercontent.com`
