document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     ELEMENTS
  ========================================================= */

  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");

  const exploreToggle =
    document.getElementById("exploreToggle");

  const exploreMenu =
    document.getElementById("exploreMenu");

  const dashboardView =
    document.getElementById("dashboardView");

  const settingsView =
    document.getElementById("settingsView");

  const moduleView =
    document.getElementById("moduleView");

  const breadcrumb =
    document.getElementById("breadcrumbFeature");

  const toast =
    document.getElementById("toast");

  /* =========================================================
     IBVAP API CLIENT
  ========================================================= */

  const API_BASE = window.IBVAP_API_BASE || "";

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        "Accept": "application/json",
        ...(options.headers || {})
      }
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_) {
      payload = null;
    }

    if (!response.ok || !payload?.ok) {
      throw new Error(
        payload?.error?.message ||
        payload?.detail ||
        `API request failed (${response.status})`
      );
    }

    return payload.data;
  }

  let apiStats = null;
  let apiEvents = [];
  let apiStatus = null;


  /* =========================================================
     PAGE DATA
  ========================================================= */

  const pageData = {
    "Human Detection": {
      camera: "CAM_01",
      location: "Configured surveillance video",
      summary: "AI Detection Summary",
      events: "AI Security Events",
      stats: [
        ["0", "AI Events", "from API", "i-human"],
        ["0", "Intrusion Events", "from API", "i-location"],
        ["0", "Suspicious Events", "from API", "i-alert"],
        ["0", "Frames Processed", "from API", "i-analytics"]
      ]
    },
    "Face Detection": {
      camera: "STANDALONE",
      location: "Face Recognition · API",
      summary: "Face Recognition",
      events: "Face Recognition Events",
      stats: [
        ["—", "Status", "standalone module", "i-face"],
        ["—", "API Events", "not available", "i-location"],
        ["—", "Active Tracks", "not available", "i-check"],
        ["—", "Review", "not available", "i-alert"]
      ]
    },
    "ANPR": {
      camera: "CAM_01",
      location: "ANPR · API",
      summary: "ANPR Summary",
      events: "Vehicle Recognition Events",
      stats: [
        ["0", "Plates Read", "from API", "i-car"],
        ["0", "Plate Events", "from API", "i-file"],
        ["0", "Intrusion Events", "from API", "i-login"],
        ["0", "Flagged Plates", "not implemented", "i-alert"]
      ]
    },
    "Night Time Surveillance": {
      camera: "STANDALONE",
      location: "Night Vision · API",
      summary: "Night Surveillance",
      events: "Night Vision Events",
      stats: [
        ["—", "Status", "standalone test", "i-moon"],
        ["—", "API Events", "not available", "i-location"],
        ["—", "Movement Alerts", "not available", "i-alert"],
        ["—", "Review", "not available", "i-file"]
      ]
    }
  };

  /* =========================================================
     TOAST
  ========================================================= */

  function showToast(message) {

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.__ibvapToast);

    window.__ibvapToast =
      setTimeout(() => {
        toast.classList.remove("show");
      }, 1800);
  }

  /* =========================================================
     PAGE / URL
  ========================================================= */

  function getCurrentPage() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      params.get("page") ||
      "Dashboard"
    );
  }

  function openPage(page) {

    const url =
      new URL(window.location.href);

    url.search = "";

    url.searchParams.set(
      "page",
      page
    );

    window.open(
      url.href,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =========================================================
     SIDEBAR ACTIVE STATE
  ========================================================= */

  function setActiveSidebar(page) {

    const items =
      document.querySelectorAll(
        ".nav-item[data-page], .sub-nav[data-page]"
      );

    items.forEach(item => {
      item.classList.remove("active");
    });

    const activeItem =
      [...items].find(
        item =>
          item.dataset.page === page
      );

    if (!activeItem) return;

    activeItem.classList.add("active");

    /* Open Explore automatically when
       the selected page belongs to it. */

    const insideExplore =
      activeItem.closest(".explore-menu");

    if (insideExplore) {

      exploreMenu?.classList.remove(
        "closed"
      );

      exploreToggle?.classList.remove(
        "collapsed"
      );

      exploreToggle?.setAttribute(
        "aria-expanded",
        "true"
      );
    }
  }

  /* =========================================================
     VIEW MANAGEMENT
  ========================================================= */

  function showView(view) {

    if (dashboardView)
      dashboardView.hidden =
        view !== "dashboard";

    if (settingsView)
      settingsView.hidden =
        view !== "settings";

    if (moduleView)
      moduleView.hidden =
        view !== "module";
  }

  function setPageTitle(page) {

    document.title =
      `IBVAP — ${page}`;

    if (breadcrumb)
      breadcrumb.textContent =
        page;
  }

  /* =========================================================
     EXPLORE DROPDOWN
  ========================================================= */

  exploreToggle?.addEventListener(
    "click",
    event => {

      event.preventDefault();
      event.stopPropagation();

      if (!exploreMenu) return;

      const closed =
        exploreMenu.classList.toggle(
          "closed"
        );

      exploreToggle.classList.toggle(
        "collapsed",
        closed
      );

      exploreToggle.setAttribute(
        "aria-expanded",
        String(!closed)
      );
    }
  );

  /* =========================================================
     SIDEBAR NAVIGATION
  ========================================================= */

  document
    .querySelectorAll(
      ".nav-item[data-page], .sub-nav[data-page]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          const page =
            button.dataset.page;

          if (!page) return;

          if (page === "Logout") {

            showToast(
              "Logout action selected"
            );

            return;
          }

          openPage(page);
        }
      );
    });

  /* =========================================================
     SIDEBAR COLLAPSE
  ========================================================= */

  menuBtn?.addEventListener(
    "click",
    () => {

      if (window.innerWidth <= 850) {

        sidebar?.classList.toggle(
          "open"
        );

        return;
      }

      sidebar?.classList.toggle(
        "compact"
      );

      document.body.classList.toggle(
        "sidebar-compact"
      );
    }
  );

  /* =========================================================
     DETECTION / EXPLORE PAGES
  ========================================================= */
function cameraPanel(data, options = {}) {

    const {
        cameraContent = "",
        showPeople = true
    } = options;

    return `
        <section class="card camera-card">

            <div class="camera-header">

                <div class="camera-title">

                    <svg class="camera-icon">
                        <use href="#i-camera"></use>
                    </svg>

                    <strong>${data.camera}</strong>

                    <span class="vertical-divider"></span>

                    <span>${data.location}</span>

                </div>

                <div class="live-indicator">
                    <span></span>
                    LIVE
                </div>

            </div>

            <div class="camera-feed">

                <img
                    class="api-camera-feed"
                    src="/api/stream"
                    alt="IBVAP processed surveillance stream"
                    loading="lazy"
                >

                <div class="feed-sky"></div>
                <div class="mountain m1"></div>
                <div class="mountain m2"></div>
                <div class="mountain m3"></div>
                <div class="fence"></div>
                <div class="road"></div>
                <div class="watchtower"></div>
                <div class="street-lights">
                    <i></i>
                    <i></i>
                    <i></i>
                </div>

                <div class="timestamp">
                    2026-09-21&nbsp;&nbsp;18:55:33
                </div>

                ${showPeople ? `
                    <div class="person p1">
                        <label>ID: 001</label>
                        <span></span>
                    </div>

                    <div class="person p2">
                        <label>ID: 002</label>
                        <span></span>
                    </div>

                    <div class="person p3">
                        <label>ID: 003</label>
                        <span></span>
                    </div>

                    <div class="person p4">
                        <label>ID: 004</label>
                        <span></span>
                    </div>
                ` : ""}

                ${cameraContent}

                <div class="feed-overlay"></div>

                <div class="camera-controls">

                    <div class="control-spacer"></div>

                    <button
                        title="Snapshot"
                        class="snapshot-action"
                    >
                        <svg>
                            <use href="#i-camera"></use>
                        </svg>
                    </button>

                    <button
                        title="Video"
                        class="video-action"
                    >
                        <svg>
                            <use href="#i-video"></use>
                        </svg>
                    </button>

                </div>

            </div>

        </section>
    `;
}
function cameraAnglesPanel(data) {
    const base = data.camera || "CAM-04";
    return `
      <section class="card angles-card">
        <div class="card-heading compact-heading">
          <div class="section-title">
            <svg class="section-icon"><use href="#i-camera"></use></svg>
            <div><h2>Camera Angles</h2><p>${data.location}</p></div>
          </div>
        </div>
        <div class="angles-grid">
          <button class="angle active" data-angle="${base}">
            <div class="angle-image angle-1"><span class="mini-road"></span></div>
            <div class="angle-info"><span class="angle-dot active-dot"></span><div><strong>${base}</strong><small>Front View</small></div></div>
          </button>
          <button class="angle" data-angle="${base}B">
            <div class="angle-image angle-2"><span class="mini-road"></span></div>
            <div class="angle-info"><span class="angle-dot"></span><div><strong>${base}B</strong><small>Left Angle</small></div></div>
          </button>
          <button class="angle" data-angle="${base}C">
            <div class="angle-image angle-3"><span class="mini-road"></span></div>
            <div class="angle-info"><span class="angle-dot"></span><div><strong>${base}C</strong><small>Right Angle</small></div></div>
          </button>
          <button class="angle" data-angle="${base}D">
            <div class="angle-image angle-4"><span class="mini-road"></span></div>
            <div class="angle-info"><span class="angle-dot"></span><div><strong>${base}D</strong><small>Rear View</small></div></div>
          </button>
        </div>
      </section>
    `;
}

