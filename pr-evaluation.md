# Pull Request Evaluation

Two open PRs both implement swipe gestures, multi-photo profiles, and button controls on top of the same base code. This document compares them and recommends which is more likely to be approved.

---

## PR #1 — "Implement UI features **with** prompt templates"
- Branch: `with-prompt-templates`
- Diff: +196 / −22 lines across 3 files

## PR #2 — "Implement UI features **without** prompt templates"
- Branch: `no-prompt-templates`
- Diff: +315 / −62 lines across 3 files

---

## Verdict: **PR #2 is better and more likely to be approved.**

---

## Detailed Comparison

### 1. Mobile / Touch Support
**PR #2 wins.**

PR #2 adds `touch-action: none`, `user-select: none`, and `cursor: grab` to the `.card` rule, and sets `img.draggable = false` on each card image. These are essential for touch devices: without `touch-action: none`, the browser's default scroll behavior will fight the pointer-event swipe gesture, making the feature unreliable on phones and tablets. PR #1 omits all of these, which is a significant functional gap for a mobile-first UI.

### 2. Photo Generation Quality
**PR #2 wins.**

PR #1 uses `Array.from({ length: 3 }, () => imgFor(sample(UNSPLASH_SEEDS)))` — always exactly 3 photos per profile, with independent random draws that can produce duplicates. PR #2 shuffles the entire seed list and slices a unique subset (2–4 photos) per profile, preventing repeat photos and giving each profile a variable, more realistic feel. PR #2 also stores `photoIndex` on the profile object, keeping state cleanly tied to the data model.

### 3. Photo Navigation UX
**PR #2 wins.**

PR #2 renders dot indicators (`.photo-dots`) showing the current photo position, matching real dating-app conventions. PR #1 simply swaps `img.src` on double-tap with no visual affordance that more photos exist. The dots make the feature discoverable.

### 4. Swipe Feedback Overlays
**PR #2 wins (slightly).**

Both PRs render stamped overlays during dragging. PR #1 uses a single reusable `.card__stamp` element repositioned via CSS classes, which is compact. PR #2 uses three separate sibling elements (`.swipe-overlay--like`, `--nope`, `--super`), each with a fixed layout position. The three-element approach is more explicit and avoids the layout shift of repositioning a single element mid-drag. Both approaches are reasonable; PR #2's is a bit cleaner.

### 5. Snap-Back Animation
**PR #2 wins.**

PR #2 uses `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (a springy overshoot curve) for the snap-back, which feels polished and natural. PR #1 uses a plain `ease` curve with a hard `setTimeout` to clear the transition — a fragile pattern that can leave stale inline styles if the timing ever mismatches.

### 6. Tap Detection Reliability
**PR #2 wins.**

PR #2 detects a tap by checking both `Math.hypot(dx, dy) < 8` (distance) and elapsed time since `pointerdown`. PR #1 uses a boolean `moved` flag toggled when displacement exceeds 5 px; this is simpler but slightly less precise since diagonal micro-drags can set the flag unexpectedly.

### 7. Code Organization and Readability
**PR #2 wins.**

PR #2 splits logic into clearly labeled sections (`// Card rendering`, `// Photo browsing`, `// Swipe gestures`, `// Overlay helpers`, `// Card dismissal`, `// Button controls`). It also extracts `buildCard`, `renderDots`, `snapBack`, `clearOverlays`, `setOverlay`, `updateOverlays`, `getTopCard`, and `updateEmptyState` as named functions. PR #1 keeps everything inside `addCardHandlers` with less separation of concerns. PR #2 would be significantly easier to maintain and extend.

### 8. Code Volume
**PR #1 wins (marginally).**

PR #1 is about 120 lines shorter. Some of that is legitimate concision (the single-stamp approach, inline drag logic), but much of the savings comes from missing features (no dots, no `touch-action`, simpler animations). Brevity that omits correctness isn't a virtue here.

### 9. Empty-Deck State
**Roughly tied.**

Both PRs render an in-deck "You've seen everyone!" message. PR #1 uses a `grid`/`place-items: center` approach; PR #2 uses flexbox. Both look equivalent. PR #1 adds a 🎉 emoji; PR #2 includes a hint to hit Shuffle. Minor stylistic difference.

---

## Summary Table

| Criterion                     | PR #1 (with templates) | PR #2 (without templates) |
|-------------------------------|------------------------|---------------------------|
| Mobile touch support          | ❌ Missing              | ✅ `touch-action: none`    |
| Unique, variable photo counts | ❌ Can repeat, fixed 3  | ✅ Shuffled, 2–4 unique    |
| Photo dot indicator           | ❌ None                 | ✅ Present                 |
| Snap-back animation           | ⚠️ Fragile setTimeout   | ✅ Springy cubic-bezier    |
| Tap detection                 | ⚠️ Boolean flag         | ✅ Distance + time         |
| Code organization             | ⚠️ Monolithic handler   | ✅ Well-sectioned           |
| Code brevity                  | ✅ Shorter              | ⚠️ Longer (more features)  |

**PR #2 is the stronger implementation.** The mobile `touch-action` omission in PR #1 alone is a blocking issue for a swipe-based UI — it would break the core interaction on any touch device. PR #2 also delivers a more complete feature set with better UX polish and more maintainable code.
