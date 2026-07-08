#!/usr/bin/env python3
"""
sync_brief.py — Notion (source of truth) -> data/brief.json (Manifesting Me dashboard)

Reads the ONE current week (isCurrent = true) from the Weekly Brief hub and its five
child tables, reassembles the exact brief.json schema the app consumes, and writes
data/brief.json. Runs in GitHub Actions (see .github/workflows/sync-brief.yml).

Requires env NOTION_TOKEN (a Notion internal integration token with the Personal hub
databases shared to it). No third-party packages — standard library only.
"""
import os, sys, json, urllib.request, urllib.error

TOKEN = os.environ.get("NOTION_TOKEN")
if not TOKEN:
    sys.exit("ERROR: NOTION_TOKEN not set")

# Notion API version that supports data_source query endpoints. If Notion changes this,
# update here (first-run smoke test will surface a version mismatch clearly).
NOTION_VERSION = "2025-09-03"
BASE = "https://api.notion.com/v1"

WEEKLY   = "046e274a-0a3d-4af7-8750-d7758e913c93"
DOMAINS  = "ec71ed80-38cd-48c0-9897-5a4c9e54fec1"
TRANSITS = "ad29811f-56df-474f-8686-83fe9fb65202"
CONTENT  = "ad7a6594-5c60-4707-8bfb-938d01eedc70"
RADAR    = "6c58a6fa-6583-407e-9f96-3fcc2ba50208"
DAYS     = "ddb21ad5-94ad-4716-a0c2-55fa72c2c2aa"

DOMAIN_ORDER = ["health", "abundance", "business", "love", "home"]
TRACK_ORDER  = ["dp", "bggg", "shoot"]


def api(path, body):
    req = urllib.request.Request(
        BASE + path, data=json.dumps(body).encode("utf-8"), method="POST",
        headers={"Authorization": "Bearer " + TOKEN,
                 "Notion-Version": NOTION_VERSION,
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit("Notion API %s on %s: %s" % (e.code, path, e.read().decode()[:500]))
    except Exception as e:
        sys.exit("Notion request failed on %s: %s" % (path, e))


def query(ds, filt=None, sorts=None):
    out, cursor = [], None
    while True:
        body = {}
        if filt:   body["filter"] = filt
        if sorts:  body["sorts"] = sorts
        if cursor: body["start_cursor"] = cursor
        d = api("/data_sources/%s/query" % ds, body)
        out += d.get("results", [])
        if d.get("has_more"):
            cursor = d.get("next_cursor")
        else:
            break
    return out


def val(page, name):
    p = (page.get("properties") or {}).get(name)
    if not p:
        return None
    t = p.get("type")
    if t == "title":     return "".join(x.get("plain_text", "") for x in p["title"])
    if t == "rich_text": return "".join(x.get("plain_text", "") for x in p["rich_text"])
    if t == "checkbox":  return bool(p["checkbox"])
    if t == "number":    return p["number"]
    if t == "select":    return (p["select"] or {}).get("name")
    if t == "date":      return (p["date"] or {}).get("start")
    if t == "relation":  return [r["id"] for r in p["relation"]]
    return None


def day_of_month(iso):
    if not iso:
        return ""
    try:
        return str(int(iso[8:10]))   # "2026-07-05" -> "5"
    except Exception:
        return iso


# 1) find the ONE current week — STOP if zero or many (never publish an ambiguous week)
weeks = query(WEEKLY, filt={"property": "isCurrent", "checkbox": {"equals": True}})
if len(weeks) != 1:
    sys.exit("ERROR: expected exactly 1 week with isCurrent=true, found %d. Not publishing."
             % len(weeks))
wk = weeks[0]
wid = wk["id"]
rel = {"property": "week", "relation": {"contains": wid}}
order = [{"property": "sortOrder", "direction": "ascending"}]

dom = query(DOMAINS,  rel, order)
tra = query(TRANSITS, rel, order)
con = query(CONTENT,  rel, order)
rad = query(RADAR,    rel, order)
day = query(DAYS,     rel, order)

domains = {}
for d in DOMAIN_ORDER:
    acts = [val(r, "action") for r in dom if val(r, "domain") == d]
    domains[d] = {"ring": len(acts), "actions": acts}

content = {t: [val(r, "item") for r in con if val(r, "track") == t] for t in TRACK_ORDER}

days = [{"dow": val(r, "dow"), "date": day_of_month(val(r, "date")),
         "phase": val(r, "phase") or "", "sign": val(r, "sign") or "",
         "flag": val(r, "flag") or ""} for r in day]
if not days:
    print("WARNING: 'Brief — Days' empty for this week; calendar strip will be blank (days: []).",
          file=sys.stderr)

brief = {
    "weekOf":      val(wk, "weekOf") or "",
    "generated":   (val(wk, "generated") or "")[:10],
    "energyTone":  val(wk, "energyTone") or "",
    "toneNote":    val(wk, "toneNote") or "",
    "quarterTheme": val(wk, "quarterTheme") or "",
    "days":        days,
    "lunar": {
        "event":   val(wk, "lunarEvent") or "",
        "sign":    val(wk, "lunarSign") or "",
        "weather": val(wk, "lunarWeather") or "",
    },
    "transits": [{"flag": bool(val(r, "flag")), "title": val(r, "title") or "",
                  "note": val(r, "note") or ""} for r in tra],
    "domains":  domains,
    "content":  content,
    "founderHour": val(wk, "founderHour") or "",
    "spiritual":   val(wk, "spiritual") or "",
    "mantra":      val(wk, "mantra") or "",
    "radar": [val(r, "item") for r in rad],
}

os.makedirs("data", exist_ok=True)
with open("data/brief.json", "w", encoding="utf-8") as f:
    json.dump(brief, f, ensure_ascii=False, indent=2)

print("Built data/brief.json for:", brief["weekOf"],
      "| days:", len(days), "| domains:", {k: domains[k]["ring"] for k in DOMAIN_ORDER})

gh_out = os.environ.get("GITHUB_OUTPUT")
if gh_out:
    with open(gh_out, "a") as f:
        f.write("weekOf=%s\n" % brief["weekOf"])
