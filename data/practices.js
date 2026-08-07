/* practices.js — tap-to-expand "how to" guides for recurring spiritual practices.
 *
 * INSTALL (2 steps):
 *   1. Commit data/practices.json and this file to the repo root.
 *   2. Add before </body> in index.html:  <script src="practices.js" defer></script>
 *
 * What it does: after the brief renders, it scans the page's text for practice
 * names/aliases (Candle petition, Intention setting, SATS, Scovel Shinn decree,
 * Hand-on-heart), marks the first mention of each with a small ⓘ toggle, and
 * expands the full guided instruction inline when tapped. No dependencies, no
 * framework assumptions — works on any static DOM. If the dashboard renders
 * asynchronously, it re-scans on DOM changes for 10 seconds after load.
 */
(function () {
  "use strict";

  var STYLES =
    ".pg-toggle{border:none;background:none;padding:0 2px;cursor:pointer;font:inherit;color:inherit;" +
    "text-decoration:underline dotted;text-underline-offset:3px}" +
    ".pg-panel{margin:8px 0;padding:12px 14px;border-left:2px solid currentColor;border-radius:0;" +
    "font-size:0.92em;line-height:1.65;opacity:0.92}" +
    ".pg-panel p{margin:0 0 10px}.pg-panel p:last-child{margin:0}" +
    ".pg-panel[hidden]{display:none}";

  var seen = {};

  function esc(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    if (!m) return false;
    var range = document.createRange();
    range.setStart(textNode, m.index);
    range.setEnd(textNode, m.index + m[0].length);
    var btn = document.createElement("button");
    btn.className = "pg-toggle";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "How to do this practice: " + practice.name);
    range.surroundContents(btn);
    var panel = buildPanel(practice);
    var host = btn.closest("p, li, div") || btn.parentNode;
    host.parentNode.insertBefore(panel, host.nextSibling);
    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
    return true;
  }

  function scan(practices) {
    practices.forEach(function (practice) {
      if (seen[practice.id]) return;
      var names = [practice.name].concat(practice.aliases || []);
      var regex = new RegExp("(" + names.map(esc).join("|") + ")", "i");
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue || !regex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
          if (node.parentNode.closest(".pg-panel, .pg-toggle, script, style")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      var node = walker.nextNode();
      if (node && wrapMatch(node, practice, regex)) seen[practice.id] = true;
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
        scan(practices);
        var observer = new MutationObserver(function () {
          scan(practices);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () {
          observer.disconnect();
        }, 10000);
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
