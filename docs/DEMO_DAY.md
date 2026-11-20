# Meeting day: running the Muhurat demo

A plain-English guide for the client meeting. Allow 30 minutes the day before and 10 minutes before the meeting.

---

## The day before: get it ready (Harish, about 30 minutes)

1. **Get the latest version**
   ```bash
   cd muhurat-mvp
   git pull
   npm install
   ```
2. **Switch on real pictures** by following [FREE_AI_SETUP.md](FREE_AI_SETUP.md) (5 minutes, no card). Without this the app shows simple sketches, which is fine for testing but not for the client.
3. **Start it the way you will in the meeting**
   ```bash
   npm run demo
   ```
   This makes a fast, polished version (no developer messages on screen) and opens it on http://localhost:3000. The terminal should say `Muhurat pictures: Cloudflare Workers AI`.
4. **Do one full run-through** with photos of two team members who are happy for their photos to be used. Go through every step, create all 6 shots, play the film, and scan the QR code with a phone.
5. **Keep that finished preview.** It is your backup: if the internet is slow in the meeting, open it from **Recent previews** on the start page.
6. **Clean out old test previews** so the start page looks tidy: stop the app (`Ctrl + C`), rename the `data` folder to `data-old`, run `npm run demo` again, and create the backup preview again. Nothing else is lost.

Free pictures reset every morning at 5:30 am IST, and there are about 80 a day. A full run uses 6–10. Don't spend them all rehearsing on meeting day.

---

## Ten minutes before the meeting

- [ ] Laptop charged, on the venue's Wi-Fi, `npm run demo` running.
- [ ] Your phone on the **same Wi-Fi** as the laptop. Office guest Wi-Fi sometimes blocks phones from reaching laptops; if the QR code doesn't open, turn on your phone's hotspot and join the laptop to it.
- [ ] If the Mac asks "Allow incoming connections for node?", choose **Allow**. The phone can't reach the app without it.
- [ ] Browser in full screen (`Ctrl + Cmd + F` on Mac), zoom at 100%, other tabs closed.
- [ ] Two clear photos ready on the desktop: one of the "bride" and one of the "groom". Optional: a wide photo of a real venue (an empty hall or lawn).
- [ ] The backup preview is in **Recent previews**.

---

## The 15-minute walkthrough

| Time | Show | Say (in your own words) |
| --- | --- | --- |
| 0:00 | Start page. Type the client's own example names and press **Start**. | "This is what a couple sees on A Lovers Card." |
| 1:00 | **Couple**: pick a tradition and the muhurat time, add the two photos. | "The tradition decides the rituals in the pictures. The muhurat sets the light: a dawn wedding looks different from a night wedding." |
| 3:00 | **Venue**: add the venue photo. **Décor** and **Outfits**: change one or two choices. | "Every choice is saved instantly." |
| 5:00 | **Shots**: press **Create all 6 shots**. While they appear one by one, explain consistency. | "The first shot sets the look. Every other shot follows it, so the faces, outfits and décor match across all six." |
| 8:00 | Press **Before / after** above the picture and drag the slider slowly. | "Their empty venue today, and their wedding on the day." Pause here: this is the moment that sells it. |
| 9:30 | **Video** → **Play the film**. Let it run to the end with the sound on. | Say nothing while it plays. |
| 11:00 | **Share**: hand the client your phone (or ask them to scan the QR code with theirs). Ask them to type a name and tap ♥ on two pictures. | Their vote pops up on the laptop within a few seconds. "This is how the whole family joins in, and every one of them is a visitor to A Lovers Card." |
| 12:30 | Show the **save-the-date card**: type a date and city, press **Download card**. | "Shared on Instagram and WhatsApp with A Lovers Card on it." |
| 13:30 | **Book**: the priced décor list and **Ask 3 vendors for quotes**. | "The look they love turns straight into vendor leads." |
| 14:30 | Back to the start page. | "This is the working base. Here is what the full project adds…" (see below) |

Tip: the ← and → arrow keys move between steps.

---

## If something goes wrong

| What you see | What to do |
| --- | --- |
| A shot says "couldn't be made just now" | Press **Try again** on it. If it happens twice, open your backup preview and carry on. |
| "We're making a lot of pictures right now" | Today's free pictures are used up. Open the backup preview. (Harish can check usage at `/admin`.) |
| Shots are slow (over 30 seconds each) | The venue's internet is slow. Keep talking through the steps, or switch to the backup preview. |
| The phone can't open the QR link | Use your phone's hotspot (see the checklist above), or show the family page on the laptop by pressing **Copy link** and opening it in a new tab. |
| The film has no sound | Press **Sound on** in the film window and check the laptop's volume. |

---

## After "yes": what the full project adds

Use this to answer "what's next?" without over-promising:

- Their real outfit catalogue linked into every picture (the code already supports it; it needs their product photos).
- Paid image and video services for higher quality, real video clips and more pictures a day (one setting; costs are tracked per couple on the admin page).
- Sign-in for couples, a vendor portal for quotes, and payments.
- Hosting on A Lovers Card's own web address, with backups.
- Face-likeness checks that automatically recreate any shot that drifts.
