const root = document.documentElement;
const progress = document.querySelector(".page-progress span");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function splitWords(element) {
  if (element.dataset.split === "true") return;

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part.trim()) {
        fragment.appendChild(document.createTextNode(part));
        return;
      }

      const mask = document.createElement("span");
      const word = document.createElement("span");
      mask.className = "word-mask";
      word.className = "word";
      word.textContent = part;
      mask.appendChild(word);
      fragment.appendChild(mask);
    });
    node.replaceWith(fragment);
  });

  element.dataset.split = "true";
}

function prepareMotion() {
  document.querySelectorAll(".hero h1, .final-content h2, .section-header h2, .vision-panel h3").forEach(splitWords);

  document.querySelectorAll(".section-header, .vision-panel").forEach((element) => {
    element.classList.add("motion-copy");
  });

  document
    .querySelectorAll(
      ".media-frame, .film-frame, .info-card, .comparison-card, .product-card, .benefit-grid article, .feature-pills span"
    )
    .forEach((element) => element.classList.add("motion-item"));

  document.querySelectorAll(".card-grid, .comparison-grid, .product-grid, .benefit-grid, .feature-pills").forEach((group) => {
    [...group.children].forEach((child, index) => {
      child.style.setProperty("--stagger", `${Math.min(index, 7) * 85}ms`);
    });
  });

  root.classList.add("motion-ready");
}

prepareMotion();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      if (entry.target.classList.contains("reveal")) entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -9%" }
);

document
  .querySelectorAll(".reveal, .motion-copy, .motion-item, .story-columns, .story-question, .phone-pair, .final-content")
  .forEach((element) => revealObserver.observe(element));

document.querySelector(".hero-content")?.classList.add("is-visible");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateScrollEffects() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = `scaleX(${ratio})`;

  if (reduceMotion) return;

  const mobile = window.innerWidth < 700;
  const heroProgress = clamp(window.scrollY / Math.max(window.innerHeight, 1), 0, 1);
  root.style.setProperty("--hero-copy-y", `${heroProgress * (mobile ? -28 : -70)}px`);
  root.style.setProperty("--hero-image-scale", `${1 + heroProgress * (mobile ? 0.025 : 0.07)}`);
  root.style.setProperty("--hero-dim", `${1 - heroProgress * 0.42}`);

  document.querySelectorAll(".parallax-active").forEach((element) => {
    const rect = element.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const offset = clamp((center - viewportCenter) / window.innerHeight, -1, 1);
    element.style.setProperty("--parallax-y", `${offset * (mobile ? -10 : -24)}px`);
  });
}

document.querySelectorAll(".media-frame img, .final-cta > img").forEach((image) => {
  image.classList.add("parallax-active");
});

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScrollEffects();
      ticking = false;
    });
  },
  { passive: true }
);

window.addEventListener("resize", updateScrollEffects);
updateScrollEffects();

if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll(".info-card, .product-card, .comparison-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${y * -3.2}deg`);
      card.style.setProperty("--tilt-y", `${x * 3.2}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
});
