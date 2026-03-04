# Deploy SmartStorey App to Vercel

## Step 1: Push to GitHub

### 1.1 Initialize Git (if not already)

```bash
cd /Users/vivekmehta000/Documents/SFMBA_Study/Cursor/smartstorey-app
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create a GitHub repo

1. Go to **https://github.com/new**
2. Name it `smartstorey-app` (or any name)
3. Leave it empty (no README)
4. Click **Create repository**

### 1.3 Push your code

```bash
git remote add origin https://github.com/YOUR_USERNAME/smartstorey-app.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2: Deploy on Vercel

### 2.1 Sign up / Log in

1. Go to **https://vercel.com**
2. Click **Sign Up** (or Log In)
3. Choose **Continue with GitHub**

### 2.2 Import the project

1. Click **Add New** → **Project**
2. Find `smartstorey-app` in the list
3. Click **Import**

### 2.3 Add environment variables

Before deploying, click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

(Use the same values from your `.env.local`)

### 2.4 Deploy

1. Click **Deploy**
2. Wait 1–2 minutes
3. You’ll get a URL like `https://smartstorey-app-xxx.vercel.app`

---

## Step 3: Update Supabase (optional)

For production, you may want to add your Vercel URL to Supabase:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL** and **Redirect URLs**

---

## Done

Your app is live. Share the Vercel URL with users.

To redeploy after changes: push to GitHub and Vercel will deploy automatically.
