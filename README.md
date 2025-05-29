# FadeMeBets Scrapers – Vercel Deployment

This repo contains serverless Python scrapers for betting data (spreads, totals, player props) across major sports. Each scraper is designed to run on Vercel as a scheduled serverless function.

---

## 📁 Folder Structure

```
/ (repo root)
├── vercel.json
└── api/
    ├── scrape_nfl.py
    ├── scrape_nba.py
    ├── scrape_mlb.py
    ├── scrape_ncaaf.py
    └── scrape_ufc.py
```

---

## 🚀 How to Deploy

### Step 1: Create `api/` Folder on GitHub

If you can’t upload folders directly:

1. Go to your GitHub repo.
2. Click **"Add file" → "Create new file"**
3. Name it:
   ```
   api/.gitkeep
   ```
   (This will create the `api/` folder)

4. Commit the file.

---

### Step 2: Upload Python Files to `/api`

1. Click into the new `api/` folder.
2. Use **“Add file” → “Upload files”**
3. Upload all scrapers:
   - `scrape_nfl.py`
   - `scrape_nba.py`
   - `scrape_mlb.py`
   - `scrape_ncaaf.py`
   - `scrape_ufc.py`

---

### Step 3: Upload `vercel.json` to the Root

1. Return to the root of your repo.
2. Upload `vercel.json` (this defines routes for Vercel)

---

### Step 4: Import Repo to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Select this GitHub repo
4. Vercel will auto-detect all `/api/*` endpoints

---

### Step 5: Schedule Cron Jobs in Vercel

1. In your Vercel dashboard:
   - Go to **Settings → Cron Jobs**
2. Add jobs like:
   ```
   URL: https://your-project.vercel.app/api/scrape_nfl
   Schedule: 0 6 * * *  (daily at 6 AM)
   ```

Repeat for each endpoint.

---

## 📊 What Each Script Does

Each function:
- Scrapes spreads, totals, and player props
- Writes output to a JSON file (e.g., `nfl_odds_results.json`)
- Returns a simple JSON status message

---

## 🧠 Notes

- Scrapers use `requests + BeautifulSoup`
- You can manually trigger them by visiting the endpoint in your browser