function suspiciousMiniPanel() {
    return `
      <section class="card suspicious-card suspicious-mini-card">
        <div class="suspicious-header">
          <div class="section-title">
            <svg class="section-icon"><use href="#i-shield"></use></svg>
            <div><h2>Suspicious Activity</h2><p>Recent events requiring attention</p></div>
          </div>
          <span class="suspicious-count">3 Active</span>
        </div>
        <div class="suspicious-list">
          <div class="suspicious-item">
            <div class="suspicious-status"></div>
            <div class="suspicious-content"><strong>Unusual movement</strong><span>North Sector · CAM-04</span></div>
            <small>18:55</small>
          </div>
          <div class="suspicious-item">
            <div class="suspicious-status"></div>
            <div class="suspicious-content"><strong>Restricted zone approach</strong><span>Perimeter · Camera B</span></div>
            <small>18:52</small>
          </div>
        </div>
      </section>
    `;
}

function featureControlCard(feature, title, description) {
    const key = feature.toLowerCase();
    return `
      <section class="card api-feature-card" data-feature-card="${feature}">
        <div class="card-heading">
          <div class="section-title">
            <svg class="section-icon"><use href="#i-analytics"></use></svg>
            <div>
              <h2>${title}</h2>
              <p>${description}</p>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
          <button class="primary-button" id="${key}StartButton" type="button">START ${feature}</button>
          <button class="secondary-button" id="${key}ResetButton" type="button">RESET</button>
          <span id="${key}Status" class="status-pill">IDLE</span>
        </div>
        <div id="${key}Error" style="display:none;margin-bottom:10px"></div>
        <video id="${key}ResultVideo" controls preload="metadata" playsinline
          style="width:100%;max-height:420px;background:#000;border-radius:10px;display:block"></video>
      </section>
    `;
  }

  function renderANPRPage(left, right, data) {

    left.innerHTML = `

        ${cameraPanel(data, {
            showPeople: false,
            cameraContent: `
                <div class="plate-overlay">
                    <span>TN 07 AB 1234</span>
                </div>

                <div class="vehicle-box vehicle-one">
                    <label>TN 07 AB 1234</label>
                </div>

                <div class="vehicle-box vehicle-two">
                    <label>KL 45 C 6789</label>
                </div>
            `
        })}

        ${featureControlCard("ANPR", "ANPR Processing", "Run number-plate recognition through the FastAPI backend")}

        <section class="card detection-table-card">

            <div class="card-heading">
                <div class="section-title">
                    <svg class="section-icon">
                        <use href="#i-file"></use>
                    </svg>

                    <div>
                        <h2>Recent Plate Reads</h2>
                        <p>Recently detected vehicle registrations</p>
                    </div>
                </div>
            </div>

            <div class="table-wrap">

                <table>

                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Plate Number</th>
                            <th>Vehicle</th>
                            <th>Color</th>
                            <th>Direction</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr>
                            <td>18:55:33</td>
                            <td>TN 07 AB 1234</td>
                            <td>Car</td>
                            <td>White</td>
                            <td>Entering</td>
                            <td><span class="status-pill verified">Verified</span></td>
                        </tr>

                        <tr>
                            <td>18:48:21</td>
                            <td>KL 45 C 6789</td>
                            <td>Truck</td>
                            <td>Blue</td>
                            <td>Leaving</td>
                            <td><span class="status-pill verified">Verified</span></td>
                        </tr>

                        <tr>
                            <td>18:42:17</td>
                            <td>KA 05 MN 3021</td>
                            <td>Car</td>
                            <td>Silver</td>
                            <td>Entering</td>
                            <td><span class="status-pill verified">Verified</span></td>
                        </tr>

                        <tr>
                            <td>18:34:50</td>
                            <td>UP 16 BT 7765</td>
                            <td>SUV</td>
                            <td>Black</td>
                            <td>Leaving</td>
                            <td><span class="status-pill review">Review</span></td>
                        </tr>

                    </tbody>

                </table>

            </div>

        </section>
    `;

    right.innerHTML = `

        <section class="card intelligence-card">

            <div class="card-heading">
                <div class="section-title">
                    <svg class="section-icon">
                        <use href="#i-car"></use>
                    </svg>

                    <div>
                        <h2>Detected Plate Details</h2>
                        <p>Latest recognized vehicle</p>
                    </div>
                </div>
            </div>

            <div class="plate-detail">

                <div class="plate-preview">
                    TN 07 AB 1234
                </div>

                <div class="confidence-row">
                    <span>Confidence</span>
                    <strong>96%</strong>
                </div>

                <div class="confidence-bar">
                    <span style="width:96%"></span>
                </div>

                <dl>
                    <div>
                        <dt>Vehicle Type</dt>
                        <dd>Car</dd>
                    </div>

                    <div>
                        <dt>Make</dt>
                        <dd>Hyundai</dd>
                    </div>

                    <div>
                        <dt>Color</dt>
                        <dd>White</dd>
                    </div>

                    <div>
                        <dt>Direction</dt>
                        <dd>Entering East</dd>
                    </div>

                    <div>
                        <dt>Status</dt>
                        <dd>
                            <span class="status-pill verified">
                                VERIFIED
                            </span>
                        </dd>
                    </div>
                </dl>

            </div>

        </section>

        <section class="card chart-card">

            <div class="card-heading">
                <div class="section-title">
                    <svg class="section-icon">
                        <use href="#i-analytics"></use>
                    </svg>

                    <div>
                        <h2>Vehicle Movement</h2>
                        <p>Traffic by vehicle type</p>
                    </div>
                </div>
            </div>

            <div class="simple-chart vehicle-chart">
                <span style="height:45%"></span>
                <span style="height:68%"></span>
                <span style="height:35%"></span>
                <span style="height:82%"></span>
                <span style="height:55%"></span>
                <span style="height:72%"></span>
                <span style="height:48%"></span>
                <span style="height:90%"></span>
            </div>

        </section>
    `;
}
  function renderFaceDetectionPage(left, right, data) {

    left.innerHTML = `

        ${cameraPanel(data)}

        ${featureControlCard("FACE", "Face Recognition", "Run face detection and identity matching through the FastAPI backend")}

        <section class="card detection-table-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-face"></use>
                    </svg>

                    <div>
                        <h2>Recent Face Events</h2>
                        <p>Latest identity detection activity</p>
                    </div>

                </div>

            </div>

            <div class="table-wrap">

                <table>

                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Match</th>
                            <th>Status</th>
                            <th>Location</th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr>
                            <td>18:55:12</td>
                            <td>002</td>
                            <td>Rajesh Kumar</td>
                            <td>94%</td>
                            <td>
                                <span class="status-pill verified">
                                    Verified
                                </span>
                            </td>
                            <td>Checkpoint Road</td>
                        </tr>

                        <tr>
                            <td>18:52:47</td>
                            <td>003</td>
                            <td>Amit Singh</td>
                            <td>89%</td>
                            <td>
                                <span class="status-pill verified">
                                    Verified
                                </span>
                            </td>
                            <td>Gate 2</td>
                        </tr>

                        <tr>
                            <td>18:48:11</td>
                            <td>001</td>
                            <td>Unknown</td>
                            <td>91%</td>
                            <td>
                                <span class="status-pill review">
                                    Review
                                </span>
                            </td>
                            <td>Barrier Area</td>
                        </tr>

                    </tbody>

                </table>

            </div>

        </section>
    `;

    right.innerHTML = `

        <section class="card intelligence-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-face"></use>
                    </svg>

                    <div>
                        <h2>Face Identification</h2>
                        <p>Latest matched identity</p>
                    </div>

                </div>

            </div>

            <div class="identity-profile">

                <div class="identity-avatar">
                    <svg>
                        <use href="#i-face"></use>
                    </svg>
                </div>

                <div class="identity-main">
                    <strong>Rajesh Kumar</strong>
                    <span>ID: 002</span>

                    <span class="status-pill verified">
                        VERIFIED
                    </span>
                </div>

            </div>

            <div class="confidence-row">
                <span>Match Confidence</span>
                <strong>94%</strong>
            </div>

            <div class="confidence-bar">
                <span style="width:94%"></span>
            </div>

            <dl>

                <div>
                    <dt>Designation</dt>
                    <dd>BSF Constable</dd>
                </div>

                <div>
                    <dt>Last Seen</dt>
                    <dd>18:47:12</dd>
                </div>

            </dl>

        </section>

        <section class="card gallery-mini-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-gallery"></use>
                    </svg>

                    <div>
                        <h2>Face Gallery</h2>
                        <p>Recently detected identities</p>
                    </div>

                </div>

                <button class="text-action">
                    View All
                </button>

            </div>

            <div class="face-gallery">

                <button class="face-thumb active">
                    <div></div>
                    <span>ID: 001</span>
                </button>

                <button class="face-thumb">
                    <div></div>
                    <span>ID: 002</span>
                </button>

                <button class="face-thumb">
                    <div></div>
                    <span>ID: 003</span>
                </button>

                <button class="face-thumb">
                    <div></div>
                    <span>ID: 004</span>
                </button>

            </div>

        </section>
    `;
  }
  function renderHumanDetectionPage(left, right, data) {

    left.innerHTML = `

        ${cameraPanel(data)}

        <section class="card zone-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-location"></use>
                    </svg>

                    <div>
                        <h2>Zone Activity</h2>
                        <p>Current movement across monitored zones</p>
                    </div>

                </div>

            </div>

            <div class="zone-map">

                <div class="zone-area restricted-zone">
                    Restricted Zone
                </div>

                <div class="zone-person person-a"></div>
                <div class="zone-person person-b"></div>
                <div class="zone-person person-c"></div>

                <div class="zone-path path-a"></div>
                <div class="zone-path path-b"></div>

            </div>

        </section>
    `;

    right.innerHTML = `

        <section class="card intelligence-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-human"></use>
                    </svg>

                    <div>
                        <h2>Live Tracks</h2>
                        <p>Currently monitored persons</p>
                    </div>

                </div>

            </div>

            <div class="track-list">

                <div class="track-row">
                    <strong>ID: 001</strong>
                    <span>Walking</span>
                    <em>In Zone</em>
                </div>

                <div class="track-row">
                    <strong>ID: 002</strong>
                    <span>Standing</span>
                    <em>In Zone</em>
                </div>

                <div class="track-row">
                    <strong>ID: 003</strong>
                    <span>Walking</span>
                    <em>Entered Zone</em>
                </div>

                <div class="track-row">
                    <strong>ID: 004</strong>
                    <span>Standing</span>
                    <em>In Zone</em>
                </div>

            </div>

        </section>

        <section class="card quick-stats-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-analytics"></use>
                    </svg>

                    <div>
                        <h2>Quick Stats</h2>
                        <p>Current detection status</p>
                    </div>

                </div>

            </div>

            <div class="quick-stats">

                <div>
                    <strong>4</strong>
                    <span>Total Humans</span>
                </div>

                <div>
                    <strong>2</strong>
                    <span>Restricted Zone</span>
                </div>

                <div>
                    <strong>1</strong>
                    <span>Loitering</span>
                </div>

            </div>

        </section>

        <section class="card activity-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-file"></use>
                    </svg>

                    <div>
                        <h2>Recent Activity</h2>
                        <p>Latest movement events</p>
                    </div>

                </div>

            </div>

            <div class="activity-list">

                <div>
                    <span>18:54:22</span>
                    <strong>ID: 003</strong>
                    <em>Entered Zone</em>
                </div>

                <div>
                    <span>18:51:10</span>
                    <strong>ID: 001</strong>
                    <em>Walking</em>
                </div>

                <div>
                    <span>18:47:36</span>
                    <strong>ID: 004</strong>
                    <em>Loitering</em>
                </div>

                <div>
                    <span>18:42:17</span>
                    <strong>ID: 002</strong>
                    <em>Walking</em>
                </div>

            </div>

        </section>
    `;
  }
  function renderNightDetectionPage(left, right, data) {

    left.innerHTML = `

        <section class="card night-camera-card">

            <div class="camera-header">

                <div class="camera-title">

                    <svg class="camera-icon">
                        <use href="#i-camera"></use>
                    </svg>

                    <strong>${data.camera}</strong>

                    <span class="vertical-divider"></span>

                    <span>${data.location}</span>

                </div>

                <div class="live-indicator">
                    <span></span>
                    LIVE
                </div>

            </div>

            <div class="night-feeds">

                <div class="night-feed">

                    <div class="feed-label">
                        Original Feed
                    </div>

                    <div class="night-image original-feed">
                        <span class="timestamp">
                            20:15:42
                        </span>
                    </div>

                </div>

                <div class="night-feed">

                    <div class="feed-label">
                        Enhanced Feed
                    </div>

                    <div class="night-image enhanced-feed">

                        <div class="night-track n1">
                            <label>ID: 001</label>
                        </div>

                        <div class="night-track n2">
                            <label>ID: 002</label>
                        </div>

                    </div>

                </div>

            </div>

        </section>

        ${featureControlCard("NIGHT", "Night Vision Processing", "Enhance low-light video and run YOLO tracking through the FastAPI backend")}

        <section class="card timeline-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-analytics"></use>
                    </svg>

                    <div>
                        <h2>Detection Timeline</h2>
                        <p>Night activity across the monitored period</p>
                    </div>

                </div>

            </div>

            <div class="detection-timeline">

                <div>
                    <span>18:00</span>
                </div>

                <div class="timeline-event human-event">
                    <strong>Human</strong>
                    <small>18:42</small>
                </div>

                <div class="timeline-event vehicle-event">
                    <strong>Vehicle</strong>
                    <small>19:18</small>
                </div>

                <div class="timeline-event alert-event">
                    <strong>Alert</strong>
                    <small>20:12</small>
                </div>

                <div>
                    <span>22:00</span>
                </div>

            </div>

        </section>
    `;

    right.innerHTML = `

        <section class="card intelligence-card night-status-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-moon"></use>
                    </svg>

                    <div>
                        <h2>Night Status</h2>
                        <p>Current low-light conditions</p>
                    </div>

                </div>

            </div>

            <div class="night-status-main">

                <strong>68%</strong>
                <span>Visibility</span>

            </div>

            <div class="night-metrics">

                <div>
                    <strong>3</strong>
                    <span>Humans Detected</span>
                </div>

                <div>
                    <strong>2</strong>
                    <span>Vehicles Detected</span>
                </div>

                <div>
                    <strong>1</strong>
                    <span>Alert</span>
                </div>

            </div>

        </section>

        <section class="card activity-card">

            <div class="card-heading">

                <div class="section-title">

                    <svg class="section-icon">
                        <use href="#i-file"></use>
                    </svg>

                    <div>
                        <h2>Recent Night Events</h2>
                        <p>Latest activity detected after dark</p>
                    </div>

                </div>

            </div>

            <div class="activity-list">

                <div>
                    <span>20:12:34</span>
                    <strong>Vehicle Detected</strong>
                    <em>ID: 002</em>
                </div>

                <div>
                    <span>20:05:17</span>
                    <strong>Human Detected</strong>
                    <em>ID: 001</em>
                </div>

                <div>
                    <span>19:46:02</span>
                    <strong>Zone Intrusion</strong>
                    <em>Zone B</em>
                </div>

            </div>

        </section>
    `;
  }
  
  function renderDetectionPage(page) {
    const data = pageData[page];
    if (!data) return;
    if (dashboardView) {
        dashboardView.hidden = false;
    }

    if (breadcrumb) {
        breadcrumb.textContent = page;
    }

    document.title = `IBVAP — ${page}`;

    const left = document.getElementById("detectionLeftColumn");
    const right = document.getElementById("detectionRightColumn");

    if (!left || !right) return;

    if (page === "ANPR") {
        renderANPRPage(left, right, data);
    }

    else if (page === "Face Detection") {
        renderFaceDetectionPage(left, right, data);
    }

    else if (page === "Human Detection") {
        renderHumanDetectionPage(left, right, data);
    }

    else if (page === "Night Time Surveillance") {
        renderNightDetectionPage(left, right, data);
    }
}

  /* =========================================================
     DASHBOARD
  ========================================================= */

