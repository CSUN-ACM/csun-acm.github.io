/* assets/script.js */
(() => {
  ("use strict");

  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initCalendarToggle();
    initProjectsFromJSON();
    initProjectsFilter();
    initObfuscatedEmails();
    initJoinToggle();
    initEventsFromCalendar(); // render events + RSVP
    initJoinSection();
    initHeroCarousel();
    initPageIntro();
  });

  function initYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function initCalendarToggle() {
    const toggle = document.getElementById("toggleCalendar");
    const embed = document.getElementById("calendar-embed");
    if (!toggle || !embed) return;
    const setState = (on) => {
      embed.hidden = !on;
      toggle.setAttribute("aria-expanded", String(on));
    };
    setState(false);
    toggle.addEventListener("change", (e) => {
      const on = e.target.checked;
      setState(on);
      if (on) embed.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function initProjectsFromJSON() {
    const section = document.getElementById("projects");
    if (!section) return;

    const src = section.dataset.projectsSrc || "assets/projects.json";
    const grid = section.querySelector("#projects-grid");
    const status = document.getElementById("projects-status");
    if (!grid) return;

    const setBusy = (on) => grid.setAttribute("aria-busy", String(!!on));

    const badge = (t) =>
      `<span class="badge rounded-pill text-bg-light">${t}</span>`;
    const linkBtn = (href, label, outline = true) =>
      href
        ? `<a class="btn btn-sm ${
            outline ? "btn-outline-secondary" : "btn-secondary"
          }" href="${href}" target="_blank" rel="noopener">${label}</a>`
        : "";

    const card = (p, i) => {
      const id = `proj-${i}`;
      const img = p.image
        ? `<img class="card-img-top project-thumb" src="${p.image}" alt="${p.title}">`
        : `<div class="project-thumb placeholder-wave"></div>`;
      const tags = (p.tags || []).map(badge).join(" ");
      const repo = linkBtn(p.links?.repo, "Repo");
      const demo = linkBtn(p.links?.demo, "Demo");
      const slides = linkBtn(p.links?.slides, "Slides");

      return `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="card h-100 project-item" data-status="${
          p.status || "ongoing"
        }" aria-labelledby="${id}-title">
          ${img}
          <div class="card-body d-flex flex-column">
            <h3 id="${id}-title" class="h5 card-title mb-1">${
        p.title || "Project"
      }</h3>
            <div class="mb-2 small text-muted">
              ${p.team && p.team.length ? p.team.join(", ") : ""}
            </div>
            <p class="card-text flex-grow-1">${p.summary || ""}</p>
            ${
              tags
                ? `<div class="d-flex flex-wrap gap-1 mb-2">${tags}</div>`
                : ""
            }
            <div class="d-flex flex-wrap gap-2 mt-1">
              ${repo}${demo}${slides}
            </div>
          </div>
        </article>
      </div>`;
    };

    const renderError = (msg) => {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-danger mb-0">${msg}</div></div>`;
      if (status) status.textContent = "";
    };

    (async () => {
      setBusy(true);
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.projects || [];
        if (!list.length) {
          grid.innerHTML = `<div class="col-12"><div class="alert alert-secondary mb-0">No projects yet.</div></div>`;
          if (status) status.textContent = "No projects to show.";
          return;
        }
        grid.innerHTML = list.map(card).join("");

        // Optional: announce
        if (status) {
          const ongoing = list.filter((p) => p.status === "ongoing").length;
          status.textContent = `Loaded ${list.length} projects (${ongoing} ongoing).`;
        }
      } catch (e) {
        console.error(e);
        renderError("Couldn’t load projects.");
      } finally {
        setBusy(false);
      }
    })();
  }

  function initProjectsFilter() {
    const grid = document.getElementById("projects-grid");
    const statusLabel = document.getElementById("projects-status");
    const buttons = document.querySelectorAll("[data-filter]");
    if (!grid || !buttons.length) return;

    const items = Array.from(grid.querySelectorAll(".project-item"));

    const applyFilter = (filter) => {
      let shown = 0;
      items.forEach((el) => {
        const matches = filter === "all" || el.dataset.status === filter;
        el.classList.toggle("d-none", !matches);
        if (matches) shown++;
      });

      buttons.forEach((btn) => {
        const isActive = btn.getAttribute("data-filter") === filter;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });

      if (statusLabel) {
        const label = filter.charAt(0).toUpperCase() + filter.slice(1);
        statusLabel.textContent = `Showing ${label.toLowerCase()} projects. ${shown} project${
          shown === 1 ? "" : "s"
        } visible.`;
      }
    };

    buttons.forEach((btn) =>
      btn.addEventListener("click", () =>
        applyFilter(btn.getAttribute("data-filter"))
      )
    );
    applyFilter("all");
  }

  function initObfuscatedEmails() {
    const links = document.querySelectorAll(".obf-email");
    links.forEach((el) => {
      const user = el.getAttribute("data-user");
      const domain = el.getAttribute("data-domain");
      const subject = el.getAttribute("data-subject") || "";
      const body = el.getAttribute("data-body") || "";
      if (!user || !domain) return;

      const addr = `${user}@${domain}`;
      const params = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      const href = `mailto:${addr}${
        params.length ? `?${params.join("&")}` : ""
      }`;

      el.setAttribute("href", href);
      el.setAttribute(
        "aria-label",
        `${el.getAttribute("aria-label") || "Email"}: ${addr}`
      );
    });
  }

  function initJoinToggle() {
    const optForm = document.getElementById("joinForm");
    const optEmail = document.getElementById("joinEmail");
    const wrapForm = document.getElementById("join-form-wrap");
    const wrapEmail = document.getElementById("join-email-wrap");
    const setJoin = (method) => {
      const isForm = method === "form";
      if (wrapForm) wrapForm.classList.toggle("d-none", !isForm);
      if (wrapEmail) wrapEmail.classList.toggle("d-none", isForm);
    };
    optForm?.addEventListener("change", () => setJoin("form"));
    optEmail?.addEventListener("change", () => setJoin("email"));
    setJoin("form");

    const webmail = document.getElementById("join-email-web");
    const sample = document.querySelector(".obf-email");
    if (webmail && sample) {
      const user = sample.getAttribute("data-user");
      const domain = sample.getAttribute("data-domain");
      const subject = encodeURIComponent(
        sample.getAttribute("data-subject") || ""
      );
      const body = encodeURIComponent(sample.getAttribute("data-body") || "");
      if (user && domain) {
        const addr = `${user}@${domain}`;
        const gmailHref =
          `https://mail.google.com/mail/?view=cm&fs=1&to=${addr}` +
          (subject ? `&su=${subject}` : "") +
          (body ? `&body=${body}` : "");
        webmail.setAttribute("href", gmailHref);
        webmail.classList.remove("d-none");
      }
    }
  }

  function initEventsFromCalendar() {
    const section = document.getElementById("events");
    if (!section) return;

    const FEED_URL = section.dataset.feedUrl || "";
    const TZ = section.dataset.timezone || "America/Los_Angeles";

    let list = section.querySelector("#events-list");
    if (!list) list = section.querySelector(".row.g-4");
    if (!list) return;

    const setBusy = (on) => list.setAttribute("aria-busy", String(!!on));

    const fmt = (d, opts) =>
      new Date(d).toLocaleString(undefined, { timeZone: TZ, ...opts });
    const isoToGCal = (d) =>
      new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const timeRangeText = (start, end, allDay) => {
      const s = new Date(start),
        e = new Date(end);
      const sameDay =
        s.toLocaleDateString("en-US", { timeZone: TZ }) ===
        e.toLocaleDateString("en-US", { timeZone: TZ });
      if (allDay)
        return `${fmt(s, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })} (All day)`;
      if (sameDay)
        return `${fmt(s, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}, ${fmt(s, { hour: "numeric", minute: "2-digit" })}–${fmt(e, {
          hour: "numeric",
          minute: "2-digit",
        })}`;
      return `${fmt(s, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })} – ${fmt(e, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`;
    };

    const gcalLink = (ev) => {
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: ev.title || "Event",
        dates: `${isoToGCal(ev.start)}/${isoToGCal(ev.end)}`,
        details: ev.description || "",
        location: ev.location || "",
        ctz: TZ,
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    const icsBlobUrl = (ev) => {
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ACM CSUN//Events//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${ev.id || crypto?.randomUUID?.() || Date.now()}@acmcsun`,
        `DTSTAMP:${isoToGCal(new Date().toISOString())}`,
        `DTSTART:${isoToGCal(ev.start)}`,
        `DTEND:${isoToGCal(ev.end)}`,
        `SUMMARY:${ev.title || "Event"}`,
        ev.location ? `LOCATION:${ev.location}` : "",
        ev.description
          ? `DESCRIPTION:${ev.description.replace(/\r?\n/g, "\\n")}`
          : "",
        "END:VEVENT",
        "END:VCALENDAR",
      ]
        .filter(Boolean)
        .join("\r\n");
      return URL.createObjectURL(new Blob([lines], { type: "text/calendar" }));
    };

    const modeBadge = (loc = "") => {
      const isOnline = /zoom|meet\.google|teams|http|https|online/i.test(loc);
      return isOnline
        ? '<span class="badge text-bg-secondary ms-2">Online</span>'
        : loc
        ? '<span class="badge text-bg-success ms-2">In person</span>'
        : "";
    };

    // --- RSVP builder (WebApp > Form prefill > mailto default) ---
    const buildRsvpHref = (ev) => {
      // 0) explicit override from event description first line
      const override = (ev.rsvpUrl || "").trim();
      if (override) return override;

      // 1) Apps Script Web App RSVP (email + message only)
      const WEBAPP = section.dataset.rsvpWebapp || "";
      if (WEBAPP) {
        const p = new URLSearchParams({
          eventId: ev.id || "",
          title: ev.title || "",
          start: ev.start || "",
          end: ev.end || "",
          location: ev.location || "",
        });
        return `${WEBAPP}${WEBAPP.includes("?") ? "&" : "?"}${p.toString()}`;
      }

      // 2) Google Form prefill
      const FORM = section.dataset.rsvpForm || "";
      if (FORM) {
        const fId = section.dataset.rsvpId || "";
        const fTitle = section.dataset.rsvpTitle || "";
        const fStartISO = section.dataset.rsvpStartiso || "";
        const fEndISO = section.dataset.rsvpEndiso || "";
        const fLoc = section.dataset.rsvpLocation || "";
        const fStartNice = section.dataset.rsvpStart || "";
        const params = new URLSearchParams();
        if (fId) params.set(fId, ev.id || "");
        if (fTitle) params.set(fTitle, ev.title || "");
        if (fStartISO) params.set(fStartISO, ev.start || "");
        if (fEndISO) params.set(fEndISO, ev.end || "");
        if (fLoc && ev.location) params.set(fLoc, ev.location);
        if (fStartNice) {
          const nice = ev.allDay
            ? new Date(ev.start).toLocaleDateString(undefined, {
                timeZone: TZ,
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : timeRangeText(ev.start, ev.end, ev.allDay);
          params.set(fStartNice, nice);
        }
        return `${FORM}${FORM.includes("?") ? "&" : "?"}${params.toString()}`;
      }

      // 3) Mailto fallback (guarantee a button)
      const DEFAULT_RSVP_EMAIL = "acm.sc@my.csun.edu";
      const email = (section.dataset.rsvpEmail || DEFAULT_RSVP_EMAIL).trim();
      const subj = `RSVP: ${ev.title || "Event"} — ${new Date(
        ev.start
      ).toLocaleString(undefined, { timeZone: TZ })}`;
      const body = [
        "Hi ACM team,",
        "",
        `I'd like to RSVP for: ${ev.title || "Event"}`,
        `When: ${timeRangeText(ev.start, ev.end, ev.allDay)}`,
        ev.location ? `Where: ${ev.location}` : "",
        "",
        "My name:",
        "My email:",
      ]
        .filter(Boolean)
        .join("\n");
      return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
        subj
      )}&body=${encodeURIComponent(body)}`;
    };

    const render = (events = []) => {
      const now = Date.now();
      const upcoming = events
        .filter((ev) => new Date(ev.end).getTime() >= now)
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 9);

      if (!upcoming.length) {
        list.innerHTML = `<div class="col-12"><div class="alert alert-secondary mb-0">No upcoming events yet. Check back soon!</div></div>`;
        return;
      }

      list.innerHTML = upcoming
        .map((ev, i) => {
          const rsvpHref = buildRsvpHref(ev);
          return `
        <div class="col-12 col-md-6 col-lg-4">
          <article class="card h-100 event-card" aria-labelledby="${
            ev.id || "evt" + i
          }-title">
            <div class="card-body">
              <h3 id="${ev.id || "evt" + i}-title" class="h5 card-title mb-2">
                ${ev.title || "Event"} ${modeBadge(ev.location || "")}
              </h3>
              <p class="mb-1"><time datetime="${ev.start}">${timeRangeText(
            ev.start,
            ev.end,
            ev.allDay
          )}</time></p>
              ${ev.location ? `<p class="mb-2">${ev.location}</p>` : ""}
              ${
                ev.description
                  ? `<p class="card-text">${ev.description}</p>`
                  : ""
              }
              <div class="d-flex flex-wrap gap-2 mt-2">
                <a class="btn btn-sm btn-primary" href="${rsvpHref}" target="_blank" rel="noopener">RSVP</a>
                <a class="btn btn-sm btn-outline-secondary" href="${gcalLink(
                  ev
                )}" target="_blank" rel="noopener">Add to Google</a>
                <a class="btn btn-sm btn-outline-secondary" href="${icsBlobUrl(
                  ev
                )}" download="${(ev.title || "event").replace(
            /\s+/g,
            "_"
          )}.ics">.ics file</a>
              </div>
            </div>
          </article>
        </div>`;
        })
        .join("");
    };

    const renderError = (msg = "Couldn’t load events.") => {
      list.innerHTML = `<div class="col-12"><div class="alert alert-danger mb-0">${msg}</div></div>`;
    };

    const fetchJSON = async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };

    const fetchJSONP = (url) =>
      new Promise((resolve, reject) => {
        const cb = "acmFeedCb_" + Date.now();
        window[cb] = (data) => {
          cleanup();
          resolve(data);
        };
        const cleanup = () => {
          delete window[cb];
          script.remove();
        };
        const script = document.createElement("script");
        script.src = `${url}${
          url.includes("?") ? "&" : "?"
        }callback=${cb}&v=${Date.now()}`;
        script.onerror = () => {
          cleanup();
          reject(new Error("JSONP load error"));
        };
        document.head.appendChild(script);
      });

    const load = async () => {
      if (!FEED_URL) {
        renderError(
          "Events feed URL is missing. Add data-feed-url to the #events section."
        );
        return;
      }
      setBusy(true);
      const isAppsScript = /script\.google\.com/i.test(FEED_URL);
      try {
        const data = isAppsScript
          ? await fetchJSONP(FEED_URL)
          : await fetchJSON(`${FEED_URL}?v=${Date.now()}`);
        if (!Array.isArray(data)) throw new Error("Unexpected feed format");
        render(data);
      } catch (err) {
        console.warn("Primary load failed:", err);
        if (!/script\.google\.com/i.test(FEED_URL)) {
          try {
            const data2 = await fetchJSONP(FEED_URL);
            if (!Array.isArray(data2))
              throw new Error("Unexpected JSONP format");
            render(data2);
          } catch (e2) {
            console.error(e2);
            renderError();
          }
        } else {
          renderError(
            "Events feed isn’t publicly accessible. In Apps Script, deploy Web App with access = Anyone."
          );
        }
      } finally {
        setBusy(false);
      }
    };

    load();
  }

  // Intro logo animation (first load per session; a11y + reduced-motion)
  function initPageIntro() {
    const intro = document.getElementById("intro");
    if (!intro) return;

    const playedKey = "acm:introPlayed";
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const skipBtn = document.getElementById("intro-skip");

    // If user has seen it this session, or prefers reduced motion → skip
    const shouldSkip =
      sessionStorage.getItem(playedKey) === "1" || mqReduce.matches;

    const show = () => {
      intro.hidden = false;
      document.body.classList.add("intro-lock");
      window.requestAnimationFrame(() => {
        // start animations via CSS; nothing else needed here
      });
    };

    const hide = () => {
      sessionStorage.setItem(playedKey, "1");
      intro.classList.add("is-dismissing");
      // let the fade complete (CSS .35s), then remove
      setTimeout(() => {
        intro.hidden = true;
        intro.classList.remove("is-dismissing");
        document.body.classList.remove("intro-lock");
      }, 380);
    };

    // If skipping, ensure no lock and just bail
    if (shouldSkip) {
      intro.hidden = true;
      document.body.classList.remove("intro-lock");
      return;
    }

    // Otherwise, show the overlay and schedule dismissal
    show();

    // Dismiss shortly after the animation “hold” completes (~0.9s + 0.7s)
    const TOTAL = 1650; // ms; feels snappy, adjust 1400–2000 as you like
    const timer = setTimeout(hide, TOTAL);

    // Skip button, keyboard, and click-to-skip
    const fastExit = () => {
      clearTimeout(timer);
      hide();
    };
    skipBtn?.addEventListener("click", fastExit);
    intro.addEventListener("click", (e) => {
      // only if they click outside the logo card
      if (e.target === intro) fastExit();
    });
    intro.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fastExit();
        }
      },
      { passive: false }
    );

    // If the page loses visibility (tab switch), dismiss to avoid stale overlay
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") fastExit();
    });
  }

  // --- Hero Carousel: accessibility + performance helpers -------------------
  function initHeroCarousel() {
    const el = document.getElementById("heroCarousel");
    if (!el || typeof bootstrap === "undefined" || !bootstrap.Carousel) return;

    // Allow HTML data-* overrides; fall back to sensible defaults
    const interval = Number(el.getAttribute("data-interval")) || 6000;
    const pause = el.getAttribute("data-pause") || "hover";

    // Create (or reuse) the Bootstrap instance
    const carousel = bootstrap.Carousel.getOrCreateInstance(el, {
      interval,
      ride: "carousel",
      pause,
      touch: true,
      keyboard: true,
    });

    // Respect prefers-reduced-motion (don’t auto-advance for those users)
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPref = () => {
      if (mq.matches) {
        carousel.pause();
        // Keep indicators in sync even when we pause
        el.setAttribute("data-paused-reduced-motion", "true");
      } else {
        // Only cycle if the carousel is actually visible
        if (isInViewport(el)) carousel.cycle();
      }
    };
    applyMotionPref();
    mq.addEventListener?.("change", applyMotionPref);

    // Pause when hero is scrolled off screen to save CPU/battery
    const io = new IntersectionObserver(
      ([entry]) => {
        const reduced = mq.matches;
        if (entry.isIntersecting) {
          if (!reduced) carousel.cycle();
        } else {
          carousel.pause();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);

    // Keep aria-current on indicators accurate after each slide
    el.addEventListener("slid.bs.carousel", () => {
      const activeIdx = Array.from(
        el.querySelectorAll(".carousel-item")
      ).findIndex((n) => n.classList.contains("active"));
      const indicators = el.querySelectorAll(
        ".carousel-indicators [data-bs-slide-to]"
      );
      indicators.forEach((btn, i) => {
        const isCurrent = i === activeIdx;
        btn.setAttribute("aria-current", isCurrent ? "true" : "false");
      });
    });

    // Util: quick viewport check (used above)
    function isInViewport(node) {
      const r = node.getBoundingClientRect();
      return (
        r.bottom > 0 &&
        r.right > 0 &&
        r.top < (window.innerHeight || document.documentElement.clientHeight) &&
        r.left < (window.innerWidth || document.documentElement.clientWidth)
      );
    }
  }

  function initJoinSection() {
    const sec = document.getElementById("join");
    if (!sec) return;

    const invite = sec.dataset.discordInvite || "";
    const portal = sec.dataset.portalUrl || "";
    const joinBtn = document.getElementById("discord-join");
    const copyBtn = document.getElementById("discord-copy");
    const qrBtn = document.getElementById("discord-qr-toggle");
    const qrBox = document.getElementById("discord-qr");
    const qrImg = document.getElementById("discord-qr-img");
    const portalA = document.getElementById("portal-link");

    // Wire primary links
    if (invite && joinBtn) joinBtn.href = invite;
    if (portal && portalA) portalA.href = portal;

    // Copy invite
    if (copyBtn && invite) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(invite);
          copyBtn.textContent = "Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy invite"), 1400);
        } catch {
          copyBtn.textContent = "Copy failed";
          setTimeout(() => (copyBtn.textContent = "Copy invite"), 1400);
        }
      });
    }

    // QR toggle (uses a public QR service; replace with on-site generator later if desired)
    if (qrBtn && qrBox && qrImg && invite) {
      const makeQR = (url) =>
        `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
          url
        )}`;
      let open = false;
      qrBtn.addEventListener("click", () => {
        open = !open;
        qrBox.classList.toggle("d-none", !open);
        qrBtn.setAttribute("aria-expanded", String(open));
        if (open && !qrImg.src) qrImg.src = makeQR(invite);
      });
    }
  }
})();

/* === Officers: keep CURRENT as-is; load PAST from TSV ===================== */
document.addEventListener("DOMContentLoaded", initOfficers);

function initOfficers() {
  const section = document.getElementById("officers");
  if (!section) return;

  const SRC_TSV = section.dataset.officersTsv || "assets/officers.tsv"; // PAST source
  const SRC_CURRENT = section.dataset.officersSrc || "assets/officers.json"; // optional fallback for CURRENT if grid empty
  const SRC_HIST_F =
    section.dataset.historySrc || "assets/officers_history.json"; // fallback for PAST if TSV missing

  const $grid = section.querySelector("#officers-grid");
  let $history = section.querySelector("#officers-history");
  if (!$grid) return;
  if (!$history) {
    $history = document.createElement("div");
    $history.id = "officers-history";
    $history.className = "mt-4";
    section.querySelector(".container")?.appendChild($history);
  }

  const setBusy = (on) => $grid.setAttribute("aria-busy", String(!!on));

  const fetchText = async (url) => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
    return r.text();
  };
  const fetchJSON = async (url) => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
    return r.json();
  };

  // Parse TSV (first line = headers, tab-separated)
  const parseTSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (!lines.length) return [];
    const headers = lines[0].split("\t").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split("\t");
      const row = {};
      headers.forEach((h, i) => (row[h] = (cells[i] || "").trim()));
      return row;
    });
  };

  const initialsOf = (name = "") => {
    const p = name.trim().split(/\s+/);
    const f = p[0]?.[0] || "";
    const l = p.length > 1 ? p[p.length - 1][0] : "";
    return (f + l).toUpperCase();
  };
  const palette = [
    "#E57373",
    "#64B5F6",
    "#81C784",
    "#FFD54F",
    "#BA68C8",
    "#4DB6AC",
    "#FF8A65",
    "#A1887F",
  ];
  const colorFor = (name = "") => {
    let h = 0;
    for (let i = 0; i < name.length; i++)
      h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  };

  const socialLinks = (o = {}) => {
    const out = [];
    if (o.linkedin)
      out.push(
        `<a class="link-secondary me-2" href="${o.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`
      );
    if (o.github)
      out.push(
        `<a class="link-secondary me-2" href="${o.github}"   target="_blank" rel="noopener">GitHub</a>`
      );
    if (o.website)
      out.push(
        `<a class="link-secondary me-2" href="${o.website}"  target="_blank" rel="noopener">Website</a>`
      );
    return out.join("");
  };
  const emailLink = (email) =>
    email
      ? `<a class="btn btn-sm btn-outline-secondary" href="mailto:${encodeURIComponent(
          email
        )}">Email</a>`
      : "";

  const cardHTML = (o, key = "") => {
    const name = o.name || "Officer";
    const role = o.role || "";
    const major = o.major
      ? `<div class="text-muted small">${o.major}${
          o.grad ? ` • ${o.grad}` : ""
        }</div>`
      : "";
    const links = socialLinks({
      linkedin: o.linkedin,
      github: o.github,
      website: o.website,
    });
    const img = o.photo || "";
    const inits = initialsOf(name);
    const bg = colorFor(name);
    const imgTag = img
      ? `<img class="avatar-img" src="${img}" alt="Photo of ${name}" loading="lazy" decoding="async">`
      : "";

    return `
      <div class="col-12 col-sm-6 col-lg-4">
        <article class="card h-100 officer-card" aria-labelledby="off-${key}-title">
          <div class="card-body d-flex gap-3">
            <div class="avatar" style="--avatar-bg:${bg}">
              ${imgTag}
              <span class="avatar-fallback" aria-hidden="true">${inits}</span>
            </div>
            <div class="flex-grow-1">
              <h3 id="off-${key}-title" class="h5 mb-1">${name}</h3>
              <div class="fw-semibold mb-1">${role}</div>
              ${major}
              <div class="mt-2 d-flex flex-wrap gap-2">
                ${emailLink(o.email)} ${links}
              </div>
            </div>
          </div>
        </article>
      </div>`;
  };

  const wireAvatarFallbacks = (root) => {
    root.querySelectorAll(".avatar-img").forEach((img) => {
      img.addEventListener("error", () =>
        img.parentElement.classList.add("no-img")
      );
    });
  };

  const renderCurrent = (list = []) => {
    if (!list.length) return; // leave whatever is already in the grid
    $grid.innerHTML = list.map((o, i) => cardHTML(o, `c${i}`)).join("");
    wireAvatarFallbacks($grid);
  };

  const renderHistory = (groups = []) => {
    if (!groups.length) {
      $history.innerHTML = "";
      return;
    }
    const html = groups
      .map((g, gi) => {
        const cards = (g.officers || [])
          .map((o, i) => cardHTML(o, `h${gi}-${i}`))
          .join("");
        return `
        <details class="officers-year mt-3">
          <summary class="h6 mb-2">${g.year} <span class="text-muted">(${
          (g.officers || []).length
        })</span></summary>
          <div class="row g-4">${cards}</div>
        </details>`;
      })
      .join("");
    $history.innerHTML = `<h3 class="h4 mt-4">Past Officers</h3>${html}`;
    wireAvatarFallbacks($history);
  };

  (async () => {
    setBusy(true);
    try {
      // 1) Current: if grid already has children, DON'T touch it.
      const gridHasContent = $grid.children.length > 0;
      if (!gridHasContent) {
        // Optional convenience: try to load current from JSON if provided
        try {
          const current = await fetchJSON(SRC_CURRENT);
          if (Array.isArray(current) && current.length) renderCurrent(current);
        } catch {
          /* ignore if missing */
        }
      }

      // 2) Past: prefer TSV
      try {
        const tsv = await fetchText(SRC_TSV);
        const rows = parseTSV(tsv).map((r) => ({
          year: r.year || "",
          name: r.name || "",
          role: r.role || "",
          email: r.email || "",
          major: r.major || "",
          grad: r.grad || "",
          photo: r.photo || "",
          linkedin: r.linkedin || "",
          github: r.github || "",
          website: r.website || "",
          current: /^(yes|true|1)$/i.test(r.current || ""),
        }));

        // take ONLY non-current rows (i.e., past)
        const past = rows.filter((r) => !r.current && r.year);
        const byYear = new Map();
        past.forEach((r) => {
          if (!byYear.has(r.year)) byYear.set(r.year, []);
          byYear.get(r.year).push(r);
        });
        const groups = Array.from(byYear.entries())
          .sort((a, b) => String(b[0]).localeCompare(String(a[0])))
          .map(([year, officers]) => ({ year, officers }));

        renderHistory(groups);
      } catch (e) {
        // TSV missing? fallback to the old JSON history
        try {
          const hist = await fetchJSON(SRC_HIST_F);
          if (Array.isArray(hist)) renderHistory(hist);
          else renderHistory([]);
        } catch {
          renderHistory([]);
        }
      }
    } finally {
      setBusy(false);
    }
  })();
}
// Auto-collapse navbar after clicking any link or dropdown item (mobile UX)
document.addEventListener('click', (e) => {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const clicked = e.target.closest('.nav-link, .dropdown-item');
  if (!clicked) return;
  const instance = bootstrap.Collapse.getInstance(nav) || new bootstrap.Collapse(nav, { toggle: false });
  instance.hide();
});
