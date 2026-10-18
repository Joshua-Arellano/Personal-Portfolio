/* ===========================================================================
   josh-a.dev — app.js
   ---------------------------------------------------------------------------
   Loaded by index.html with <script src="app.js" defer></script>, so `defer`
   guarantees the DOM is parsed before this runs — the code below never waits
   for DOMContentLoaded.

   The saved-theme bootstrap deliberately stays inline in index.html: it has to
   run before first paint, and a deferred file would be too late (flash of the
   wrong theme).
   =========================================================================== */

/* ===========================================================================
   SITE SCRIPT
   ---------------------------------------------------------------------------
   All progressive enhancement, wrapped in one IIFE. With JS off the page is
   still complete; with it on, themes, the JS switch, the clock, project
   filtering, scroll-spy, the contribution heatmap, the terminal and the
   keyboard shortcuts all come alive.
   =========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var store = {
    get: function (k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
  };

  /* Shared content, so the terminal and the résumé export stay in one place. */
  var SITE = {
    name: "Joshua Arellano",
    host: "josh-a.dev",
    email: "contact@josh-a.dev",
    github: "https://github.com/Joshua-Arellano",
    linkedin: "https://www.linkedin.com/in/josh-a--dev/",
    stackoverflow: "https://stackoverflow.com/users/33202939/josh-a",
    sections: [
      { id: "home", label: "Home" },
      { id: "about", label: "About Me" },
      { id: "skills", label: "Skills" },
      { id: "projects", label: "Projects" },
      { id: "resume", label: "Résumé" },
      { id: "blog", label: "Blog" },
      { id: "contact", label: "Contact" },
    ],
  };

  /* The full omarchy theme roster, in menu order. */
  var THEMES = [
    { id: "tokyo-night", bg: "#1a1b26" },
    { id: "catppuccin", bg: "#1e1e2e" },
    { id: "catppuccin-latte", bg: "#eff1f5" },
    { id: "ethereal", bg: "#060b1e" },
    { id: "everforest", bg: "#2d353b" },
    { id: "flexoki-light", bg: "#fffcf0" },
    { id: "gruvbox", bg: "#282828" },
    { id: "hackerman", bg: "#0b0c16" },
    { id: "kanagawa", bg: "#1f1f28" },
    { id: "last-horizon", bg: "#0c0b0c" },
    { id: "lumon", bg: "#16242d" },
    { id: "lupine", bg: "#fafafa" },
    { id: "matte-black", bg: "#121212" },
    { id: "miasma", bg: "#222222" },
    { id: "nord", bg: "#2e3440" },
    { id: "osaka-jade", bg: "#111c18" },
    { id: "retro-82", bg: "#05182e" },
    { id: "ristretto", bg: "#2c2525" },
    { id: "rose-pine", bg: "#faf4ed" },
    { id: "solitude", bg: "#101315" },
    { id: "vantablack", bg: "#000000" },
    { id: "white", bg: "#ffffff" },
  ];

  function themeBg(id) {
    for (var i = 0; i < THEMES.length; i++)
      if (THEMES[i].id === id) return THEMES[i].bg;
    return "#1a1b26";
  }

  /* =========================================================================
     1 · THEME
     ========================================================================= */
  var themeSelect = $("theme-select");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(id, persist) {
    if (
      !THEMES.some(function (t) {
        return t.id === id;
      })
    )
      id = "tokyo-night";
    root.setAttribute("data-theme", id);
    if (themeSelect) themeSelect.value = id;
    if (themeMeta) themeMeta.setAttribute("content", themeBg(id));
    if (persist !== false) store.set("josh-a.dev:theme", id);
  }

  if (themeSelect) {
    /* Build the option list from the single THEMES array. */
    themeSelect.innerHTML = "";
    THEMES.forEach(function (t) {
      var o = document.createElement("option");
      o.value = t.id;
      o.textContent = t.id;
      themeSelect.appendChild(o);
    });
    themeSelect.addEventListener("change", function () {
      applyTheme(themeSelect.value);
    });
    applyTheme(root.getAttribute("data-theme") || "tokyo-night", false);
  }

  function cycleTheme(dir) {
    var cur = root.getAttribute("data-theme");
    var i = 0;
    THEMES.forEach(function (t, n) {
      if (t.id === cur) i = n;
    });
    applyTheme(
      THEMES[(i + (dir || 1) + THEMES.length) % THEMES.length].id,
    );
  }
  function randomTheme() {
    var cur = root.getAttribute("data-theme"),
      pick = cur;
    while (pick === cur)
      pick = THEMES[Math.floor(Math.random() * THEMES.length)].id;
    applyTheme(pick);
  }

  /* =========================================================================
     2 · THE JAVASCRIPT SWITCH
     ---------------------------------------------------------------------------
     Flips `data-js`, which hides `.js-only` chrome and swaps the heatmap for a
     plain note. It demonstrates the "works without JS, enhances with it" idea
     without needing to actually disable the browser.
     ========================================================================= */
  var jsToggle = $("js-toggle");
  var jsOn = store.get("josh-a.dev:js") !== "0";

  function setJs(on) {
    jsOn = !!on;
    root.setAttribute("data-js", jsOn ? "on" : "off");
    if (jsToggle)
      jsToggle.setAttribute("aria-checked", jsOn ? "true" : "false");
    store.set("josh-a.dev:js", jsOn ? "1" : "0");
    if (jsOn) {
      startClock();
      loadGraph();
    } else {
      stopClock();
      unbuildGraph();
    }
  }
  if (jsToggle)
    jsToggle.addEventListener("click", function () {
      setJs(!jsOn);
    });

  /* =========================================================================
     3 · CLOCK (header)
     ========================================================================= */
  var clockEl = $("clock");
  var clockTimer = null;
  function tick() {
    if (!clockEl) return;
    var d = new Date(),
      p = function (n) {
        return String(n).padStart(2, "0");
      };
    clockEl.textContent =
      p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  function startClock() {
    if (!clockEl || clockTimer) return;
    tick();
    clockTimer = setInterval(tick, 1000);
  }
  function stopClock() {
    if (clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  }

  /* =========================================================================
     4 · NAVIGATION — jump, scroll-spy, progress rail
     ========================================================================= */
  var navLinks = Array.from(document.querySelectorAll("[data-nav]"));
  var sectionEls = SITE.sections
    .map(function (s) {
      return $(s.id);
    })
    .filter(Boolean);

  /* Jump to a section. Every route in — nav click, number key, terminal `open` —
     funnels through here, and each one claims the nav highlight, so the item you
     asked for always lights up no matter how the scroll lands. */
  function goTo(id) {
    claimSection(id);
    var el = $(id);
    if (el)
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
  }

  var header = document.querySelector(".topbar");
  var progressBar = $("progress-bar");
  var footerEl = document.querySelector("footer.site");

  /* Anchor offset. The header grows when the nav wraps onto a second row on
     phones, so measure it and hand the number to scroll-padding-top; anchor
     jumps and scrollIntoView() then land exactly below the bar. */
  function headerOffset() {
    return (header ? header.offsetHeight : 52) + 12;
  }
  function measureHeader() {
    root.style.scrollPaddingTop = headerOffset() + "px";
  }

  /* Distance scrolled, whichever element ended up being the scroller. */
  function scrollTop() {
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  }

  /* Marks the one link pointing at `value` and clears the rest — shared by the
     section nav and the blog table of contents. */
  function markCurrent(links, attr, value) {
    links.forEach(function (el) {
      el.setAttribute(
        "aria-current",
        el.getAttribute(attr) === value ? "true" : "false",
      );
    });
  }

  function setActive(id) {
    markCurrent(navLinks, "data-nav", id);
  }

  /* Geometry comes from rects rather than scroll offsets, so the spy stays
     correct regardless of which element is actually scrolling the page. */
  function atBottom() {
    var last = footerEl || sectionEls[sectionEls.length - 1];
    return last
      ? last.getBoundingClientRect().bottom <= window.innerHeight + 8
      : false;
  }

  /* Scroll-spy for manual scrolling: the last section whose top has passed a
     line just under the header is "where you are". Keeping the line near the
     top (rather than the middle) is what makes short sections behave. */
  function spyFromScroll() {
    var line = headerOffset() + 8;
    var current = sectionEls[0].id,
      i;
    for (i = 0; i < sectionEls.length; i++) {
      if (sectionEls[i].getBoundingClientRect().top - line <= 1)
        current = sectionEls[i].id;
      else break;
    }
    /* Blog and Contact are short, so at the floor their tops never reach the
 line; take the last one still on screen instead of the tall Résumé panel
 that happens to sit above them. */
    if (atBottom()) {
      for (i = 0; i < sectionEls.length; i++) {
        if (
          sectionEls[i].getBoundingClientRect().top < window.innerHeight
        )
          current = sectionEls[i].id;
      }
    }
    return current;
  }

  /* A jump owns the highlight — through the smooth scroll, and for as long as
     the page stays where it landed. That matters because Blog and Contact are
     too short to scroll up to the header, so those jumps clamp at the bottom of
     the document; the spy must not second-guess them.
     Release is positional, not event-based: the lock only lifts once the target
     has left the header and we are no longer at the floor, i.e. once the user
     has genuinely scrolled somewhere else. */
  var clickedId = null,
    lockUntil = 0;

  function claimSection(id) {
    clickedId = id;
    lockUntil = performance.now() + 900; /* outlast the smooth scroll */
    setActive(id);
  }

  function updateSpy() {
    if (!sectionEls.length) return;
    if (clickedId) {
      var el = $(clickedId);
      var arrived =
        el &&
        Math.abs(el.getBoundingClientRect().top - headerOffset()) <= 8;
      if (arrived || atBottom() || performance.now() < lockUntil) {
        setActive(clickedId);
        return;
      }
      clickedId = null; /* the user moved on */
    }
    setActive(spyFromScroll());
  }

  /* Nav clicks claim the highlight, and the URL hash does too — a plain anchor
     click always changes it, so the right item lights up even if a click event
     is ever missed (keyboard activation, back/forward, a middle-click). */
  navLinks.forEach(function (a) {
    a.addEventListener("click", function () {
      claimSection(a.getAttribute("data-nav"));
    });
  });
  window.addEventListener("hashchange", function () {
    var id = (location.hash || "").slice(1);
    if (
      SITE.sections.some(function (s) {
        return s.id === id;
      })
    )
      claimSection(id);
  });

  function updateProgress() {
    if (!progressBar) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.height =
      (h > 0 ? (scrollTop() / h) * 100 : 0).toFixed(1) + "%";
  }

  var ticking = false;
  function onScrollFrame() {
    ticking = false;
    updateSpy();
    updateProgress();
  }
  function requestFrame() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }

  measureHeader();
  window.addEventListener("scroll", requestFrame, { passive: true });
  /* A resize is deliberate, so it re-evaluates. `load` and fonts only
     re-measure the header — they must never release a click lock, or a click
     made while the page is still loading would be overridden. */
  window.addEventListener("resize", function () {
    clickedId = null;
    measureHeader();
    requestFrame();
  });
  window.addEventListener("load", function () {
    measureHeader();
    requestFrame();
  });
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(function () {
      measureHeader();
      requestFrame();
    });
  requestFrame();

  /* =========================================================================
     5 · SCROLL REVEAL
     ========================================================================= */
  var reveals = Array.from(document.querySelectorAll(".js-reveal"));
  if ("IntersectionObserver" in window && reveals.length) {
    var ro = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            ro.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    reveals.forEach(function (el) {
      ro.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* =========================================================================
     6 · PROJECT FILTERING
     ========================================================================= */
  var fbtns = Array.from(document.querySelectorAll(".fbtn"));
  var cards = Array.from(document.querySelectorAll("#pgrid > *"));
  var fcount = $("filter-count");

  function applyFilter(tag) {
    var shown = 0;
    cards.forEach(function (c) {
      var tags = (c.getAttribute("data-tags") || "").split(/\s+/);
      var ok = tag === "all" || tags.indexOf(tag) !== -1;
      c.hidden = !ok;
      if (ok) shown++;
    });
    fbtns.forEach(function (b) {
      b.setAttribute(
        "aria-pressed",
        String(b.getAttribute("data-filter") === tag),
      );
    });
    if (fcount)
      fcount.textContent = "showing " + shown + " / " + cards.length;
  }
  fbtns.forEach(function (b) {
    b.addEventListener("click", function () {
      applyFilter(b.getAttribute("data-filter"));
    });
  });
  if (fbtns.length) applyFilter("all");

  /* =========================================================================
     7 · GITHUB CONTRIBUTION BLOCK
     ---------------------------------------------------------------------------
     Live data from GitHub's public contribution calendar, read through the
     free github-contributions-api. The calendar is not exposed by the REST
     API, and the GraphQL one needs a token we must not ship in a static file;
     this endpoint answers with `access-control-allow-origin: *`, so a plain
     fetch() works from any static host.

     It degrades in two steps: a good result is cached and reused until the
     refresh button is pressed, and if the request fails — offline, or blocked
     from file:// — a clearly-labelled sample keeps the panel's shape instead
     of leaving an empty box.
     ========================================================================= */
  var ghUser = "Joshua-Arellano";
  var ghEndpoint =
    "https://github-contributions-api.jogruber.de/v4/" + ghUser + "?y=last";
  var ghGrid = $("gh-grid"),
    ghMonths = $("gh-months"),
    ghStats = $("gh-stats"),
    ghNote = $("gh-note"),
    ghRefresh = $("gh-refresh");

  var MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  var ghBusy = false,
    ghLive = null,
    ghTimer = null;

  function levelFor(n) {
    return n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4;
  }
  function isoDate(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }
  function localDate(iso) {
    /* "YYYY-MM-DD" alone parses as UTC, which shifts the weekday for anyone
       west of Greenwich; appending a time makes it local, which is what the
       calendar wants. */
    return new Date(iso + "T00:00:00");
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* The offline sample: deterministic, so the panel is identical between
     reloads and nobody mistakes a flicker for real activity. */
  function sampleDays() {
    var rand = mulberry32(20261018),
      today = new Date(),
      out = [];
    today.setHours(0, 0, 0, 0);
    /* Snap the start back to a Sunday so row 0 is Sunday and the months line
       up, exactly like the live calendar. */
    var cursor = new Date(today);
    cursor.setDate(cursor.getDate() - 370);
    cursor.setDate(cursor.getDate() - cursor.getDay());
    while (cursor <= today) {
      var dow = cursor.getDay();
      var damp = dow === 0 || dow === 6 ? 0.45 : 1;
      var count = rand() < 0.22 ? 0 : Math.floor(rand() * 13 * damp) + 1;
      out.push({ date: isoDate(cursor), count: count, level: levelFor(count) });
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  /* Whatever the API hands back, settle on [{date, count, level}] in order. */
  function normaliseCalendar(json) {
    var list = (json && json.contributions) || [],
      out = [];
    for (var i = 0; i < list.length; i++) {
      var day = list[i];
      if (!day || !day.date) continue;
      var count = Number(day.count) || 0;
      var level = Number(day.level);
      if (!(level >= 0 && level <= 4)) level = levelFor(count);
      out.push({
        date: String(day.date).slice(0, 10),
        count: count,
        level: level,
      });
    }
    out.sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });
    return out;
  }

  function summarise(days) {
    var total = 0,
      longest = 0,
      run = 0,
      i;
    for (i = 0; i < days.length; i++) {
      total += days[i].count;
      if (days[i].count > 0) {
        run++;
        if (run > longest) longest = run;
      } else run = 0;
    }
    /* Current streak: walk back from the newest day, tolerating a single blank
       today (the day is not over) — the same reading GitHub shows. */
    var current = 0;
    for (i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) current++;
      else if (i < days.length - 1) break;
    }
    return { total: total, longest: longest, current: current };
  }

  function renderGraph(days, source) {
    if (!ghGrid || !days.length) return;

    /* Pad the first column so row 0 is always Sunday. */
    var pad = localDate(days[0].date).getDay(),
      cells = [],
      i;
    for (i = 0; i < pad; i++) cells.push(null);
    for (i = 0; i < days.length; i++) cells.push(days[i]);

    var frag = document.createDocumentFragment(),
      ticks = [],
      lastMonth = -1;
    for (i = 0; i < cells.length; i++) {
      var cell = document.createElement("span");
      cell.className = "cell";
      var day = cells[i];
      if (!day) {
        cell.setAttribute("data-lvl", "0");
        cell.style.opacity = "0";
      } else {
        cell.setAttribute("data-lvl", String(day.level));
        cell.title =
          day.count +
          " contribution" +
          (day.count === 1 ? "" : "s") +
          " on " +
          day.date;
        var month = localDate(day.date).getMonth();
        if (month !== lastMonth) {
          lastMonth = month;
          /* the grid fills column-major, so the column is floor(i / 7) */
          ticks.push({ col: Math.floor(i / 7), name: MONTHS[month] });
        }
      }
      frag.appendChild(cell);
    }
    ghGrid.innerHTML = "";
    ghGrid.appendChild(frag);

    if (ghMonths) {
      ghMonths.innerHTML = "";
      ghMonths.style.gridTemplateColumns =
        "repeat(" + Math.ceil(cells.length / 7) + ", minmax(0,1fr))";
      ticks.forEach(function (t) {
        var span = document.createElement("span");
        span.textContent = t.name;
        span.style.gridColumn = String(t.col + 1);
        ghMonths.appendChild(span);
      });
    }

    var s = summarise(days);
    if (ghStats) {
      ghStats.innerHTML =
        "<div><b>" +
        s.total.toLocaleString("en") +
        "</b><span>contributions</span></div>" +
        "<div><b>" +
        s.longest +
        "</b><span>longest streak</span></div>" +
        "<div><b>" +
        s.current +
        "</b><span>current streak</span></div>";
    }
    if (ghNote) {
      ghNote.textContent =
        "$ gh activity --user " +
        ghUser +
        (source === "live" ? "  # live from github" : "  # sample, no network");
      ghNote.classList.toggle("is-live", source === "live");
    }
    var daysWord = function (n) {
      return n === 1 ? " day" : " days";
    };
    ghGrid.setAttribute(
      "aria-label",
      "GitHub contributions for " +
        ghUser +
        ": " +
        s.total +
        " in the last year, longest streak " +
        s.longest +
        daysWord(s.longest) +
        ", current streak " +
        s.current +
        daysWord(s.current),
    );
  }

  /* Fetch once and reuse; `force` is the refresh button. */
  function loadGraph(force) {
    if (!ghGrid) return;
    if (!jsOn) {
      unbuildGraph();
      return;
    }
    if (ghLive && !force) {
      renderGraph(ghLive, "live");
      return;
    }
    if (ghBusy) return;
    ghBusy = true;
    if (ghRefresh) ghRefresh.setAttribute("data-busy", "");
    if (ghNote) {
      ghNote.textContent = "$ gh activity --user " + ghUser + "  # fetching…";
      ghNote.classList.remove("is-live");
    }

    var ctrl =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    if (ctrl)
      ghTimer = setTimeout(function () {
        ctrl.abort();
      }, 8000);

    fetch(ghEndpoint, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (res) {
        if (!res.ok) throw new Error("status " + res.status);
        return res.json();
      })
      .then(function (json) {
        var days = normaliseCalendar(json);
        if (!days.length) throw new Error("empty calendar");
        ghLive = days;
        renderGraph(days, "live");
      })
      .catch(function () {
        /* Nothing reachable — keep the shape with an obvious sample, unless a
           good result is already cached. */
        renderGraph(ghLive || sampleDays(), ghLive ? "live" : "sample");
      })
      .then(function () {
        ghBusy = false;
        if (ghTimer) {
          clearTimeout(ghTimer);
          ghTimer = null;
        }
        if (ghRefresh) ghRefresh.removeAttribute("data-busy");
      });
  }

  if (ghRefresh)
    ghRefresh.addEventListener("click", function () {
      loadGraph(true);
    });

  /* Used when the JS switch is off: leave a readable placeholder instead. */
  function unbuildGraph() {
    if (ghGrid) {
      ghGrid.innerHTML = "";
      ghGrid.setAttribute(
        "aria-label",
        "Contribution graph hidden while JavaScript is off",
      );
    }
    if (ghMonths) ghMonths.innerHTML = "";
    if (ghStats)
      ghStats.innerHTML =
        '<span class="gh-note">Enable the JS switch to render the contribution graph.</span>';
    if (ghNote) {
      ghNote.textContent = "$ gh activity --user " + ghUser + "  # paused";
      ghNote.classList.remove("is-live");
    }
  }

  /* =========================================================================
     8 · OVERLAYS + TERMINAL
     ========================================================================= */
  var overlays = { terminal: $("terminal"), keys: $("keys") };
  var lastFocus = null;

  function openOverlay(name) {
    var el = overlays[name];
    if (!el) return;
    lastFocus = document.activeElement;
    el.classList.add("open");
    if (name === "terminal") {
      termBoot();
      var inp = $("term-input");
      if (inp) inp.focus();
      termToEnd();
    } else {
      var b = el.querySelector("[data-close]");
      if (b) b.focus();
    }
  }
  function closeOverlay(name) {
    var el = overlays[name];
    if (!el) return;
    el.classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function closeAll() {
    Object.keys(overlays).forEach(function (n) {
      if (overlays[n] && overlays[n].classList.contains("open"))
        closeOverlay(n);
    });
  }
  function anyOpen() {
    return Object.keys(overlays).some(function (n) {
      return overlays[n] && overlays[n].classList.contains("open");
    });
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-close]"),
    function (b) {
      b.addEventListener("click", function () {
        closeOverlay(b.getAttribute("data-close"));
      });
    },
  );
  Object.keys(overlays).forEach(function (n) {
    var el = overlays[n];
    if (el)
      el.addEventListener("click", function (e) {
        if (e.target === el) closeOverlay(n);
      });
  });
  var ot = $("open-terminal");
  if (ot)
    ot.addEventListener("click", function () {
      openOverlay("terminal");
    });
  var ok = $("open-keys");
  if (ok)
    ok.addEventListener("click", function () {
      openOverlay("keys");
    });

  /* --- terminal ------------------------------------------------------------ */
  var termBody = $("term-body"),
    termForm = $("term-form"),
    termInput = $("term-input");
  var history = [],
    hIndex = -1,
    booted = false;

  function termToEnd() {
    if (termBody) termBody.scrollTop = termBody.scrollHeight;
  }
  function escapeHtml(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* `html` is always authored here, never user input. */
  function termWrite(html) {
    if (!termBody) return;
    var line = document.createElement("div");
    line.innerHTML = html;
    termBody.appendChild(line);
    termToEnd();
  }
  function termEcho(cmd) {
    termWrite(
      '<span class="t-brand">josh@josh-a.dev</span><span class="t-muted">:~$</span> <span class="t-strong"></span>',
    );
    termBody.lastChild.lastChild.textContent =
      cmd; /* textContent = no injection */
  }

  var HELP = [
    ["help", "show this list"],
    ["whoami", "who is behind this site"],
    ["about", "the short bio"],
    ["skills", "languages, frameworks, databases, tools"],
    ["projects", "what I have built"],
    ["ls", "list sections"],
    ["open <section>", "scroll to a section"],
    ["theme [id|next|list]", "change the colour theme"],
    ["js [on|off]", "toggle JavaScript features"],
    ["neofetch", "system info, of a sort"],
    ["date", "current date and time"],
    ["clear", "clear the screen"],
    ["exit", "close the terminal"],
  ];

  function run(cmd) {
    var parts = cmd.trim().split(/\s+/);
    var c = (parts[0] || "").toLowerCase();
    var arg = parts.slice(1).join(" ").toLowerCase();
    if (!c) return;

    switch (c) {
      case "help":
      case "man":
        termWrite('<span class="t-muted">available commands:</span>');
        HELP.forEach(function (r) {
          termWrite(
            '  <span class="t-key">' +
              r[0] +
              '</span> — <span class="t-muted">' +
              r[1] +
              "</span>",
          );
        });
        break;
      case "whoami":
        termWrite(
          '<span class="t-strong">' +
            SITE.name +
            "</span> — developer in training",
        );
        termWrite(
          '<span class="t-muted">Ranken Technical College \'26 · ' +
            SITE.host +
            "</span>",
        );
        break;
      case "about":
        termWrite(
          '<span class="t-muted">Aspiring developer who works hard almost 24/7. I love learning how',
        );
        termWrite(
          "everything works down to the 1's and 0's, and I look for faster, cleaner ways",
        );
        termWrite(
          "to do the job. Into Rust, Go, TypeScript, terminal tooling and open source.</span>",
        );
        break;
      case "skills":
        termWrite(
          '<span class="t-key">languages</span>   HTML/CSS · JS/TS · C# · Lua',
        );
        termWrite(
          '<span class="t-key">frameworks</span>  .NET · React/Vite · Express',
        );
        termWrite(
          '<span class="t-key">databases</span>   MongoDB · MySQL',
        );
        termWrite(
          '<span class="t-key">tools</span>       Arch · NeoVim · Git · Ollama · OpenCode',
        );
        break;
      case "projects":
        termWrite(
          '<span class="t-strong">API Issue Tracker</span>   <span class="t-muted">MERN · TypeScript · in progress</span>',
        );
        termWrite(
          '<span class="t-strong">Weather App</span>         <span class="t-muted">React.js · OpenWeatherMap</span>',
        );
        termWrite(
          '<span class="t-strong">Video Game Storage</span>  <span class="t-muted">HTML5 · CSS3 · Vanilla JS</span>',
        );
        termWrite(
          '<span class="t-strong">Emulator Frontend</span>   <span class="t-muted">C# · MySQL</span>',
        );
        break;
      case "ls":
        SITE.sections.forEach(function (s, i) {
          termWrite(
            '<span class="t-brand">/</span> <span class="t-key">' +
              s.id +
              '</span> <span class="t-muted">' +
              s.label +
              "  [" +
              (i + 1) +
              "]</span>",
          );
        });
        break;
      case "open":
      case "cd":
        if (
          SITE.sections.some(function (s) {
            return s.id === arg;
          })
        ) {
          goTo(arg);
          termWrite('<span class="t-muted">→ opened /' + arg + "</span>");
          closeOverlay("terminal");
        } else
          termWrite(
            '<span class="t-muted">no such section: ' +
              escapeHtml(arg || "(none)") +
              ' — try "ls"</span>',
          );
        break;
      case "theme":
        if (!arg || arg === "next") {
          cycleTheme(1);
          termWrite(
            '<span class="t-muted">theme → ' +
              root.getAttribute("data-theme") +
              "</span>",
          );
        } else if (arg === "list") {
          THEMES.forEach(function (t) {
            termWrite(
              '<span class="t-brand">' +
                (t.id === root.getAttribute("data-theme") ? "●" : "○") +
                '</span> <span class="t-key">' +
                t.id +
                "</span>",
            );
          });
        } else {
          var loose = arg.replace(/[^a-z0-9]/g, "");
          var hit = THEMES.filter(function (t) {
            return t.id.replace(/[^a-z0-9]/g, "") === loose;
          })[0];
          if (hit) {
            applyTheme(hit.id);
            termWrite(
              '<span class="t-muted">theme → ' + hit.id + "</span>",
            );
          } else
            termWrite(
              '<span class="t-muted">unknown theme "' +
                escapeHtml(arg) +
                '" — try "theme list"</span>',
            );
        }
        break;
      case "js":
        if (arg === "on") {
          setJs(true);
          termWrite('<span class="t-muted">js → on</span>');
        } else if (arg === "off") {
          setJs(false);
          termWrite('<span class="t-muted">js → off</span>');
        } else
          termWrite('<span class="t-muted">usage: js [on|off]</span>');
        break;
      case "neofetch":
      case "info":
        termWrite('<span class="t-brand">josh@josh-a.dev</span>');
        termWrite(
          '<span class="t-muted">──────────────────────────────</span>',
        );
        termWrite('<span class="t-key">Host</span>    ' + SITE.host);
        termWrite(
          '<span class="t-key">Role</span>    Developer in training',
        );
        termWrite(
          '<span class="t-key">Focus</span>   TypeScript · Rust · Go',
        );
        termWrite('<span class="t-key">Shell</span>   zsh');
        termWrite('<span class="t-key">Editor</span>  Neovim');
        termWrite('<span class="t-key">WM</span>      Hyprland');
        termWrite(
          '<span class="t-key">Theme</span>   ' +
            root.getAttribute("data-theme"),
        );
        termWrite(
          '<span class="t-key">Stack</span>   HTML/CSS/JS — no frameworks, no build',
        );
        break;
      case "date":
        termWrite(
          '<span class="t-muted">' + new Date().toString() + "</span>",
        );
        break;
      case "clear":
        if (termBody) termBody.innerHTML = "";
        break;
      case "echo":
        termWrite(
          '<span class="t-strong">' +
            escapeHtml(parts.slice(1).join(" ")) +
            "</span>",
        );
        break;
      case "sudo":
        termWrite(
          '<span class="t-muted">nice try — you already have permission here.</span>',
        );
        break;
      case "exit":
      case "quit":
      case "q":
        closeOverlay("terminal");
        break;
      default:
        termWrite(
          '<span class="t-muted">command not found: ' +
            escapeHtml(c) +
            ' — try "help"</span>',
        );
    }
  }

  function termBoot() {
    if (booted || !termBody) return;
    booted = true;
    termWrite(
      '<span class="t-brand">josh-a.dev</span> <span class="t-muted">— interactive shell</span>',
    );
    termWrite(
      '<span class="t-muted">Type</span> <span class="t-key">help</span> <span class="t-muted">for commands, or</span> <span class="t-key">exit</span> <span class="t-muted">to close.</span>',
    );
    termWrite("");
  }

  if (termForm && termInput) {
    termForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = termInput.value;
      termInput.value = "";
      termEcho(v);
      if (v.trim()) {
        history.push(v.trim());
        hIndex = history.length;
      }
      run(v);
      termToEnd();
    });
    termInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp" && history.length) {
        hIndex = Math.max(0, hIndex - 1);
        termInput.value = history[hIndex];
        e.preventDefault();
      } else if (e.key === "ArrowDown" && history.length) {
        hIndex = Math.min(history.length, hIndex + 1);
        termInput.value = hIndex >= history.length ? "" : history[hIndex];
        e.preventDefault();
      }
    });
  }

  /* =========================================================================
     9 · KEYBOARD SHORTCUTS
     ========================================================================= */
  function isTyping(t) {
    if (!t) return false;
    var tag = t.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      t.isContentEditable
    );
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAll();
      return;
    }

    /* The ~ key toggles the terminal from anywhere. */
    if ((e.key === "~" || e.key === "`") && !e.ctrlKey && !e.metaKey) {
      if (
        overlays.terminal &&
        overlays.terminal.classList.contains("open")
      )
        closeOverlay("terminal");
      else openOverlay("terminal");
      e.preventDefault();
      return;
    }

    if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (anyOpen()) return;

    var k = e.key;
    if (k >= "1" && k <= "7") {
      goTo(SITE.sections[Number(k) - 1].id);
      return;
    }
    if (k === "?") {
      openOverlay("keys");
      e.preventDefault();
      return;
    }
    if (k === "t" || k === "T") {
      cycleTheme(e.shiftKey ? -1 : 1);
      return;
    }
    if (k === "r" || k === "R") {
      randomTheme();
      return;
    }
    if (k === "s" || k === "S") {
      setJs(!jsOn);
      return;
    }
    if (k === "c" || k === "C") {
      copyText(SITE.email, "email");
      return;
    }
    if (k === "g" || k === "G") {
      window.open(SITE.github, "_blank", "noopener");
    }
  });

  /* =========================================================================
     10 · COPY TO CLIPBOARD
     ========================================================================= */
  var toast = $("toast"),
    toastTimer = null;
  function flash(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("on");
    }, 1800);
  }
  function copyText(value, label) {
    var done = function () {
      flash(label + " copied");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, function () {
        flash("copy failed");
      });
    } else {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (err) {
        flash("copy failed");
      }
      document.body.removeChild(ta);
    }
  }
  Array.prototype.forEach.call(
    document.querySelectorAll("[data-copy]"),
    function (el) {
      el.addEventListener("click", function () {
        copyText(el.getAttribute("data-copy"), "email");
      });
    },
  );

  /* =========================================================================
     11 · RÉSUMÉ — print
     ---------------------------------------------------------------------------
     The download is a real resume.pdf sitting beside index.html, linked with a
     plain <a download>, so it needs no JavaScript. This only wires the button
     that prints the in-page résumé — which stays the source of truth for the
     PDF. Regenerate it with:
         groff -ms -Tpdf -P-pletter resume.ms > resume.pdf
     ========================================================================= */
  var printBtn = $("resume-print");
  if (printBtn)
    printBtn.addEventListener("click", function () {
      window.print();
    });

  /* =========================================================================
     12 · BLOG POST PAGES
     ---------------------------------------------------------------------------
     Post pages live in blog/ and reuse this file. They have no sections and no
     nav, so everything above quietly no-ops — every lookup is guarded. What
     they do have is a table of contents: the sidebar/dropdown switch, plus a
     highlight on the heading you are currently reading.
     ========================================================================= */
  var toc = document.querySelector(".toc");
  if (toc) {
    /* Wide screens: a static rail. Narrow screens: a real dropdown. Without
       JS the <details> stays open, which is still perfectly usable. */
    var tocMq = window.matchMedia("(min-width: 900px)");
    var syncToc = function () {
      toc.open = tocMq.matches;
    };
    syncToc();
    if (tocMq.addEventListener) tocMq.addEventListener("change", syncToc);
    else if (tocMq.addListener) tocMq.addListener(syncToc);

    var tocLinks = Array.from(toc.querySelectorAll('a[href^="#"]'));
    var tocHeads = tocLinks
      .map(function (a) {
        return document.getElementById(a.getAttribute("href").slice(1));
      })
      .filter(Boolean);

    if (tocHeads.length && "IntersectionObserver" in window) {
      var markToc = function (id) {
        markCurrent(tocLinks, "href", "#" + id);
      };
      var tocSpy = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) markToc(e.target.id);
          });
        },
        { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
      );
      tocHeads.forEach(function (h) {
        tocSpy.observe(h);
      });
      markToc(tocHeads[0].id);
    }
  }

  /* =========================================================================
     13 · INIT
     ========================================================================= */
  var yearEl = $("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  setJs(
    jsOn,
  ); /* applies the saved switch state and builds/clears the graph */
})();
