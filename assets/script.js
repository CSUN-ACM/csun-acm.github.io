/* assets/script.js */
(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initCalendarToggle();
    initProjectsFilter();
    initObfuscatedEmails();
    initJoinToggle();
    initEventsFromCalendar(); // render events + RSVP
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
})();

/* === Officers (current + history) ========================================== */
document.addEventListener("DOMContentLoaded", initOfficers);

function initOfficers() {
  const section = document.getElementById("officers");
  if (!section) return;

  const SRC_CURRENT = section.dataset.officersSrc || "assets/officers.json";
  const SRC_HISTORY =
    section.dataset.historySrc || "assets/officers_history.json";

  const $grid = section.querySelector("#officers-grid");
  const $history = section.querySelector("#officers-history");
  if (!$grid) return;

  const setBusy = (on) => $grid.setAttribute("aria-busy", String(!!on));

  const fetchJSON = async (url) => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
    return r.json();
  };

  const initialsOf = (name = "") => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
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

  const socialLinks = (links = {}) => {
    const items = [];
    if (links.linkedin)
      items.push(
        `<a class="link-secondary me-2" href="${links.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`
      );
    if (links.github)
      items.push(
        `<a class="link-secondary me-2" href="${links.github}" target="_blank" rel="noopener">GitHub</a>`
      );
    if (links.website)
      items.push(
        `<a class="link-secondary me-2" href="${links.website}" target="_blank" rel="noopener">Website</a>`
      );
    return items.join("");
  };

  const emailLink = (email) => {
    if (!email) return "";
    const safe = encodeURIComponent(email);
    return `<a class="btn btn-sm btn-outline-secondary" href="mailto:${safe}">Email</a>`;
  };

  const cardHTML = (o, idx = 0) => {
    const name = o.name || "Officer";
    const role = o.role || "";
    const major = o.major
      ? `<div class="text-muted small">${o.major}${
          o.grad ? ` • ${o.grad}` : ""
        }</div>`
      : "";
    const links = socialLinks(o.links || {});
    const img = o.photo || "";
    const inits = initialsOf(name);
    const bg = colorFor(name);
    const imgTag = img
      ? `<img class="avatar-img" src="${img}" alt="Photo of ${name}" loading="lazy" decoding="async">`
      : "";
    return `
      <div class="col-12 col-sm-6 col-lg-4">
        <article class="card h-100 officer-card" aria-labelledby="off-${idx}-title">
          <div class="card-body d-flex gap-3">
            <div class="avatar" style="--avatar-bg:${bg}">
              ${imgTag}
              <span class="avatar-fallback" aria-hidden="true">${inits}</span>
            </div>
            <div class="flex-grow-1">
              <h3 id="off-${idx}-title" class="h5 mb-1">${name}</h3>
              <div class="fw-semibold mb-1">${role}</div>
              ${major}
              <div class="mt-2 d-flex flex-wrap gap-2">
                ${emailLink(o.email)}
                ${links}
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
  };

  const wireAvatarFallbacks = (container) => {
    container.querySelectorAll(".avatar-img").forEach((img) => {
      img.addEventListener("error", () => {
        img.parentElement.classList.add("no-img");
      });
    });
  };

  const renderCurrent = (list = []) => {
    if (!list.length) {
      $grid.innerHTML = `<div class="col-12"><div class="alert alert-secondary">Officer roster coming soon.</div></div>`;
      return;
    }
    $grid.innerHTML = list.map(cardHTML).join("");
    wireAvatarFallbacks($grid);
  };

  const renderHistory = (groups = []) => {
    if (!$history) return;
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
        </details>
      `;
      })
      .join("");

    $history.innerHTML = `<h3 class="h4 mt-4">Past Officers</h3>${html}`;
    wireAvatarFallbacks($history);
  };

  (async () => {
    setBusy(true);
    try {
      const [current, history] = await Promise.allSettled([
        fetchJSON(SRC_CURRENT),
        fetchJSON(SRC_HISTORY),
      ]);
      if (current.status === "fulfilled") renderCurrent(current.value);
      else renderCurrent([]);
      if (history.status === "fulfilled") renderHistory(history.value);
      else renderHistory([]);
    } catch (e) {
      console.error(e);
      renderCurrent([]);
      renderHistory([]);
    } finally {
      setBusy(false);
    }
  })();
}
