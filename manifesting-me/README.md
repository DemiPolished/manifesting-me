# Manifesting Me

A password-protected personal manifestation manual and life dashboard.
Pure HTML/CSS/JS — no backend, no build step. Installs to your phone, works offline,
prints to A5. *She is already her. This confirms it.*

Live at: **demipolished.github.io/manifesting-me** (once deployed)

---

## What's inside

```
manifesting-me/
├── index.html              ← the app (open this)
├── manifest.webmanifest    ← PWA config (home-screen install)
├── service-worker.js       ← offline caching
├── css/style.css           ← the whole Restoration Hardware aesthetic
├── js/
│   ├── config.js           ← ★ THE ONLY FILE YOU EDIT (your password)
│   ├── store.js            ← localStorage persistence
│   ├── gate.js             ← password gate
│   ├── app.js              ← navigation + shell
│   ├── brief.js            ← Weekly Brief renderer
│   ├── abundance.js        ← income-goal bars
│   ├── spirituality.js     ← lunar sync
│   └── love.js             ← Venus-notes sync
├── data/brief.json         ← ★ updated every Friday (your weekly brief)
├── sections/               ← the 7 tabs (Brief, Health, Abundance, Spirit, Business, Love, Home)
└── icons/                  ← app icons
```

Two files have a ★: `js/config.js` (your password) and `data/brief.json` (your weekly brief).
Everything else you can leave alone.

---

## Deploy to GitHub Pages

You're logged into GitHub already. Pick whichever path feels easier — both end at the
same live URL. **Option A (web upload)** needs no software. **Option B (GitHub Desktop)**
is the smoothest for future updates.

### Option A — Web upload (no software)

1. Go to **github.com/new**. Repository name: `manifesting-me`. Set it to **Private**
   (recommended) or Public. Don't add a README. Click **Create repository**.
2. On the empty repo page, click **uploading an existing file** (the link in the
   "Quick setup" box).
3. Open the `manifesting-me` folder on your computer, select **everything inside it**
   (the files *and* the `css`/`js`/`data`/`sections`/`icons` folders), and **drag it all**
   onto the upload area. GitHub keeps the folder structure.
4. Scroll down, click **Commit changes**.
5. Go to **Settings → Pages**. Under "Build and deployment," Source = **Deploy from a branch**,
   Branch = **main**, folder = **/ (root)**. Click **Save**.
6. Wait ~1–2 minutes. Your site is live at **demipolished.github.io/manifesting-me**.

### Option B — GitHub Desktop (best for updates)

1. Install GitHub Desktop (desktop.github.com), sign in.
2. **File → New Repository**, name it `manifesting-me`, choose a local folder.
3. Copy everything from my `manifesting-me` folder into that repo folder.
4. In GitHub Desktop you'll see all the files listed. Add a summary like "initial build,"
   click **Commit to main**, then **Publish repository** (uncheck "keep private" only if
   you want it public).
5. On github.com, open the repo → **Settings → Pages** → Source = **main / root** → Save.
6. Live at **demipolished.github.io/manifesting-me** in a couple minutes.

For future weekly updates with Option B: drop the new `brief.json` into `data/`, commit,
push. Done in 10 seconds.

---

## Set your password

Default password is **`manifest`**. To change it:

1. Open the live app in your browser (or `index.html` locally).
2. Right-click → **Inspect** → **Console** tab.
3. Type:  `await mmHash('your-new-password')`  and press Enter.
4. It prints a long string. Copy it.
5. Open `js/config.js`, paste it as the value of `passwordHash`, replacing the old one.
6. Save → commit/push (or re-upload that one file). Done.

The gate asks once per browser session (it re-asks when you fully close the tab/app).
Note: this is light protection suitable for a personal dashboard — someone technical
viewing the page source could work around it, so don't store true secrets here.

---

## Install to your phone

1. Open **demipolished.github.io/manifesting-me** in Safari (iPhone) or Chrome (Android).
2. Enter your password.
3. **iPhone:** tap Share → **Add to Home Screen.**
   **Android:** tap the ⋮ menu → **Install app / Add to Home Screen.**
4. It now opens full-screen like an app and works offline for reading.

---

## The weekly brief

Every Friday, your Cowork `tasia-weekly-brief` skill generates the upcoming week and
writes `data/brief.json`. Commit/push that one file and the app shows the new week
automatically (checkboxes reset for the new week; past weeks stay saved).

See **COWORK-SKILL-UPDATE.md** for the exact JSON format the skill should output.

---

## Your data

Everything you check and type is saved in your browser's localStorage, **per device** —
private to you, never uploaded anywhere. Your phone and laptop keep separate state.
Clearing your browser data will reset it, so it's worth not doing that on the device
you use most.
