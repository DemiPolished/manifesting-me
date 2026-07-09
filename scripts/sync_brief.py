#!/usr/bin/env python3
"""
sync_brief.py — Notion (source of truth) -> data/brief.json (+ weekly archive)

Reads the current week (isCurrent = true) and publishes it to data/brief.json.
ALSO rebuilds a full archive from Notion's history each run:
  - data/weeks/<YYYY-MM-DD>.json  (one file per week)
  - data/weeks/index.json         (list of weeks, newest first, for the app's picker)
The archive is regenerated from Notion every run and rides along in the Pages deploy,
so no commit-back is needed.

Requires env NOTION_TOKEN (a Notion internal integration token with the Personal hub
databases shared to it). Standard library only.
"""
import os, re, sys, json, urllib.request, urllib.error

TOKEN = os.environ.get("NOTION_TOKEN")
if not TOKEN:
    sys.exit("ERROR: NOTION_TOKEN not set")

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


def query(ds):
    """Return ALL rows of a data source (paginated)."""
    out, cursor = [], None
    while True:
        body = {}
        if cursor:
            body["start_cursor"] = cursor
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


def num(r):
    return val(r, "sortOrder") if val(r, "sortOrder") is not None else 0


def day_of_month(iso):
    if not iso:
        return ""
    try:
        return str(int(iso[8:10]))
    except Exception:
        return iso


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", (s or "week").lower()).strip("-") or "week"


# ---- fetch everything once ----
weeks_all = query(WEEKLY)
dom_all = query(DOMAINS)
tra_all = query(TRANSITS)
con_all = query(CONTENT)
rad_all = query(RADAR)
day_all = query(DAYS)


def children(rows, wid):
    return sorted([r for r in rows if wid in (val(r, "week") or [])], key=num)


def assemble(wk):
    wid = wk["id"]
    dom = children(dom_all, wid)
    tra = children(tra_all, wid)
    con = children(con_all, wid)
    rad = children(rad_all, wid)
    day = children(day_all, wid)

    domains = {}
    for d in DOMAIN_ORDER:
        acts = [val(r, "action") for r in dom if val(r, "domain") == d]
        domains[d] = {"ring": len(acts), "actions": acts}

    content = {t: [val(r, "item") for r in con if val(r, "track") == t] for t in TRACK_ORDER}

    days = [{"dow": val(r, "dow"), "date": day_of_month(val(r, "date")),
             "phase": val(r, "phase") or "", "sign": val(r, "sign") or "",
             "flag": val(r, "flag") or ""} for r in day]

    week_start = ""
    if day:
        iso = val(day[0], "date")
        week_start = (iso or "")[:10]

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
    return brief, week_start


# ---- current week -> data/brief.json ----
current = [w for w in weeks_all if val(w, "isCurrent")]
if len(current) != 1:
    sys.exit("ERROR: expected exactly 1 week with isCurrent=true, found %d. Not publishing."
             % len(current))
cur_brief, _ = assemble(current[0])

os.makedirs("data", exist_ok=True)
with open("data/brief.json", "w", encoding="utf-8") as f:
    json.dump(cur_brief, f, ensure_ascii=False, indent=2)

# ---- full archive -> data/weeks/*.json + index.json ----
os.makedirs("data/weeks", exist_ok=True)
index = []
for wk in weeks_all:
    b, ws = assemble(wk)
    key = ws or slug(b["weekOf"])
    fname = key + ".json"
    with open("data/weeks/" + fname, "w", encoding="utf-8") as f:
        json.dump(b, f, ensure_ascii=False, indent=2)
    index.append({"weekOf": b["weekOf"], "weekStart": ws or "",
                  "file": fname, "current": bool(val(wk, "isCurrent"))})

index.sort(key=lambda x: (x["weekStart"] or "0000-00-00"), reverse=True)
with open("data/weeks/index.json", "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print("Built brief.json for:", cur_brief["weekOf"],
      "| archived", len(index), "week(s) | days:", len(cur_brief["days"]))

gh_out = os.environ.get("GITHUB_OUTPUT")
if gh_out:
    with open(gh_out, "a") as f:
        f.write("weekOf=%s\n" % cur_brief["weekOf"])
