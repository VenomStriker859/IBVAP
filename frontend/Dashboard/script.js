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
     PAGE DATA
  ========================================================= */

  const pageData = {

    "Human Detection": {
      camera: "CAM-04",
      location: "Perimeter Road (North Sector)",
      summary: "Detection Summary",
      events: "Detection Events",

      stats: [
        ["12", "Persons Detected", "+3 today", "i-human"],
        ["7", "Active Tracks", "+1 today", "i-location"],
        ["4", "Entry Events", "+2 today", "i-login"],
        ["2", "Exit Events", "+0 today", "i-logout"]
      ]
    },

    "Face Detection": {
      camera: "CAM-05",
      location: "Checkpoint Road (East Sector)",
      summary: "Face Detection Summary",
      events: "Face Detection Events",

      stats: [
        ["18", "Faces Detected", "+4 today", "i-face"],
        ["9", "Active Tracks", "+2 today", "i-location"],
        ["6", "Verified Events", "+2 today", "i-check"],
        ["3", "Review Required", "+1 today", "i-alert"]
      ]
    },

    "ANPR": {
      camera: "CAM-06",
      location: "Vehicle Checkpoint (North Sector)",
      summary: "ANPR Summary",
      events: "Vehicle Recognition Events",

      stats: [
        ["24", "Vehicles Detected", "+6 today", "i-car"],
        ["19", "Plates Read", "+5 today", "i-file"],
        ["7", "Entry Events", "+2 today", "i-login"],
        ["2", "Flagged Plates", "+1 today", "i-alert"]
      ]
    },

    "Night Time Surveillance": {
      camera: "CAM-09",
      location: "Night Patrol Route (South Sector)",
      summary: "Night Surveillance Summary",
      events: "Night Surveillance Events",

      stats: [
        ["9", "Night Events", "+2 today", "i-moon"],
        ["5", "Active Tracks", "+1 today", "i-location"],
        ["3", "Movement Alerts", "+1 today", "i-alert"],
        ["1", "Review Required", "+0 today", "i-file"]
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
          <strong>${totalDetections}</strong>
          <small>Today, across all sites</small>
        </div>

        <div class="metric-item">
          <span>Active Detections</span>
          <strong>6</strong>
          <small>Awaiting review</small>
        </div>

        <div class="metric-item">
          <span>Cameras Online</span>
          <strong>4 / 4</strong>
          <small>All feeds live</small>
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
            <small>Persons detected · CAM-04</small>
          </div>

          <strong class="module-row-value">${pageData["Human Detection"].stats[0][0]}</strong>

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

          <strong class="module-row-value">${pageData["Face Detection"].stats[0][0]}</strong>

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
            <small>Vehicles detected · CAM-06</small>
          </div>

          <strong class="module-row-value">${pageData["ANPR"].stats[0][0]}</strong>

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

          <strong class="module-row-value">${pageData["Night Time Surveillance"].stats[0][0]}</strong>

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

  function renderEvidenceGallery() {

    showView("module");

    setPageTitle(
      "Evidence Gallery"
    );

    const evidence =
      getEvidence();

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
            Intrusion Evidence
          </strong>

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
                  data-search="${(
                    item.id +
                    " " +
                    item.event +
                    " " +
                    item.camera +
                    " " +
                    item.location
                  ).toLowerCase()}"
                >

                  <div class="evidence-preview">

                    <span class="evidence-label">
                      ${item.id}
                    </span>

                  </div>

                  <div class="evidence-info">

                    <h3>
                      ${item.event}
                    </h3>

                    <p>
                      Camera: ${item.camera}
                    </p>

                    <p>
                      Date: ${item.date}
                    </p>

                    <p>
                      Time: ${item.time}
                    </p>

                    <p>
                      Location: ${item.location}
                    </p>

                    <div class="evidence-actions">

                      <button
                        class="view-evidence"
                        type="button"
                        data-id="${item.id}"
                      >
                        View Snapshot
                      </button>

                      <button
                        class="delete-evidence"
                        type="button"
                        data-id="${item.id}"
                      >
                        Delete
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
      .querySelectorAll(
        ".view-evidence"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            showToast(
              `Opening snapshot ${button.dataset.id}`
            );

          }
        );
      });

    /* Delete */

    moduleView
      .querySelectorAll(
        ".delete-evidence"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.id;

            if (
              !window.confirm(
                "Delete this evidence snapshot?"
              )
            ) return;

            const remaining =
              getEvidence().filter(
                item =>
                  item.id !== id
              );

            saveEvidence(
              remaining
            );

            renderEvidenceGallery();

            showToast(
              "Evidence deleted"
            );
          }
        );
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