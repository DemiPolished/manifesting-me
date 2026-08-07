/* practices.js — tap-to-expand "how to" guides for recurring spiritual practices.
 *
 * Loaded from index.html via:  <script src="data/practices.js" defer></script>
 * Guide content lives in data/practices.json.
 *
 * What it does: scans the page's rendered text for practice names/aliases
 * (Candle petition, Intention setting, SATS, Scovel Shinn decree,
 * Hand-on-heart), underlines the first mention of each WITHIN EACH TAB
 * (Brief, Spirit, …) as a tap target, and expands the full guided
 * instruction inline when tapped.
 *
 * The dashboard renders each tab's content only when that tab is first
 * opened, and the weekly brief arrives async from brief.json — so the
 * MutationObserver stays alive for the whole session (never disconnects)
 * and re-scans, debounced, whenever new content lands.
 */
(function () {
  "use strict";

  var STYLES =
    ".pg-toggle{border:none;background:none;padding:0 2px;cursor:pointer;font:inherit;" +
    "color:var(--brass-deep,inherit);text-decoration:underline dotted;text-underline-offset:3px}" +
    ".pg-panel{margin:8px 0;padding:12px 14px;border-left:2px solid var(--brass,currentColor);" +
    "font-size:0.92em;line-height:1.65;color:var(--charcoal-2,inherit)}" +
    ".pg-panel p{margin:0 0 10px}.pg-panel p:last-child{margin:0}" +
    ".pg-panel[hidden]{display:none}";

  /* One toggle per practice per tab. Key: practiceId + "::" + view id.
     Value: the toggle button, so we can re-mark if a repaint removed it. */
  var marked = {};

  function escRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* Straight or curly apostrophes both match; plural "s" tolerated. */
  function aliasPattern(name) {
    return escRe(name).replace(/'/g, "['’]") + "s?";
  }

  function practiceRegex(practice) {
    var names = [practice.name].concat(practice.aliases || []);
    return new RegExp("\\b(?:" + names.map(aliasPattern).join("|") + ")\\b", "i");
  }

  function viewOf(node) {
    var el = node.nodeType === 1 ? node : node.parentNode;
    var view = el && el.closest ? el.closest(".view") : null;
    return (view && view.id) || "page";
  }

  function buildPanel(practice) {
    var panel = document.createElement("div");
    panel.className = "pg-panel";
    panel.hidden = true;
    practice.how.forEach(function (para) {
      var p = document.createElement("p");
      p.textContent = para;
      panel.appendChild(p);
    });
    return panel;
  }

  function wrapMatch(textNode, practice, regex) {
    var m = regex.exec(textNode.nodeValue);
    if (!m) return null;
    var range = document.createRange();
    range.setStart(textNode, m.index);
    range.setEnd(textNode, m.index + m[0].length);
    var btn = document.createElement("button");
    btn.className = "pg-toggle";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "How to do this practice: " + practice.name);
    try {
      range.surroundContents(btn);
    } catch (e) {
      return null;
    }
    var panel = buildPanel(practice);
    var host = btn.closest(".action") ||
      btn.closest("p, li, h1, h2, h3, h4, h5, h6, div") || btn.parentNode;
    host.parentNode.insertBefore(panel, host.nextSibling);
    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
    return btn;
  }

  function scan(practices) {
    practices.forEach(function (practice) {
      var regex = practiceRegex(practice);
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue || !regex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
          var p = node.parentNode;
          if (!p || !p.closest) return NodeFilter.FILTER_REJECT;
          if (p.closest(".pg-panel, .pg-toggle, script, style, label, button, a, select, textarea"))
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      /* Collect first, then mutate — surroundContents splits text nodes
         and would confuse a live walk. */
      var nodes = [];
      var node;
      while ((node = walker.nextNode())) nodes.push(node);
      nodes.forEach(function (n) {
        if (!n.nodeValue || !document.contains(n)) return;
        var key = practice.id + "::" + viewOf(n);
        if (marked[key] && document.contains(marked[key])) return;
        var btn = wrapMatch(n, practice, regex);
        if (btn) marked[key] = btn;
      });
    });
  }

  function init() {
    var style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);
    fetch("data/practices.json")
      .then(function (r) {
        if (!r.ok) throw new Error("practices.json HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var practices = data.practices || [];
        var pending = null;
        var rescan = function () {
          if (pending) return;
          pending = setTimeout(function () {
            pending = null;
            scan(practices);
          }, 150);
        };
        scan(practices);
        /* Stays connected for the life of the page: tabs render on first
           open and the brief repaints on week switches, so there is no
           safe moment to stop watching. */
        new MutationObserver(rescan).observe(document.body, {
          childList: true,
          subtree: true,
        });
      })
      .catch(function (err) {
        console.warn("Practice guide unavailable:", err.message);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
