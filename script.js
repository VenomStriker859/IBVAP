(() => {
  "use strict";
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const siteHeader = document.querySelector(".site-header");
  const toast = document.getElementById("toast");
  const clock = document.getElementById("clock");

  /* =========================================================
     THEME
     ========================================================= */
  // Load saved theme, otherwise use the user's system preference.
  const savedTheme = localStorage.getItem("ibvap-theme");
  const systemTheme =
    window.matchMedia("(prefers-color-scheme: light)").matches
      ? "day"
      : "night";
  root.dataset.theme =
    savedTheme === "day" || savedTheme === "night"
      ? savedTheme
      : systemTheme;

  // Update the sun/moon icon.
  function updateThemeIcon() {
    if (!themeIcon) return;
    const isDay = root.dataset.theme === "day";
    themeIcon.textContent = isDay ? "☀" : "☾";
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        isDay ? "Switch to night mode" : "Switch to day mode"
      );
      themeToggle.title =
        isDay ? "Switch to night mode" : "Switch to day mode";
    }
  }
  updateThemeIcon();


  // Theme button.
  // IMPORTANT:
  // There is only ONE click handler here.
  // The previous version had two handlers, causing the theme
  // to switch twice and appear as if it wasn't working.
  themeToggle?.addEventListener("click", () => {
    if (root.dataset.theme === "day") {
      root.dataset.theme = "night";
    } else {
      root.dataset.theme = "day";
    }

    // Remember the user's choice.
    localStorage.setItem(
      "ibvap-theme",
      root.dataset.theme
    );
    updateThemeIcon();
    showToast(
      root.dataset.theme === "day"
        ? "Day mode enabled"
        : "Night mode enabled"
    );
  });

  /* =========================================================
     IST CLOCK
     ========================================================= */
  function updateClock() {
    if (!clock) return;
    const time = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());
    clock.textContent = `${time} IST`;
  }

  // Start clock immediately.
  updateClock();
  // Update every second.
  setInterval(updateClock, 1000);


  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */
  menuBtn?.addEventListener("click", () => {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle("open");
  });

  // Close mobile menu when a link is clicked.
  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
    });
  });

  /* =========================================================
   SHRINK HEADER ON SCROLL
   ========================================================= */
  let headerTicking = false;

  function updateHeader() {
      if (!siteHeader) return;
      siteHeader.classList.toggle(
          "scrolled",
          window.scrollY > 90
      );
      headerTicking = false;
  }

  window.addEventListener(
      "scroll",
      () => {
          if (headerTicking) return;
          headerTicking = true;
          requestAnimationFrame(updateHeader);
      },
      { passive: true }
  );
  updateHeader();

  /* =========================================================
    SCROLL REVEAL ANIMATIONS
    ========================================================= */
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
          (entries) => {
              entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                      entry.target.classList.add("visible");
                  } else {
                      entry.target.classList.remove("visible");
                  }
              });
          },
          {
              threshold: 0.12,
              rootMargin: "0px 0px -50px 0px"
          }
      );

      revealItems.forEach((element) => {
          observer.observe(element);
      });

  } else {
      revealItems.forEach((element) => {
          element.classList.add("visible");
      });
  }


  /* =========================================================
     PLAYBACK BUTTON
     ========================================================= */
  const playDemo =
    document.getElementById("playDemo");

  playDemo?.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/detection/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fence_points: [
          [100, 100],
          [500, 100],
          [500, 400],
          [100, 400]
        ],
        camera_id: "CAM_01",
        video: "cctv.mp4"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to start detection");
    }

    console.log("Detection:", data);
    showToast("AI detection started");
    
    

  } catch (error) {
    console.error(error);
    showToast("Detection failed: " + error.message);
  }
});


  /* =========================================================
     TOAST NOTIFICATION
     ========================================================= */
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");

    // Clear any previous timer.
    clearTimeout(window.__ibvapToast);

    // Hide toast after 1.9 seconds.
    window.__ibvapToast = setTimeout(() => {
      toast.classList.remove("show");
    }, 1900);
  }
})();
async function updateStats() {
  try {
    const response = await fetch("/api/stats");

    if (!response.ok) {
      throw new Error("Stats request failed");
    }

    const stats = await response.json();

    document.getElementById("activeCamera").textContent =
      String(stats.active_camera).padStart(2, "0");

    document.getElementById("cameraLabel").textContent =
      "CAM_01 / SECTOR A";

    document.getElementById("activeIntrusions").textContent =
      stats.active_intrusions;

    document.getElementById("aiEvents").textContent =
      stats.ai_events;

    document.getElementById("aiConfidence").textContent =
      stats.ai_confidence + "%";

  } catch (error) {
    console.error("Could not load IBVAP stats:", error);
  }
}

updateStats();
setInterval(updateStats, 5000);
async function updateEventLog() {
  try {
    const response = await fetch("/api/events");

    if (!response.ok) {
      throw new Error("Events request failed");
    }

    const events = await response.json();
    const eventLog = document.getElementById("eventLog");

    if (!eventLog) return;
    const eventCount = document.querySelector(".event-count");

    if (eventCount) {
    eventCount.textContent = String(events.length).padStart(2, "0");
}

    eventLog.innerHTML = "";

    events.slice(0, 8).forEach(event => {
      const date = new Date(event.timestamp);

      const time = date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });

      const eventType = (event.event_type || "detection").toUpperCase();

      let title = eventType;

      if (event.event_type === "intrusion") {
        title = "PERIMETER INTRUSION";
      } else if (event.event_type === "suspicious_activity") {
        title = "SUSPICIOUS ACTIVITY";
      } else if (event.event_type === "detection") {
        title = "OBJECT DETECTED";
      }

      const confidence = event.confidence
        ? Math.round(event.confidence * 100)
        : 0;

      const objectType = event.object_type || "Unknown";
      const track = event.track_id || "N/A";
      const camera = event.camera_id || "CAM_01";

      const eventElement = document.createElement("div");
      eventElement.className = "event";

      eventElement.innerHTML = `
        <time>${time}</time>
        <div class="event-indicator ${event.event_type === "intrusion" ? "danger" : ""}"></div>
        <div>
          <b>${title}</b>
          <span>${objectType} / Track #${track} / ${confidence}%</span>
          <small>${camera} • ${event.event_type === "intrusion" ? "ACTIVE" : "DETECTED"}</small>
        </div>
      `;

      eventLog.appendChild(eventElement);
    });

  } catch (error) {
    console.error("Could not load events:", error);
  }
}

updateEventLog();
setInterval(updateEventLog, 5000);