// app.js
// Plain global JS, no modules.

// -------------------
// Data generator
// -------------------
const TAGS = [
  "Coffee","Hiking","Movies","Live Music","Board Games","Cats","Dogs","Traveler",
  "Foodie","Tech","Art","Runner","Climbing","Books","Yoga","Photography"
];
const FIRST_NAMES = [
  "Alex","Sam","Jordan","Taylor","Casey","Avery","Riley","Morgan","Quinn","Cameron",
  "Jamie","Drew","Parker","Reese","Emerson","Rowan","Shawn","Harper","Skyler","Devon"
];
const CITIES = [
  "Brooklyn","Manhattan","Queens","Jersey City","Hoboken","Astoria",
  "Williamsburg","Bushwick","Harlem","Lower East Side"
];
const JOBS = [
  "Product Designer","Software Engineer","Data Analyst","Barista","Teacher",
  "Photographer","Architect","Chef","Nurse","Marketing Manager","UX Researcher"
];
const BIOS = [
  "Weekend hikes and weekday lattes.",
  "Dog parent. Amateur chef. Karaoke enthusiast.",
  "Trying every taco in the city — for science.",
  "Bookstore browser and movie quote machine.",
  "Gym sometimes, Netflix always.",
  "Looking for the best slice in town.",
  "Will beat you at Mario Kart.",
  "Currently planning the next trip."
];

const UNSPLASH_SEEDS = [
  "1515462277126-2b47b9fa09e6",
  "1520975916090-3105956dac38",
  "1519340241574-2cec6aef0c01",
  "1554151228-14d9def656e4",
  "1548142813-c348350df52b",
  "1517841905240-472988babdf9",
  "1535713875002-d1d0cf377fde",
  "1545996124-0501ebae84d0",
  "1524504388940-b1c1722653e1",
  "1531123897727-8f129e1688ce",
];

function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickTags() { return Array.from(new Set(Array.from({length:4}, ()=>sample(TAGS)))); }
function imgFor(seed) {
  return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;
}

function generateProfiles(count = 12) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const shuffled = [...UNSPLASH_SEEDS].sort(() => Math.random() - 0.5);
    const numPhotos = 2 + Math.floor(Math.random() * 3); // 2–4 photos per profile
    profiles.push({
      id: `p_${i}_${Date.now().toString(36)}`,
      name: sample(FIRST_NAMES),
      age: 18 + Math.floor(Math.random() * 22),
      city: sample(CITIES),
      title: sample(JOBS),
      bio: sample(BIOS),
      tags: pickTags(),
      photos: shuffled.slice(0, numPhotos).map(imgFor),
      photoIndex: 0,
    });
  }
  return profiles;
}

// -------------------
// UI elements
// -------------------
const deckEl = document.getElementById("deck");
const shuffleBtn = document.getElementById("shuffleBtn");
const likeBtn = document.getElementById("likeBtn");
const nopeBtn = document.getElementById("nopeBtn");
const superLikeBtn = document.getElementById("superLikeBtn");

let profiles = [];

// -------------------
// Card rendering
// -------------------
function buildCard(p) {
  const card = document.createElement("article");
  card.className = "card";
  card._profile = p;

  const img = document.createElement("img");
  img.className = "card__media";
  img.src = p.photos[0];
  img.alt = `${p.name} — profile photo`;
  img.draggable = false;

  const dots = document.createElement("div");
  dots.className = "photo-dots";
  renderDots(dots, p.photos.length, 0);

  // Swipe-direction stamps
  const likeOverlay = document.createElement("div");
  likeOverlay.className = "swipe-overlay swipe-overlay--like";
  likeOverlay.textContent = "LIKE ♥";

  const nopeOverlay = document.createElement("div");
  nopeOverlay.className = "swipe-overlay swipe-overlay--nope";
  nopeOverlay.textContent = "NOPE ✖";

  const superOverlay = document.createElement("div");
  superOverlay.className = "swipe-overlay swipe-overlay--super";
  superOverlay.textContent = "SUPER ★";

  const body = document.createElement("div");
  body.className = "card__body";

  const titleRow = document.createElement("div");
  titleRow.className = "title-row";
  titleRow.innerHTML = `<h2 class="card__title">${p.name}</h2><span class="card__age">${p.age}</span>`;

  const meta = document.createElement("div");
  meta.className = "card__meta";
  meta.textContent = `${p.title} • ${p.city}`;

  const chips = document.createElement("div");
  chips.className = "card__chips";
  p.tags.forEach((t) => {
    const c = document.createElement("span");
    c.className = "chip";
    c.textContent = t;
    chips.appendChild(c);
  });

  body.appendChild(titleRow);
  body.appendChild(meta);
  body.appendChild(chips);

  card.appendChild(img);
  card.appendChild(dots);
  card.appendChild(likeOverlay);
  card.appendChild(nopeOverlay);
  card.appendChild(superOverlay);
  card.appendChild(body);

  attachGestures(card);
  return card;
}

function renderDots(dotsEl, total, active) {
  dotsEl.innerHTML = "";
  if (total <= 1) return;
  for (let i = 0; i < total; i++) {
    const d = document.createElement("span");
    d.className = "photo-dot" + (i === active ? " photo-dot--active" : "");
    dotsEl.appendChild(d);
  }
}

