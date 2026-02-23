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
    profiles.push({
      id: `p_${i}_${Date.now().toString(36)}`,
      name: sample(FIRST_NAMES),
      age: 18 + Math.floor(Math.random() * 22),
      city: sample(CITIES),
      title: sample(JOBS),
      bio: sample(BIOS),
      tags: pickTags(),
      photos: Array.from({ length: 3 }, () => imgFor(sample(UNSPLASH_SEEDS))),
    });
  }
  return profiles;
}

// -------------------
// UI rendering
// -------------------
const deckEl = document.getElementById("deck");
const shuffleBtn = document.getElementById("shuffleBtn");
const likeBtn = document.getElementById("likeBtn");
const nopeBtn = document.getElementById("nopeBtn");
const superLikeBtn = document.getElementById("superLikeBtn");

let profiles = [];

function renderDeck() {
  deckEl.setAttribute("aria-busy", "true");
  deckEl.innerHTML = "";

  profiles.forEach((p, idx) => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card__media";
    img.src = p.photos[0];
    img.alt = `${p.name} — profile photo`;

    const body = document.createElement("div");
    body.className = "card__body";

    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    titleRow.innerHTML = `
      <h2 class="card__title">${p.name}</h2>
      <span class="card__age">${p.age}</span>
    `;

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

    const stamp = document.createElement("div");
    stamp.className = "card__stamp";

    card.appendChild(img);
    card.appendChild(body);
    card.appendChild(stamp);

    addCardHandlers(card, p);
    deckEl.appendChild(card);
  });

  deckEl.removeAttribute("aria-busy");
}

function resetDeck() {
  profiles = generateProfiles(12);
  renderDeck();
}

// -------------------
// Card interaction
// -------------------
const SWIPE_X = 80;  // px horizontal threshold
const SWIPE_Y = 80;  // px vertical threshold (upward)

function dismissTopCard(direction) {
  const top = deckEl.firstElementChild;
  if (!top || top.classList.contains("deck__empty")) return;

  const fly = {
    like:  "translateX(160%) rotate(30deg)",
    nope:  "translateX(-160%) rotate(-30deg)",
    super: "translateY(-160%)",
  };

  // Show the final stamp before flying off
  const stamp = top.querySelector(".card__stamp");
  const labels = { like: "LIKE", nope: "NOPE", super: "SUPER" };
  showStamp(stamp, labels[direction], direction, 1);

  top.style.transition = "transform 380ms ease, opacity 380ms ease";
  top.style.transform = fly[direction];
  top.style.opacity = "0";
  top.addEventListener("transitionend", () => {
    top.remove();
    checkEmptyDeck();
  }, { once: true });
}

function checkEmptyDeck() {
  if (deckEl.children.length === 0) {
    const msg = document.createElement("div");
    msg.className = "deck__empty";
    msg.innerHTML = `
      <div>
        <p style="font-size:52px;margin:0">🎉</p>
        <p style="font-weight:700">You've seen everyone!</p>
        <p style="font-size:13px">Hit Shuffle for more</p>
      </div>`;
    deckEl.appendChild(msg);
  }
}

function showStamp(stamp, text, type, opacity) {
  stamp.textContent = text;
  stamp.className = `card__stamp card__stamp--${type}`;
  stamp.style.opacity = opacity;
}

function addCardHandlers(card, profile) {
  let startX = 0, startY = 0, dragging = false, moved = false;
  let lastTap = 0, photoIdx = 0;
  const img   = card.querySelector(".card__media");
  const stamp = card.querySelector(".card__stamp");

  // ── Drag-to-swipe ──────────────────────────────────────────────
  card.addEventListener("pointerdown", (e) => {
    if (card !== deckEl.firstElementChild) return;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    moved = false;
    card.setPointerCapture(e.pointerId);
  });

  card.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;

    card.classList.add("card--dragging");
    card.style.transform = `translate(${dx}px,${dy}px) rotate(${dx * 0.05}deg)`;

    // Stamp feedback
    if (dy < -50 && Math.abs(dx) < 90) {
      showStamp(stamp, "SUPER", "super", Math.min(1, Math.abs(dy) / 120));
    } else if (dx > 20) {
      showStamp(stamp, "LIKE", "like", Math.min(1, dx / 100));
    } else if (dx < -20) {
      showStamp(stamp, "NOPE", "nope", Math.min(1, Math.abs(dx) / 100));
    } else {
      stamp.style.opacity = 0;
    }
  });

  function releaseCard(clientX, clientY) {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("card--dragging");
    stamp.style.opacity = 0;

    const dx = clientX - startX;
    const dy = clientY - startY;

    if (dy < -SWIPE_Y && Math.abs(dx) < 90) {
      dismissTopCard("super");
    } else if (dx > SWIPE_X) {
      dismissTopCard("like");
    } else if (dx < -SWIPE_X) {
      dismissTopCard("nope");
    } else {
      // Snap back
      card.style.transition = "transform 300ms ease, opacity 300ms ease";
      card.style.transform = "";
      setTimeout(() => { card.style.transition = ""; }, 320);
    }
  }

  card.addEventListener("pointerup",     (e) => releaseCard(e.clientX, e.clientY));
  card.addEventListener("pointercancel", (e) => releaseCard(startX, startY));

  // ── Double-tap: cycle profile photos ───────────────────────────
  card.addEventListener("click", () => {
    if (moved) { moved = false; return; } // ignore drag-release clicks
    const now = Date.now();
    if (now - lastTap < 300) {
      photoIdx = (photoIdx + 1) % profile.photos.length;
      img.src = profile.photos[photoIdx];
    }
    lastTap = now;
  });
}

// Controls
likeBtn.addEventListener("click", () => dismissTopCard("like"));
nopeBtn.addEventListener("click", () => dismissTopCard("nope"));
superLikeBtn.addEventListener("click", () => dismissTopCard("super"));
shuffleBtn.addEventListener("click", resetDeck);

// Boot
resetDeck();
