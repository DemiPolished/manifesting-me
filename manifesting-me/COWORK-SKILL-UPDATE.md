# Weekly Brief Skill — Updated Output Format

Your `tasia-weekly-brief` Cowork skill currently renders an HTML widget. To feed the
**Manifesting Me** app, it now also needs to write a `brief.json` file in the exact shape
the app reads. Add the section below to the skill (replace Step 11, or add a Step 11b).

The app reads `data/brief.json`. Every Friday, the skill should produce this file and you
commit it to the repo (or, once you wire up a token, the skill pushes it for you).

---

## Step 11b — Emit brief.json (for the Manifesting Me app)

After generating the brief content, write it to `data/brief.json` using **exactly** this schema.
Every key is required (use an empty array `[]` or empty string if truly nothing applies).

```json
{
  "weekOf": "June 28 – July 4, 2026",
  "generated": "2026-06-26",
  "energyTone": "Harvest",
  "toneNote": "One or two sentences on the week's pacing.",
  "quarterTheme": "Personal Year / quarter framing — one line.",
  "lunar": {
    "event": "Full Moon in Capricorn — Mon June 29, 7:57pm EDT (8°14′ Capricorn)",
    "sign": "Where the moon travels this week, in plain language.",
    "weather": "2–4 sentences, chart-specific. House it lands in, what it asks of her."
  },
  "transits": [
    { "flag": true,  "title": "Jupiter enters Leo — Mon June 29", "note": "Why it matters for HER chart." },
    { "flag": false, "title": "Sun in Cancer opposing Moon",      "note": "Lighter note." }
  ],
  "domains": {
    "health":    { "ring": 3, "actions": ["...", "...", "..."] },
    "abundance": { "ring": 3, "actions": ["somatic...", "mindset/TBM...", "practical..."] },
    "business":  { "ring": 3, "actions": ["DP...", "BGGG (on-mission)...", "Communion Skin..."] },
    "love":      { "ring": 2, "actions": ["...", "..."] },
    "home":      { "ring": 2, "actions": ["...", "..."] }
  },
  "content": {
    "dp":    ["Day + task", "...", "..."],
    "bggg":  ["Day + task", "...", "..."],
    "shoot": ["Friday", "...", "..."]
  },
  "founderHour": "One italic-style first-person question. 10 min, by hand, no editing.",
  "spiritual": "One practice for the lunar phase. Christian prayer anchors, Hoodoo seals.",
  "mantra": "One line. Present tense. Sounds like Tasia.",
  "radar": [
    "Date — event — one sentence why it matters for her chart.",
    "..."
  ]
}
```

### Rules that keep the app happy
- **`weekOf`** drives the per-week checkbox keys. Keep the format consistent
  (`"Month D – Month D, YYYY"`); when it changes, the new week starts with fresh checkboxes
  and the prior week stays saved.
- **`energyTone`** is one of: `Plant`, `Build`, `Harvest`, `Release`.
- **`domains`** must use exactly these five keys: `health`, `abundance`, `business`, `love`, `home`.
  Each `actions` array is what becomes the checkable list + progress ring.
- **`transits[].flag`** = `true` shows a brass "Flag" pill; `false` shows a muted "Note" pill.
- The **Spirituality tab** reads `lunar.*`, and the **Love tab** auto-pulls any transit whose
  title/note mentions Venus, Jupiter, 7th house, partnership, or love — so phrase those notes
  naturally and they'll surface in the right places automatically.
- Keep all content **chart-specific** and in Tasia's voice — the app is just the vessel.

### Where it goes
Write to the repo at `data/brief.json`, overwriting the previous week. The service worker
fetches it network-first, so the newest brief shows as soon as she opens the app online,
and the last-synced one is available offline.

> You can keep rendering the HTML widget too if you like seeing it inline in Cowork —
> just add the JSON write as an additional output. The app only needs the JSON.