function renderDeck() {
  deckEl.setAttribute("aria-busy", "true");
  deckEl.innerHTML = "";
  profiles.forEach((p) => deckEl.appendChild(buildCard(p)));
  deckEl.removeAttribute("aria-busy");
  updateEmptyState();
}

function resetDeck() {
  profiles = generateProfiles(12);
  renderDeck();
}

// -------------------
// Photo browsing (double-tap)
// -------------------
function advancePhoto(card) {
  const p = card._profile;
  if (p.photos.length <= 1) return;
  p.photoIndex = (p.photoIndex + 1) % p.photos.length;
  card.querySelector(".card__media").src = p.photos[p.photoIndex];
  renderDots(card.querySelector(".photo-dots"), p.photos.length, p.photoIndex);
}

// -------------------
// Swipe gestures
// -------------------
const SWIPE_H = 80;   // px to trigger horizontal swipe
const SWIPE_UP = 80;  // px to trigger upward swipe

function getTopCard() {
  return deckEl.firstElementChild;
}

function attachGestures(card) {
  let startX = 0, startY = 0, isDragging = false, pointerDownTime = 0;
  let lastTapTime = 0;

  card.addEventListener("pointerdown", (e) => {
    if (card !== getTopCard()) return;
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
    pointerDownTime = Date.now();
    card.setPointerCapture(e.pointerId);
    card.style.transition = "none";
  });

  card.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.06}deg)`;
    updateOverlays(card, dx, dy);
  });

  card.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dist = Math.hypot(dx, dy);

    // Small movement + fast release → treat as a tap
    if (dist < 8 && Date.now() - pointerDownTime < 300) {
      const now = Date.now();
      if (now - lastTapTime < 350) {
        advancePhoto(card); // double-tap
        lastTapTime = 0;
      } else {
        lastTapTime = now;
      }
      card.style.transition = "";
      card.style.transform = "";
      clearOverlays(card);
      return;
    }

    if (dy < -SWIPE_UP && Math.abs(dx) < 80) {
      dismissCard(card, "up");
    } else if (dx > SWIPE_H) {
      dismissCard(card, "right");
    } else if (dx < -SWIPE_H) {
      dismissCard(card, "left");
    } else {
      snapBack(card);
    }
  });

  card.addEventListener("pointercancel", () => {
    isDragging = false;
    snapBack(card);
  });
}

function snapBack(card) {
  card.style.transition = "transform 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  card.style.transform = "";
  clearOverlays(card);
}

// -------------------
// Overlay helpers
// -------------------
function updateOverlays(card, dx, dy) {
  const likeEl = card.querySelector(".swipe-overlay--like");
  const nopeEl = card.querySelector(".swipe-overlay--nope");
  const superEl = card.querySelector(".swipe-overlay--super");
  const hRatio = Math.min(Math.abs(dx) / SWIPE_H, 1);
  const vRatio = Math.min(Math.abs(dy) / SWIPE_UP, 1);

  if (dx > 10) {
    likeEl.style.opacity = hRatio;
    nopeEl.style.opacity = 0;
    superEl.style.opacity = 0;
  } else if (dx < -10) {
    nopeEl.style.opacity = hRatio;
    likeEl.style.opacity = 0;
    superEl.style.opacity = 0;
  } else if (dy < -10) {
    superEl.style.opacity = vRatio;
    likeEl.style.opacity = 0;
    nopeEl.style.opacity = 0;
  } else {
    clearOverlays(card);
  }
}

function clearOverlays(card) {
  card.querySelectorAll(".swipe-overlay").forEach((el) => (el.style.opacity = 0));
}

function setOverlay(card, direction) {
  clearOverlays(card);
  const map = { right: "--like", left: "--nope", up: "--super" };
  const el = card.querySelector(`.swipe-overlay${map[direction]}`);
  if (el) el.style.opacity = 1;
}

// -------------------
// Card dismissal
// -------------------
function dismissCard(card, direction) {
  if (!card) return;
  setOverlay(card, direction);
  const outX = direction === "left" ? -1400 : direction === "right" ? 1400 : 0;
  const outY = direction === "up" ? -1400 : 0;
  const rotate = direction === "left" ? -30 : direction === "right" ? 30 : 0;
  card.style.transition = "transform 420ms ease-in, opacity 420ms ease-in";
  card.style.transform = `translate(${outX}px, ${outY}px) rotate(${rotate}deg)`;
  card.style.opacity = "0";
  card.addEventListener("transitionend", () => {
    card.remove();
    updateEmptyState();
  }, { once: true });
}

function updateEmptyState() {
  if (deckEl.children.length === 0) {
    deckEl.innerHTML = `<div class="empty-state"><p>You've seen everyone!</p><p>Hit <strong>Shuffle</strong> to see more.</p></div>`;
  }
}

// -------------------
// Button controls
// -------------------
likeBtn.addEventListener("click", () => dismissCard(getTopCard(), "right"));
nopeBtn.addEventListener("click", () => dismissCard(getTopCard(), "left"));
superLikeBtn.addEventListener("click", () => dismissCard(getTopCard(), "up"));
shuffleBtn.addEventListener("click", resetDeck);

// Boot
resetDeck();
