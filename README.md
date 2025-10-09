
# AI Crosslist Pro

BetterLister-style workflow:
- Upload up to 24 images
- Assign SKU
- Fetch eBay 90-day sold comps (production App ID) with sandbox fallback
- Generate SEO title + description + category + weight + price via OpenAI (uses image URLs)
- Save draft locally

## Setup

1) Install deps
```bash
npm install
```

2) Create `.env.local` in project root:
```
OPENAI_API_KEY=your_openai_key_here
EBAY_APP_ID=your_production_app_id_here
# To force mock comps while testing:
# EBAY_ENV=sandbox
```

3) Run
```bash
npm run dev
```

Open http://localhost:3000

## Notes
- Image uploads go to `public/uploads` using `formidable`.
- Comps endpoint returns mock data if `EBAY_ENV=sandbox` or `EBAY_APP_ID` missing.
- OpenAI model: `gpt-4o-mini` with up to 10 image URLs for vision.
# ai-crosslist
