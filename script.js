const progress = document.querySelector(".progress-bar");
const heroProduct = document.querySelector(".hero-product");
const scenarioTrack = document.querySelector(".scenario-track");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -80px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateScrollMotion() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  progress.style.transform = `scaleX(${scrolled})`;

  const heroRange = Math.min(window.innerHeight * 1.25, 1200);
  const heroT = clamp(window.scrollY / heroRange, 0, 1);
  const lift = -26 * heroT;
  const scale = 1 + 0.09 * heroT;
  const fade = 1 - 0.28 * heroT;
  heroProduct?.style.setProperty("--float", `${lift}px`);
  heroProduct?.style.setProperty("--scale", scale.toFixed(3));
  heroProduct?.style.setProperty("--fade", fade.toFixed(3));

  if (scenarioTrack && window.innerWidth > 820) {
    const rect = scenarioTrack.parentElement.getBoundingClientRect();
    const start = window.innerHeight * 0.9;
    const end = -rect.height;
    const t = clamp((start - rect.top) / (start - end), 0, 1);
    scenarioTrack.style.transform = `translateX(${-t * 18}%)`;
  } else if (scenarioTrack) {
    scenarioTrack.style.transform = "";
  }
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateScrollMotion();
      ticking = false;
    });
    ticking = true;
  }
});

window.addEventListener("resize", updateScrollMotion);
updateScrollMotion();

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
