// ---------- Navigation ----------
const nav = document.getElementById("nav");
const navBurger = document.getElementById("navBurger");
const navLinks = document.querySelector(".nav-links");

function updateNav() {
  if (!nav) return;

  const y = window.scrollY;

  nav.classList.toggle("visible", y > window.innerHeight * 0.55);
  nav.classList.toggle("solid", y > 40);
}

window.addEventListener("scroll", updateNav, { passive: true });
updateNav();

navBurger?.addEventListener("click", () => {
  const open = navBurger.getAttribute("aria-expanded") === "true";

  navBurger.setAttribute("aria-expanded", String(!open));
  navLinks.style.display = open ? "" : "flex";
  navLinks.style.flexDirection = "column";
  navLinks.style.position = "absolute";
  navLinks.style.top = "64px";
  navLinks.style.left = "0";
  navLinks.style.right = "0";
  navLinks.style.padding = "20px 5vw";
  navLinks.style.background = "rgba(7,11,8,.98)";
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.style.display = "";
    navBurger?.setAttribute("aria-expanded", "false");
  });
});


// ---------- Repeating scroll animations ----------
const revealElements = document.querySelectorAll(
  ".problem-hero, .dossier, footer"
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      } else {
        entry.target.classList.remove("in-view");
      }
    });
  },
  {
    threshold: 0.15,
    rootMargin: "0px 0px -8% 0px"
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});


// ---------- Login overlay ----------
const loginScreen = document.getElementById("loginScreen");
const openLoginButtons = [
  document.getElementById("openLogin"),
  document.getElementById("footLogin")
];
const closeLogin = document.getElementById("closeLogin");

function toggleLogin(show) {
  if (!loginScreen) return;

  loginScreen.classList.toggle("active", show);
  loginScreen.setAttribute("aria-hidden", String(!show));

  if (show) {
    document.getElementById("username")?.focus();
  }
}

openLoginButtons.forEach((button) => {
  button?.addEventListener("click", (event) => {
    event.preventDefault();
    toggleLogin(true);
  });
});

closeLogin?.addEventListener("click", () => toggleLogin(false));

loginScreen?.addEventListener("click", (event) => {
  if (event.target === loginScreen) {
    toggleLogin(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleLogin(false);
  }
});


// ---------- CAPTCHA ----------
const captchaCode = document.getElementById("captchaCode");
const captchaRefresh = document.getElementById("captchaRefresh");
const loginForm = document.getElementById("loginForm");
const captchaInput = document.getElementById("capInput");
const loginError = document.getElementById("loginError");

let currentCaptcha = "";

function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  currentCaptcha = Array.from(
    { length: 5 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  if (captchaCode) {
    captchaCode.textContent = currentCaptcha;
  }
}

generateCaptcha();

captchaRefresh?.addEventListener("click", generateCaptcha);

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!captchaInput || !loginError) return;

  if (captchaInput.value.trim().toUpperCase() !== currentCaptcha) {
    loginError.textContent = "Captcha does not match. Try again.";
    captchaInput.value = "";
    generateCaptcha();
    return;
  }

  window.location.href = "/dashboard";
});


// ---------- Local webcam demo ----------
const webcam = document.getElementById("webcam");
const startCamera = document.getElementById("startCamera");
const stopCamera = document.getElementById("stopCamera");
const cameraPrompt = document.getElementById("cameraPrompt");
const cameraStatus = document.getElementById("cameraStatus");

let cameraStream = null;

startCamera?.addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    if (cameraStatus) cameraStatus.textContent = "UNAVAILABLE";

    if (cameraPrompt) {
      cameraPrompt.innerHTML =
        "<strong>Camera unavailable</strong>" +
        "This browser does not expose webcam access here. " +
        "The monitoring layout is ready for a network camera stream.";
    }

    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    if (webcam) {
      webcam.srcObject = cameraStream;
      webcam.classList.remove("is-placeholder");
    }

    if (cameraStatus) {
      cameraStatus.textContent = "LIVE";
    }

    if (cameraPrompt) {
      cameraPrompt.style.display = "none";
    }

    // Start disappears; Stop appears.
    startCamera.hidden = true;
    stopCamera.hidden = false;

  } catch (error) {
    if (cameraStatus) {
      cameraStatus.textContent = "STANDBY";
    }

    if (cameraPrompt) {
      cameraPrompt.innerHTML =
        "<strong>Preview paused</strong>" +
        "Camera permission was not granted. " +
        "The feed can be connected later to a CCTV or RTSP source.";
    }
  }
});

stopCamera?.addEventListener("click", () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  if (webcam) {
    webcam.srcObject = null;
    webcam.classList.add("is-placeholder");
  }

  if (cameraStatus) {
    cameraStatus.textContent = "STANDBY";
  }

  if (cameraPrompt) {
    cameraPrompt.innerHTML =
      "<strong>Camera stopped</strong>" +
      "Start the camera to resume the live preview.";
    cameraPrompt.style.display = "block";
  }

  // Start appears again; Stop disappears.
  startCamera.hidden = false;
  stopCamera.hidden = true;
});