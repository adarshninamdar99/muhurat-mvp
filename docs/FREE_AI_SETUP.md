# Free AI setup (Cloudflare Workers AI)

Muhurat can make real AI wedding pictures **at no cost** using Cloudflare Workers AI. No credit card is needed.

| | Free (Cloudflare) | Paid (fal.ai) |
| --- | --- | --- |
| Real AI pictures | Yes, FLUX.2 [klein] 4B | Yes, Nano Banana Edit |
| Couple's faces kept | Yes, from up to 4 reference photos | Yes, from up to 8 |
| Venue depth map | A quick stand-in sketch | Real depth (Depth Anything V2) |
| Video clips | Camera-move preview in the browser | Real 5-second AI video (Wan 2.2) |
| Wedding film, before/after, save-the-date, family votes | Yes (these run in the browser, always free) | Yes |
| Cost | ₹0, about 80 pictures a day | about ₹3.50 a picture, ₹9 a clip |

The free allowance is 10,000 "neurons" a day per Cloudflare account. It resets at 00:00 UTC, which is **5:30 am IST**. One picture uses roughly 125 neurons, so expect about 80 pictures a day. The Shots step shows how many are left today (an estimate).

---

## 1. Create a free Cloudflare account (2 minutes)

1. Go to https://dash.cloudflare.com/sign-up and sign up with an email and password.
2. Confirm your email. No card is asked for.

## 2. Get your Account ID and API token (3 minutes)

1. In the Cloudflare dashboard, open **AI → Workers AI** in the left menu.
2. Select **Use REST API**.
3. Select **Create a Workers AI API Token**, check the details it filled in, then select **Create API Token**.
4. Select **Copy API Token**. Paste it somewhere safe for the next step. You only see it once.
5. On the same page, copy the **Account ID**.

If you make a token by hand instead (My Profile → API Tokens → Create Custom Token), give it both **Workers AI – Read** and **Workers AI – Edit**.

## 3. Put them in `.env.local`

Open `.env.local` in the project folder (copy it from `.env.example` if it does not exist) and set:

```
AI_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=paste-account-id-here
CLOUDFLARE_API_TOKEN=paste-token-here
```

Restart the app (`Ctrl + C`, then `npm run dev`).

## 4. Check it works

1. Open http://localhost:3000 and start a new preview.
2. Add one photo of the bride and one of the groom.
3. Go to **Shots** and press **Draw all 6 shots**.

The first picture takes about 5–15 seconds. The Shots step should say “Cost per picture: free (daily allowance)”.

If a picture fails, the message on screen tells you why:

| Message | What to do |
| --- | --- |
| “Cloudflare rejected the API token” | The token was copied wrongly or lacks Workers AI permission. Make a new one (step 2). |
| “Today's free AI allowance is used up” | Wait until 5:30 am IST, or switch to `AI_PROVIDER=mock` for the rest of the day. |
| “Cloudflare Workers AI error (HTTP …)” | Shown with Cloudflare's own message. A 5xx error usually clears on retry. |

The server terminal also prints each failure as `[jobs] generate_shot … failed`.

---

## Keep the token secret

- `.env.local` is git-ignored. **Never** commit it or paste the token into code.
- Don't send the token on WhatsApp or email. Each developer should make their own free account and token; it takes five minutes.
- If a token leaks, delete it in Cloudflare (My Profile → API Tokens) and make a new one.

## Before going live

- Check Cloudflare's current terms for commercial use of the model, and its pricing page (models and free limits change).
- Beyond about 80 pictures a day, either move to the Workers Paid plan (pay per use above the free allowance) or switch to fal.ai (`AI_PROVIDER=fal`). No code changes are needed: it is one setting.

## Where the code lives

- Provider: `src/server/ai/providers/cloudflare/index.ts`
- Settings check: `src/server/env.ts`
- Free-allowance estimate: `CLOUDFLARE_FREE` in `src/config/pricing.ts`
- Tests (with Cloudflare's API faked): `tests/cloudflare.test.ts`
