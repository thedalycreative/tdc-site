# The Daly Creative — Marketing Site

Brand, web, and AI automation for solo operators and small businesses in WA. Lead-gen site with Claude-powered AI chatbot.

**Stack:** Static HTML/CSS/JS + Vercel serverless function + Anthropic API. No build step, no framework, ~250 KB total.

---

## What's in here

```
tdc-site/
├── index.html          Homepage (hero, services, Setup Day teaser, testimonials)
├── setup-day.html      Setup Day sales page ($997 lead offer)
├── chatbot.js          Frontend chat widget — talks to /api/chat
├── api/
│   └── chat.js         Vercel serverless function calling Claude Haiku 4.5
├── assets/             SVG brand assets (favicon, spark mark, logo)
├── vercel.json         Routing + security headers
├── .env.example        Required env vars
└── README.md           This file
```

---

## Deploy in 10 minutes

### 1. Push to GitHub (2 min)

```bash
cd tdc-site
git init
git add .
git commit -m "Initial commit"
gh repo create tdc-site --public --source=. --remote=origin --push
```

If you don't have `gh` CLI: create the repo manually on github.com, then:
```bash
git remote add origin https://github.com/timdaly/tdc-site.git
git branch -M main
git push -u origin main
```

### 2. Import to Vercel (3 min)

1. Go to https://vercel.com/new
2. Import your `tdc-site` repo (Vercel auto-detects it as static + serverless)
3. **Before clicking Deploy**, add the environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from https://console.anthropic.com/settings/keys
4. Click Deploy. ~30 seconds later you'll have a live URL like `tdc-site-xyz.vercel.app`.

### 3. Test the chatbot (1 min)

Visit your Vercel URL. Click the spark icon bottom-right. Send a message. If you get a reply, the API key is wired.

If you get "Server config error" — your env var isn't set. Go to Vercel → Project → Settings → Environment Variables, add `ANTHROPIC_API_KEY`, then redeploy (Deployments tab → ⋯ → Redeploy).

### 4. Connect your domains (4 min)

**Primary: thedalycreative.com** (already owned)
1. Vercel → Project → Settings → Domains → Add `thedalycreative.com` and `www.thedalycreative.com`
2. Vercel will show you DNS records (an A record + CNAME). Go to wherever your domain is registered, paste them in.
3. SSL provisions in 1–5 minutes.

**Secondary: tdc.com.au** (~$20/year)
1. Register at [VentraIP](https://ventraip.com.au) (~$18/yr) or [Crazy Domains](https://crazydomains.com.au) (~$20/yr). VentraIP is better — no upsells.
2. In Vercel → Settings → Domains → Add `tdc.com.au` and `www.tdc.com.au`
3. Vercel will give you DNS records. Paste into VentraIP's DNS manager.
4. In Vercel, set `tdc.com.au` to **redirect to thedalycreative.com** (cleaner — one source of truth, SEO benefits)

---

## Email setup — `hello@thedalycreative.com`

Two free paths. Pick one.

### Option A: Zoho Mail (recommended — real inbox)

- Free for up to 5 mailboxes on your own domain
- Sign up: https://www.zoho.com/mail/zohomail-pricing.html (Forever Free Plan)
- They'll give you DNS records (MX, SPF, DKIM) — add to your domain registrar
- Set up `hello@thedalycreative.com`, optionally `tim@thedalycreative.com`
- 5 GB storage, web + mobile app, webmail interface is actually decent
- **Cost: $0/month forever**

### Option B: Cloudflare Email Routing (forwarding only)

- Free, set up in 5 minutes
- Routes `hello@thedalycreative.com` → your existing Gmail inbox
- To **send** as `hello@thedalycreative.com` from Gmail, you'll need to add a "Send mail as" alias with an SMTP relay (e.g. SendGrid free tier = 100 emails/day)
- More fiddly than Zoho but zero cost
- Setup: https://blog.cloudflare.com/introducing-email-routing/

**Recommendation:** Zoho. Costs nothing, looks more professional, no SMTP headaches.

---

## Running costs

| Item | Cost |
|------|------|
| Domain — thedalycreative.com | already owned |
| Domain — tdc.com.au | ~$18-20/yr (~$1.50/mo) |
| Vercel hosting | Free (Hobby tier — fine until you do real traffic) |
| Anthropic API (Claude Haiku 4.5) | ~$0.0024/conversation. 1000 chats/month ≈ **$2.40** |
| Zoho Mail | Free |
| **Total typical month** | **~$4** |

If chatbot traffic explodes (10,000+ chats/month), you might hit ~$25. Vercel Hobby tier handles ~100GB bandwidth/month free — easily 50,000+ visits.

---

## Local development

```bash
# Install Vercel CLI (one-time)
npm i -g vercel

# Run locally with serverless function support
cd tdc-site
vercel dev
```

`vercel dev` runs on `http://localhost:3000` and handles both the static files and the `/api/chat` endpoint. You'll need to add `ANTHROPIC_API_KEY` to a `.env.local` file (copy from `.env.example`).

---

## Iteration ideas (later sessions)

- **Lead capture form** in chatbot — when user says "I'm interested", trigger an email-collection bubble that POSTs to a Resend/SendGrid endpoint
- **Brand audit tool** — port your existing audit tool from past sessions onto `/audit`
- **Solo Op AI Playbook page** at `/playbook` for the $99 tier
- **Work portfolio** at `/work`
- **Blog/notes** at `/notes` — short writing on AI automation for solo ops, drives SEO + signal
- **Newsletter signup** — Buttondown free tier (100 subscribers free) or ConvertKit
- **Conversion analytics** — Vercel Analytics is free; add Plausible if you want privacy-friendly tracking
- **Calendar booking** — Cal.com free, embed it on `/setup-day` for instant Monday brief calls

---

## Notes for future-Tim

- **Spot counter**: The "12 of 40 taken" is currently hardcoded in `index.html` and `setup-day.html`. When you make a sale, update both. Later, wire this to a KV store if you want it dynamic.
- **System prompt**: Lives in `api/chat.js`. Edit it as you learn what visitors actually ask. The chatbot only gets smarter when you teach it.
- **Brand**: All visual tokens match the brand portal (`tdc-brand-portal.html`). Cross-reference if you fork the design.

---

Built with too much coffee and just enough caffeine. Perth, WA.