function renderDashboard() {

  showView("module");
  setPageTitle("Dashboard");

  const totalDetections = Object.values(pageData)
    .reduce(
      (sum, module) =>
        sum + Number(module.stats[0][0]),
      0
    );

  moduleView.innerHTML = `

    <div class="dashboard-clean">

      <!-- DASHBOARD HEADER -->

      <header class="dashboard-header">

        <div>
          <p class="eyebrow">SECURITY OPERATIONS</p>
          <h1>Insights</h1>
        </div>

      </header>

      <!-- KEY METRICS -->

      <section class="dashboard-metrics">

        <div class="metric-item">
          <span>Total Detections</span>
          <strong id="metricTotalDetections">${totalDetections}</strong>
          <small>Today, across all sites</small>
        </div>

        <div class="metric-item">
          <span>Active Detections</span>
          <strong id="metricActiveDetections">0</strong>
          <small>Current API events</small>
        </div>

        <div class="metric-item">
          <span>Cameras Online</span>
          <strong id="metricCameras">API</strong>
          <small id="metricCameraStatus">Backend status pending</small>
        </div>

      </section>

      <!-- DETECTION CONTROL -->

      <section class="activity-panel api-control-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">FASTAPI CONTROL</p>
            <h2>Run AI Analysis</h2>
          </div>
          <span id="apiConnectionStatus" class="map-live-status"><span></span>Checking API…</span>
        </div>
        <div class="api-control-grid">
          <label>Camera ID<input id="apiCameraId" value="CAM_01" maxlength="64"></label>
          <div class="fence-editor-wrap">

  <div class="fence-editor-header">
    <div>
      <strong>Custom Polygon Fence</strong>
      <small>Click on the camera feed to create your surveillance boundary</small>
    </div>

    <span id="fencePointCount">0 points</span>
  </div>

  <div class="fence-editor">
    <video
      id="fenceEditorVideo"
      src="/api/video/cctv.mp4"
      autoplay
      muted
      playsinline
    ></video>

    <canvas id="fenceCanvas"></canvas>

    <div id="fenceEditorHint">
      Click points around the area you want to protect
    </div>
  </div>

  <div class="fence-editor-actions">

    <button
      id="fenceDrawButton"
      class="secondary-action"
      type="button"
    >
      DRAW POLYGON
    </button>

    <button
      id="fenceFinishButton"
      class="secondary-action"
      type="button"
      disabled
    >
      FINISH
    </button>

    <button
      id="fenceClearButton"
      class="secondary-action"
      type="button"
    >
      CLEAR
    </button>

  </div>

  <input
    id="apiFencePoints"
    type="hidden"
    value=""
  >

</div>
          <button id="apiStartDetection" class="primary-action" type="button">START DETECTION</button>
          <button id="apiResetDetection" class="secondary-action" type="button">RESET</button>
        </div>
        <small id="apiDetectionStatus">Detection status: IDLE</small>
      </section>
            <!-- PROCESSED AI VIDEO -->

      <section class="activity-panel processed-video-panel">

        <div class="panel-heading">

          <div>
            <p class="eyebrow">RAW CAMERA FEED</p>
            <h2>Processed Result Video</h2>
          </div>

          <span class="map-live-status">
            <span></span>
            AI OUTPUT
          </span>

        </div>

        <div class="processed-video-container">

          <video
            id="processedResultVideo"
            controls
            preload="metadata"
            playsinline
          >
            
            Your browser does not support video playback.
          </video>

        </div>

        <div class="processed-video-info">

          <span>
            <strong>CAM_01</strong>
            Camera
          </span>

          <span>
            <strong id="videoFrames">—</strong>
            Frames
          </span>

          <span>
            <strong id="videoIntrusions">—</strong>
            Intrusions
          </span>

          <span>
            <strong id="videoStatus">—</strong>
            Status
          </span>

        </div>

      </section>
      <!-- INTELLIGENCE MODULES -->

      <section class="module-overview" aria-label="Detection modules">

        <button class="module-row human" data-page="Human Detection" type="button">
          <div class="module-row-icon">
            <svg aria-hidden="true"><use href="#i-human"></use></svg>
          </div>

          <div class="module-row-content">
            <strong>Human Detection</strong>
            <small id="moduleHumanCamera">Persons detected · API</small>
          </div>

          <strong id="moduleHumanValue" class="module-row-value">${pageData["Human Detection"].stats[0][0]}</strong>

          <span class="module-row-status">
            <i></i>
            Live
          </span>
        </button>

        <button class="module-row face" data-page="Face Detection" type="button">
          <div class="module-row-icon">
            <svg aria-hidden="true"><use href="#i-face"></use></svg>
          </div>

          <div class="module-row-content">
            <strong>Face Detection</strong>
            <small>Faces detected · CAM-05</small>
          </div>

          <strong id="moduleFaceValue" class="module-row-value">${pageData["Face Detection"].stats[0][0]}</strong>

          <span class="module-row-status">
            <i></i>
            Live
          </span>
        </button>

        <button class="module-row anpr" data-page="ANPR" type="button">
          <div class="module-row-icon">
            <svg aria-hidden="true"><use href="#i-car"></use></svg>
          </div>

          <div class="module-row-content">
            <strong>ANPR</strong>
            <small id="moduleAnprCamera">Vehicles detected · API</small>
          </div>

          <strong id="moduleAnprValue" class="module-row-value">${pageData["ANPR"].stats[0][0]}</strong>

          <span class="module-row-status">
            <i></i>
            Live
          </span>
        </button>

        <button class="module-row night" data-page="Night Time Surveillance" type="button">
          <div class="module-row-icon">
            <svg aria-hidden="true"><use href="#i-moon"></use></svg>
          </div>

          <div class="module-row-content">
            <strong>Night Time Surveillance</strong>
            <small>Night events · CAM-09</small>
          </div>

          <strong id="moduleNightValue" class="module-row-value">${pageData["Night Time Surveillance"].stats[0][0]}</strong>

          <span class="module-row-status">
            <i></i>
            Live
          </span>
        </button>

      </section>

      <!-- RECENT ALERTS + MONITORED AREA -->

      <section class="dashboard-content-grid">

        <section class="activity-panel recent-alerts-panel">

          <div class="panel-heading">
            <div>
              <p class="eyebrow">SECURITY EVENTS</p>
              <h2>Recent Alerts</h2>
            </div>

            <button
              class="text-action"
              type="button"
              data-page="Evidence Gallery"
            >
              View all
              <svg aria-hidden="true"><use href="#i-chevron"></use></svg>
            </button>
          </div>

          <div class="alert-list">

            <button class="alert-row critical" type="button" data-page="Evidence Gallery">
              <span class="alert-dot"></span>
              <span class="alert-content">
                <strong>Perimeter breach detected</strong>
                <small>CAM-04 · North Fence</small>
              </span>
              <span class="alert-time">2 min ago</span>
              <svg class="alert-arrow" aria-hidden="true"><use href="#i-chevron"></use></svg>
            </button>

            <button class="alert-row warning" type="button" data-page="Evidence Gallery">
              <span class="alert-dot"></span>
              <span class="alert-content">
                <strong>Unidentified vehicle</strong>
                <small>CAM-06 · Access Road</small>
              </span>
              <span class="alert-time">9 min ago</span>
              <svg class="alert-arrow" aria-hidden="true"><use href="#i-chevron"></use></svg>
            </button>

            <button class="alert-row critical" type="button" data-page="Evidence Gallery">
              <span class="alert-dot"></span>
              <span class="alert-content">
                <strong>Face match — watchlist</strong>
                <small>CAM-05 · Checkpoint 2</small>
              </span>
              <span class="alert-time">18 min ago</span>
              <svg class="alert-arrow" aria-hidden="true"><use href="#i-chevron"></use></svg>
            </button>

          </div>

          <div class="alerts-footer">
            <span class="alerts-footer-dot"></span>
            Showing 3 of 6 active alerts
          </div>

        </section>

        <section class="activity-panel monitored-area-panel">

          <div class="panel-heading">
            <div>
              <p class="eyebrow">MONITORING</p>
              <h2>Monitored Area</h2>
            </div>

            <div class="map-live-status">
              <span></span>
              Live
            </div>
          </div>

          <div class="monitor-map" aria-label="Monitored area map">
            <div class="map-grid"></div>
            <div class="map-perimeter"></div>
            <div class="map-route route-one"></div>
            <div class="map-route route-two"></div>
            <div class="map-route route-three"></div>
            <span class="map-label perimeter-label">SECURITY PERIMETER</span>

            <button class="map-node node-north" type="button" data-page="Human Detection" aria-label="North Fence camera">
              <span></span>
              <strong>North Fence</strong>
              <small>CAM-04</small>
            </button>

            <button class="map-node node-access" type="button" data-page="ANPR" aria-label="Access Road camera">
              <span></span>
              <strong>Access Road</strong>
              <small>CAM-06</small>
            </button>

            <button class="map-node node-entry" type="button" data-page="Face Detection" aria-label="Entry Point camera">
              <span></span>
              <strong>Entry Point</strong>
              <small>CAM-05</small>
            </button>

            <button class="map-node node-east" type="button" data-page="Night Time Surveillance" aria-label="East Watchtower camera">
              <span></span>
              <strong>East Watchtower</strong>
              <small>CAM-09</small>
            </button>
          </div>

        </section>

      </section>

    </div>
  `;

  moduleView
    .querySelectorAll("[data-page]")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          openPage(button.dataset.page);
        }
      );
    });
}

  /* =========================================================
     EVIDENCE STORAGE
  ========================================================= */

  const defaultEvidence = [

    {
      id: "EV-001",
      camera: "CAM-04",
      event: "Person entered restricted zone",
      time: "18:55:21",
      date: "21 Sep 2026",
      location:
        "Perimeter Road (North Sector)"
    },

    {
      id: "EV-002",
      camera: "CAM-04",
      event: "Person detected",
      time: "18:54:49",
      date: "21 Sep 2026",
      location:
        "Perimeter Road (North Sector)"
    },

    {
      id: "EV-003",
      camera: "CAM-04B",
      event: "Boundary crossing detected",
      time: "18:54:12",
      date: "21 Sep 2026",
      location:
        "North Perimeter"
    },

    {
      id: "EV-004",
      camera: "CAM-04C",
      event: "Suspicious movement",
      time: "18:53:58",
      date: "21 Sep 2026",
      location:
        "West Perimeter"
    },

    {
      id: "EV-005",
      camera: "CAM-04D",
      event: "Person exited restricted zone",
      time: "18:52:44",
      date: "21 Sep 2026",
      location:
        "South Perimeter"
    },

    {
      id: "EV-006",
      camera: "CAM-04",
      event: "Person detected",
      time: "18:51:19",
      date: "21 Sep 2026",
      location:
        "North Perimeter"
    }

  ];

  function getEvidence() {

    try {

      const saved =
        localStorage.getItem(
          "ibvapEvidence"
        );

      return saved
        ? JSON.parse(saved)
        : defaultEvidence;

    } catch {

      return defaultEvidence;
    }
  }

  function saveEvidence(evidence) {

    localStorage.setItem(
      "ibvapEvidence",
      JSON.stringify(evidence)
    );
  }

  /* =========================================================
     EVIDENCE GALLERY
  ========================================================= */

  async function renderEvidenceGallery() {

    showView("module");

    setPageTitle(
      "Evidence Gallery"
    );

let evidence = [];

try {
  const response = await apiFetch("/api/evidence");

  evidence = Array.isArray(response)
    ? response
    : response?.data || [];

} catch (error) {

  console.error(
    "Failed to load evidence:",
    error
  );

  showToast(
    `Evidence API error: ${error.message}`
  );
}

    moduleView.innerHTML = `

      <div class="evidence-page">

        <section class="card page-hero">

          <div class="page-hero-left">

            <div class="page-hero-icon">
              <svg>
                <use href="#i-gallery"></use>
              </svg>
            </div>

            <div>

              <h1>
                Evidence Gallery
              </h1>

              <p>
                Captured snapshots associated
                with intrusion and security events.
              </p>

            </div>

          </div>

          <div class="page-meta">
            ${evidence.length} Evidence Items
          </div>

        </section>

        <section class="card evidence-toolbar">

          <strong>
            Evidence
          </strong>

          <div class="evidence-filters">

            <button
              class="evidence-filter active"
              type="button"
              data-filter="all"
            >
              All
            </button>

            <button
              class="evidence-filter"
              type="button"
              data-filter="intrusion"
            >
              Intrusion
            </button>

            <button
              class="evidence-filter"
              type="button"
              data-filter="suspicious_activity"
            >
              Suspicious
            </button>

          </div>

          <input
            id="evidenceSearch"
            type="search"
            placeholder="Search evidence..."
          />

        </section>

        <div
          class="evidence-grid"
          id="evidenceGrid"
        >

          ${
            evidence.length
              ? evidence.map(item => `

                <article
                  class="card evidence-card"
                  data-id="${item.id}"
                  data-type="${item.event_type || ""}"
                  data-search="${(
                    item.id +
                    " " +
                    (item.event_type || "") +
                    " " +
                    (item.object_type || "") +
                    " " +
                    (item.camera_id || "") +
                    " " +
                    (item.track_id || "")
                  ).toLowerCase()}"
                >

                  <div class="evidence-preview">

                    <img
                      src="${item.evidence_url}"
                      alt="${item.event_type || "Evidence"}"
                      loading="lazy"
                    />

                    <span class="evidence-label">
                      ${item.id}
                    </span>

                  </div>

                  <div class="evidence-info">

                    <h3>
                      ${
                        item.event_type === "intrusion"
                          ? "INTRUSION"
                          : "SUSPICIOUS ACTIVITY"
                      }
                    </h3>

                    <p>
                      Camera: ${item.camera_id || "Unknown"}
                    </p>

                    <p>
                      Time:
                      ${item.timestamp
                        ? new Date(item.timestamp).toLocaleString()
                        : "Unknown"}
                    </p>

                    <p>
                      Object: ${item.object_type || "Unknown"}
                    </p>

                    <p>
                      Confidence:
                      ${item.confidence != null
                        ? `${(Number(item.confidence) * 100).toFixed(1)}%`
                        : "N/A"}
                    </p>

                    <div class="evidence-actions">

                      <button
                        class="view-evidence"
                        type="button"
                        data-url="${item.evidence_url}"
                      >
                        View Snapshot
                      </button>


                    </div>

                  </div>

                </article>

              `).join("")

              : `

                <section
                  class="card"
                  style="
                    grid-column:1/-1;
                    padding:50px;
                    text-align:center;
                    color:#64756f;
                  "
                >
                  No evidence snapshots available.
                </section>

              `
          }

        </div>

      </div>

    `;

    /* Search */

    document
      .getElementById(
        "evidenceSearch"
      )
      ?.addEventListener(
        "input",
        event => {

          const query =
            event.target.value
              .trim()
              .toLowerCase();

          document
            .querySelectorAll(
              "#evidenceGrid .evidence-card"
            )
            .forEach(card => {

              card.hidden =
                !card.dataset.search.includes(
                  query
                );

            });
        }
      );
    /* View */

    moduleView
      .querySelectorAll(".view-evidence")
      .forEach(button => {

        button.addEventListener("click", () => {

          const url = button.dataset.url;

          if (url) {
            window.open(url, "_blank");
          }

        });

      });


    /* Evidence filters */

    moduleView
      .querySelectorAll(".evidence-filter")
      .forEach(button => {

        button.addEventListener("click", () => {

          const filter = button.dataset.filter;

          moduleView
            .querySelectorAll(".evidence-filter")
            .forEach(btn => {
              btn.classList.remove("active");
            });

          button.classList.add("active");

          moduleView
            .querySelectorAll("#evidenceGrid .evidence-card")
            .forEach(card => {

              const type = card.dataset.type;

              card.hidden =
                filter !== "all" &&
                type !== filter;

            });

        });

      });
    }
  /* =========================================================
     ANALYTICS
  ========================================================= */

  function renderAnalytics() {

    showView("module");

    setPageTitle(
      "Analytics"
    );

    moduleView.innerHTML = `

      <div class="analytics-page">

        <section class="card analytics-header">

          <div>

            <h1>
              Analytics
            </h1>

            <p>
              Operational intelligence and
              security activity trends.
            </p>

          </div>

          <select class="analytics-period">

            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>

          </select>

        </section>

        <div class="analytics-kpis">

          <section class="card analytics-kpi">

            <span class="analytics-kpi-label">
              Total Detections
            </span>

            <strong>
              184
            </strong>

            <em>
              +12.4% from previous period
            </em>

          </section>

          <section class="card analytics-kpi">

            <span class="analytics-kpi-label">
              Intrusion Events
            </span>

            <strong>
              27
            </strong>

            <em>
              +4 events
            </em>

          </section>

          <section class="card analytics-kpi">

            <span class="analytics-kpi-label">
              Active Tracks
            </span>

            <strong>
              18
            </strong>

            <em>
              Across 4 cameras
            </em>

          </section>

          <section class="card analytics-kpi">

            <span class="analytics-kpi-label">
              Evidence Captured
            </span>

            <strong>
              64
            </strong>

            <em>
              8 new today
            </em>

          </section>

        </div>

        <div class="analytics-layout">

          <section class="card analytics-card">

            <h2>
              Detection Activity
            </h2>

            <div class="chart">
              <div class="chart-line"></div>
            </div>

          </section>

          <section class="card analytics-card">

            <h2>
              Event Distribution
            </h2>

            <div class="analytics-list">

              <div class="analytics-list-row">
                <span>Human Detection</span>
                <strong>92</strong>
              </div>

              <div class="analytics-list-row">
                <span>Face Detection</span>
                <strong>38</strong>
              </div>

              <div class="analytics-list-row">
                <span>ANPR</span>
                <strong>31</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  /* =========================================================
     SETTINGS
     
     IMPORTANT:
     Settings already exists in index.html.
     We simply show it.
  ========================================================= */

  function renderSettings() {

    showView("settings");

    setPageTitle(
      "Settings"
    );

    /* Bind switches */

    settingsView
      ?.querySelectorAll(
        ".switch"
      )
      .forEach(button => {

        button.onclick = () => {

          const active =
            button.classList.toggle(
              "active"
            );

          button.setAttribute(
            "aria-pressed",
            String(active)
          );
        };

      });

    /* Save */

    document
      .getElementById(
        "saveSettings"
      )
      ?.addEventListener(
        "click",
        () => {

          showToast(
            "Settings saved successfully"
          );

        },
        {
          once: true
        }
      );

    /* Reset */

    document
      .getElementById(
        "resetSettings"
      )
      ?.addEventListener(
        "click",
        () => {

          settingsView
            ?.querySelectorAll(
              ".switch"
            )
            .forEach(button => {

              button.classList.add(
                "active"
              );

              button.setAttribute(
                "aria-pressed",
                "true"
              );

            });

          showToast(
            "Settings reset"
          );

        },
        {
          once: true
        }
      );
  }

  /* =========================================================
     EVENT FILTERS
  ========================================================= */

  function initialiseEventFilters() {

    document
      .querySelectorAll(
        "#eventFilters button"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                "#eventFilters button"
              )
              .forEach(item =>
                item.classList.remove(
                  "selected"
                )
              );

            button.classList.add(
              "selected"
            );

            const filter =
              button.textContent
                .trim()
                .toLowerCase();

            document
              .querySelectorAll(
                "#eventsBody tr"
              )
              .forEach(row => {

                row.style.display =
                  filter === "all" ||
                  row.dataset.type
                    .includes(filter)
                    ? ""
                    : "none";

              });

          }
        );

      });
  }

  /* =========================================================
     CAMERA ANGLES
  ========================================================= */

  function initialiseCameraAngles() {

    document
      .querySelectorAll(
        ".angle"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".angle"
              )
              .forEach(item =>
                item.classList.remove(
                  "active"
                )
              );

            document
              .querySelectorAll(
                ".angle-dot"
              )
              .forEach(dot =>
                dot.classList.remove(
                  "active-dot"
                )
              );

            button.classList.add(
              "active"
            );

            button
              .querySelector(
                ".angle-dot"
              )
              ?.classList.add(
                "active-dot"
              );

            const camera =
              button.dataset.angle;

            const selectedCamera =
              document.getElementById(
                "selectedCamera"
              );

            if (selectedCamera)
              selectedCamera.textContent =
                camera;

            showToast(
              `${camera} camera selected`
            );
          }
        );

      });
  }

  /* =========================================================
     SNAPSHOT
  ========================================================= */

  function initialiseSnapshot() {

    document
      .getElementById(
        "snapshotBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          showToast(
            "Snapshot captured"
          );

        }
      );
  }

  /* =========================================================
     EVENT VIEW BUTTONS
  ========================================================= */

  function initialiseViewButtons() {

    document
      .querySelectorAll(
        ".view-btn"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const row =
              button.closest("tr");

            const id =
              row
                ?.children[2]
                ?.textContent
                .trim();

            showToast(
              `Opening evidence for ${id || "event"}`
            );
          }
        );

      });
  }

  /* =========================================================
     API DATA / JOB CONTROL
  ========================================================= */

  function setApiConnection(online, text) {
    const el = document.getElementById("apiConnectionStatus");
    if (!el) return;
    el.innerHTML = `<span></span>${text}`;
    el.classList.toggle("api-offline", !online);
  }

function updateRenderedDashboard() {
  if (!apiStats) return;

  const total = Number(apiStats.ai_events || 0);

const active =
  Number(apiStats.intrusion_events || 0) +
  Number(apiStats.suspicious_events || 0);

const cameraOnline =
  apiStats.active_camera ? 1 : 0;

  document
    .getElementById("metricTotalDetections")
    ?.replaceChildren(String(total));

  document
    .getElementById("metricActiveDetections")
    ?.replaceChildren(String(active));

  document
    .getElementById("metricCameras")
    ?.replaceChildren(String(cameraOnline));

  document
    .getElementById("metricCameraStatus")
    ?.replaceChildren(
      apiStatus?.camera_id
        ? `${apiStatus.camera_id} · ${apiStatus.status || "ACTIVE"}`
        : "FastAPI connected"
    );

  document
    .getElementById("moduleHumanValue")
    ?.replaceChildren(String(apiStats.ai_events || 0));

  document
    .getElementById("moduleAnprValue")
    ?.replaceChildren(String(apiStats.plates_read || 0));
  const cameraName =
  apiStatus?.camera_id ||
  apiStats.active_camera ||
  "API";

document
  .getElementById("moduleHumanCamera")
  ?.replaceChildren(
    `Persons detected · ${cameraName}`
  );

document
  .getElementById("moduleAnprCamera")
  ?.replaceChildren(
    `Vehicles detected · ${cameraName}`
  );

  const cameraInput = document.getElementById("apiCameraId");
  if (cameraInput && apiStatus?.camera_id) {
    cameraInput.value = apiStatus.camera_id;
  }

const fenceInput = document.getElementById("apiFencePoints");

// Only restore the backend fence when the input is empty.
// Do not overwrite a polygon currently drawn by the user.
if (
  fenceInput &&
  !fenceInput.value.trim() &&
  Array.isArray(apiStatus?.fence_points) &&
  apiStatus.fence_points.length >= 3
) {
  fenceInput.value = JSON.stringify(apiStatus.fence_points);
}
}

  function updateStatusText() {
    const el = document.getElementById("apiDetectionStatus");
    if (!el || !apiStatus) return;
    let text = `Detection status: ${apiStatus.status || "UNKNOWN"}`;
    if (apiStatus.error) text += ` — ${apiStatus.error}`;
    if (apiStatus.frames_processed) text += ` — ${apiStatus.frames_processed} frames`;
    el.textContent = text;
  }

  function renderApiEvents() {
    const list = document.querySelector(".recent-alerts-panel .alert-list");
    if (!list || !apiEvents.length) return;

    list.innerHTML = apiEvents.slice(0, 3).map(event => {
      const type = String(event.event_type || "event").toUpperCase();
      const object = event.object_type || "object";
      const time = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : "recent";
      const critical = ["intrusion", "suspicious_activity"].includes(event.event_type);
      return `<button class="alert-row ${critical ? "critical" : "warning"}" type="button" data-page="Evidence Gallery">
        <span class="alert-dot"></span>
        <span class="alert-content"><strong>${type.replaceAll("_", " ")}</strong><small>${object} · ${event.camera_id || "CAM_01"}</small></span>
        <span class="alert-time">${time}</span>
        <svg class="alert-arrow" aria-hidden="true"><use href="#i-chevron"></use></svg>
      </button>`;
    }).join("");
  }

  async function refreshApiData() {
    try {
      const [health, stats, events, status] = await Promise.all([
        apiFetch("/api/health"),
        apiFetch("/api/stats"),
        apiFetch("/api/events?limit=10"),
        apiFetch("/api/detection/status")
      ]);

      apiStats = stats;
      apiEvents = events || [];
      apiStatus = status;
      

    const processedVideoElement =
      document.getElementById("processedResultVideo");

if (
    processedVideoElement &&
    status.status === "COMPLETED" &&
    status.job_id &&
    processedVideoElement.dataset.jobId !== status.job_id
) {
    processedVideo.src =
        "/api/video/intrusion_browser.mp4?t=" + Date.now();

    processedVideoElement.load();

    processedVideoElement.dataset.jobId = status.job_id;
}

      const startButton =
  document.getElementById("apiStartDetection");

if (startButton) {

  if (
    status.status === "STARTING" ||
    status.status === "RUNNING"
  ) {
    startButton.disabled = true;
    startButton.textContent = "DETECTION RUNNING";
  } else {
    startButton.disabled = false;
    startButton.textContent = "START DETECTION";
  }

}
      document
  .getElementById("videoFrames")
  ?.replaceChildren(String(stats.frames_processed || 0));

document
  .getElementById("videoIntrusions")
  ?.replaceChildren(String(stats.intrusion_events || 0));

document
  .getElementById("videoStatus")
  ?.replaceChildren(String(status.status || "UNKNOWN"));
      setApiConnection(true, "API ONLINE");
      updateRenderedDashboard();
      updateStatusText();
      renderApiEvents();

      if (getCurrentPage() === "Dashboard") {
        pageData["Human Detection"].stats[0][0] = String(stats.ai_events || 0);
        pageData["Human Detection"].stats[1][0] = String(stats.intrusion_events || 0);
        pageData["Human Detection"].stats[2][0] = String(stats.suspicious_events || 0);
        pageData["Human Detection"].stats[3][0] = String(stats.frames_processed || 0);
        pageData["ANPR"].stats[0][0] = String(stats.plates_read || 0);
        pageData["ANPR"].stats[1][0] = String(stats.plates_read || 0);
      }
    } catch (error) {
      setApiConnection(false, "API OFFLINE");
      const status = document.getElementById("apiDetectionStatus");
      if (status) status.textContent = `API error: ${error.message}`;
    }
  }
  /* =========================================================
     CUSTOM POLYGON FENCE EDITOR
  ========================================================= */
function initialisePolygonFence() {

  const fenceEditor = document.getElementById("fenceEditorVideo");
  const fenceCanvas = document.getElementById("fenceCanvas");
  const fenceDrawButton = document.getElementById("fenceDrawButton");
  const fenceFinishButton = document.getElementById("fenceFinishButton");
  const fenceClearButton = document.getElementById("fenceClearButton");
  const fencePointCount = document.getElementById("fencePointCount");
  const fenceHint = document.getElementById("fenceEditorHint");
  const fenceInput = document.getElementById("apiFencePoints");

  let fencePoints = [];
  let fenceDrawing = false;

  function resizeFenceCanvas() {

    if (!fenceEditor || !fenceCanvas) return;

    const rect = fenceEditor.getBoundingClientRect();

    fenceCanvas.width = rect.width;
    fenceCanvas.height = rect.height;

    drawFence();
  }

  function drawFence() {

    if (!fenceCanvas) return;

    const ctx = fenceCanvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      fenceCanvas.width,
      fenceCanvas.height
    );

    if (!fencePoints.length) return;

    ctx.beginPath();

    fencePoints.forEach((point, index) => {

      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }

    });

    if (fencePoints.length >= 3) {
      ctx.closePath();
    }

    ctx.fillStyle = "rgba(0, 128, 96, 0.18)";
    ctx.fill();

    ctx.strokeStyle = "#00a982";
    ctx.lineWidth = 3;
    ctx.stroke();

    fencePoints.forEach((point, index) => {

      ctx.beginPath();

      ctx.arc(
        point.x,
        point.y,
        6,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.strokeStyle = "#00a982";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#19352e";
      ctx.font = "bold 12px Arial";

      ctx.fillText(
        String(index + 1),
        point.x + 9,
        point.y - 9
      );

    });

  }

  function updateFenceInput() {

    if (!fenceEditor || !fenceInput) return;

    const videoWidth = 848;
    const videoHeight = 478;

    const rect =
      fenceEditor.getBoundingClientRect();

    const scaleX =
      videoWidth / rect.width;

    const scaleY =
      videoHeight / rect.height;

    const coordinates =
      fencePoints.map(point => [

        Math.round(point.x * scaleX),

        Math.round(point.y * scaleY)

      ]);

    fenceInput.value =
      JSON.stringify(coordinates);

    if (fencePointCount) {

      fencePointCount.textContent =
        `${fencePoints.length} point${
          fencePoints.length === 1 ? "" : "s"
        }`;

    }

  }

  function clearFence() {

    fencePoints = [];

    fenceDrawing = false;

    if (fenceInput) {
      fenceInput.value = "";
    }

    if (fencePointCount) {
      fencePointCount.textContent = "0 points";
    }

    if (fenceHint) {
      fenceHint.textContent =
        "Click DRAW POLYGON, then click points on the video";
    }

    if (fenceDrawButton) {
      fenceDrawButton.disabled = false;
    }

    if (fenceFinishButton) {
      fenceFinishButton.disabled = true;
    }

    drawFence();

  }

  fenceDrawButton?.addEventListener(
    "click",
    () => {

      fenceDrawing = true;

      fencePoints = [];

      if (fenceInput) {
        fenceInput.value = "";
      }

      if (fenceHint) {
        fenceHint.textContent =
          "Click points around the area you want to protect";
      }

      fenceDrawButton.disabled = true;
      fenceFinishButton.disabled = false;

      drawFence();

    }
  );

  fenceCanvas?.addEventListener(
    "click",
    event => {

      if (!fenceDrawing) return;

      const rect =
        fenceCanvas.getBoundingClientRect();

      const x =
        event.clientX - rect.left;

      const y =
        event.clientY - rect.top;

      fencePoints.push({
        x,
        y
      });

      updateFenceInput();
      drawFence();

    }
  );

  fenceFinishButton?.addEventListener(
    "click",
    () => {

      if (fencePoints.length < 3) {

        showToast(
          "A polygon needs at least 3 points"
        );

        return;
      }

      fenceDrawing = false;

      updateFenceInput();

      if (fenceHint) {
        fenceHint.textContent =
          "Custom polygon ready for detection";
      }

      fenceDrawButton.disabled = false;
      fenceFinishButton.disabled = true;

      showToast(
        `Polygon fence created with ${fencePoints.length} points`
      );

    }
  );

  fenceClearButton?.addEventListener(
    "click",
    clearFence
  );

  window.addEventListener(
    "resize",
    resizeFenceCanvas
  );

  fenceEditor?.addEventListener(
    "load",
    resizeFenceCanvas
  );

  setTimeout(
    resizeFenceCanvas,
    100
  );
}

  const featureConfigs = {
    ANPR: { start: "/api/anpr/start", status: "/api/anpr/status", reset: "/api/anpr/reset", video: "/api/anpr/video", label: "ANPR" },
    FACE: { start: "/api/face/start", status: "/api/face/status", reset: "/api/face/reset", video: "/api/face/video", label: "FACE" },
    NIGHT: { start: "/api/night/start", status: "/api/night/status", reset: "/api/night/reset", video: "/api/night/video", label: "NIGHT" }
  };

  async function refreshFeatureStates() {
    for (const [key, cfg] of Object.entries(featureConfigs)) {
      try {
        const data = await apiFetch(cfg.status);
        const statusEl = document.getElementById(`${key.toLowerCase()}Status`);
        const startEl = document.getElementById(`${key.toLowerCase()}StartButton`);
        const videoEl = document.getElementById(`${key.toLowerCase()}ResultVideo`);
        const errorEl = document.getElementById(`${key.toLowerCase()}Error`);
        if (statusEl) statusEl.textContent = data.status || "UNKNOWN";
        if (startEl) {
          const running = ["STARTING", "RUNNING"].includes(data.status);
          startEl.disabled = running;
          startEl.textContent = running ? `${cfg.label} RUNNING` : `START ${cfg.label}`;
        }
        if (errorEl) {
          errorEl.textContent = data.error || "";
          errorEl.style.display = data.error ? "block" : "none";
        }
        if (videoEl && data.status === "COMPLETED" && data.job_id && videoEl.dataset.jobId !== data.job_id) {
          videoEl.src = `${cfg.video}?t=${Date.now()}`;
          videoEl.dataset.jobId = data.job_id;
          videoEl.load();
        }
      } catch (_) {
        // Feature endpoints can be unavailable while the server is restarting.
      }
    }
  }

  async function startFeature(key) {
    const cfg = featureConfigs[key];
    if (!cfg) return;
    const startEl = document.getElementById(`${key.toLowerCase()}StartButton`);
    if (startEl?.disabled) return;
    try {
      let fencePoints = [];
      const fenceInput = document.getElementById("apiFencePoints");
      if (key === "NIGHT" && fenceInput?.value?.trim()) {
        try { fencePoints = JSON.parse(fenceInput.value); } catch (_) {}
      }
      await apiFetch(cfg.start, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camera_id: "CAM_01", video: "cctv.mp4", fence_points: fencePoints })
      });
      showToast(`${cfg.label} processing started`);
      await refreshFeatureStates();
    } catch (error) {
      showToast(error.message);
      await refreshFeatureStates();
    }
  }

  async function resetFeature(key) {
    const cfg = featureConfigs[key];
    if (!cfg) return;
    try {
      await apiFetch(cfg.reset, { method: "POST" });
      const videoEl = document.getElementById(`${key.toLowerCase()}ResultVideo`);
      if (videoEl) { videoEl.pause(); videoEl.removeAttribute("src"); videoEl.load(); videoEl.dataset.jobId = ""; }
      showToast(`${cfg.label} reset`);
      await refreshFeatureStates();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function startApiDetection() {

  const startButton =
    document.getElementById("apiStartDetection");

  if (startButton?.disabled) {
    return;
  }

  const raw =
    document.getElementById("apiFencePoints")?.value?.trim();

  const camera =
    document.getElementById("apiCameraId")?.value?.trim() || "CAM_01";

  if (!raw) {
    showToast("Draw a polygon fence first");
    return;
  }

  startButton.disabled = true;
  startButton.textContent = "DETECTION RUNNING";

    let fencePoints;
    try {
      fencePoints = JSON.parse(raw);
    } catch (_) {
      showToast("Fence points must be valid JSON");
      return;
    }

    try {
      await apiFetch("/api/detection/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fence_points: fencePoints, camera_id: camera, video: "cctv.mp4" })
      });
      showToast("AI detection started");
      await refreshApiData();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function resetApiDetection() {
    try {
      await apiFetch("/api/detection/reset", { method: "POST" });
      showToast("Detection state reset");
      await refreshApiData();
    } catch (error) {
      showToast(error.message);
      startButton.disabled = false;
      startButton.textContent = "START DETECTION";
    }
  }

  function initialiseApiControls() {
    document.getElementById("apiStartDetection")?.addEventListener("click", startApiDetection);
    document.getElementById("apiResetDetection")?.addEventListener("click", resetApiDetection);
  }

  /* =========================================================
     ROUTER
  ========================================================= */

  function renderPage(page) {
    setActiveSidebar(page);

    switch (page) {
      case "Dashboard":
        renderDashboard();
        break;

      case "Evidence Gallery":
        renderEvidenceGallery();
        break;

      case "Analytics":
        renderAnalytics();
        break;

      case "Settings":
        renderSettings();
        break;

      case "Human Detection":
      case "Face Detection":
      case "ANPR":
      case "Night Time Surveillance":
        renderDetectionPage(page);
        break;
      default:
        renderDashboard();
    }
  }

  /* =========================================================
     INITIALISE
  ========================================================= */

  const currentPage = getCurrentPage();
  renderPage(currentPage);
  initialisePolygonFence();
  initialiseApiControls();
  refreshApiData();
  window.__ibvapApiPoll = setInterval(refreshApiData, 2000);
  refreshFeatureStates();
  window.__ibvapFeaturePoll = setInterval(refreshFeatureStates, 2000);

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.id || "";
    if (id === "anprStartButton") startFeature("ANPR");
    else if (id === "anprResetButton") resetFeature("ANPR");
    else if (id === "faceStartButton") startFeature("FACE");
    else if (id === "faceResetButton") resetFeature("FACE");
    else if (id === "nightStartButton") startFeature("NIGHT");
    else if (id === "nightResetButton") resetFeature("NIGHT");
  });
  /* These only need to be attached
    to elements that exist in the
    dashboard/explore layout. */
  initialiseEventFilters();
  initialiseCameraAngles();
  initialiseSnapshot();
  initialiseViewButtons();

  document
  .querySelector(".suspicious-view")
  ?.addEventListener(
    "click",
    () => {
      showToast(
        "Opening suspicious activity"
      );
    }
  );
});

/* =========================================================
   RESPONSIVE LAYOUT HANDLER
========================================================= */

function syncResponsiveLayout() {
  const width = window.innerWidth;
  const sidebar = document.querySelector(".sidebar");

  if (!sidebar) return;

  if (width <= 850) {
    sidebar.classList.remove("compact");
  }
}

let resizeTimer;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    syncResponsiveLayout();
  }, 100);
});

syncResponsiveLayout();