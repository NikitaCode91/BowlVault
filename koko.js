
/**
 * UI Interaction Logic
 * --------------------
 * This script handles global UI interactions used across the site,
 * including theme toggling (light/dark mode) and interactive
 * heart/like buttons with persistent state.
 *
 * Features:
 * - Light & Dark mode toggle with saved preference
 * - Animated heart/like buttons
 * - Persistent like state and count via localStorage
 *
 * Comment Structure:
 * 
 * // ===== Section ===== //      → Marks the start of a major section
 * // -- Comment -- //            → Comment about linked files or references
 * // == Comment == //            → Highlights an importent step or feature within a section
 * // Comment                     → General explanation of code
 *
 * ===================================
 *  Contents
 * ===================================
 * 1. Light & Dark Mode
 *    - Load saved theme on page load
 *    - Toggle theme on button click
 *    - Update emoji + visual state
 *
 * 2. Heart / Like System
 *    - Load saved like state per item
 *    - Load and persist like counts
 *    - Toggle liked state on click
 *    - Play heart pop animation
 * ===================================
 */

// ===== Light & Dark Mode ===== //
const toggleBtn = document.getElementById("theme-toggle");
const emojiSpan = toggleBtn.querySelector(".emoji");

// Load saved theme on page load
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  emojiSpan.textContent = "🌞";
  toggleBtn.classList.add("toggled");
} else {
  document.body.classList.remove("dark-mode");
  emojiSpan.textContent = "🌙";
  toggleBtn.classList.remove("toggled");
}

// Toggle theme on click and save preference
toggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  emojiSpan.textContent = isDark ? "🌞" : "🌙";
  toggleBtn.classList.toggle("toggled");

  localStorage.setItem("theme", isDark ? "dark" : "light");
});


// ===== Heart ===== //
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".like-btn").forEach(btn => {
    const id = btn.dataset.id;
    const countEl = btn.querySelector("span");
    let count = parseInt(countEl.textContent);

    // Load liked state
    const liked = localStorage.getItem(`like-${id}`) === "true";
    if (liked) {
      btn.classList.add("liked");
    }

    // Load saved count
    const savedCount = localStorage.getItem(`like-count-${id}`);
    if (savedCount !== null && !isNaN(savedCount)) {
      count = parseInt(savedCount);
      countEl.textContent = count;
    }

    btn.addEventListener("click", () => {
      const currentlyLiked = btn.classList.contains("liked");

      if (currentlyLiked) {
        btn.classList.remove("liked");
        localStorage.setItem(`like-${id}`, "false");
        count = Math.max(0, count - 1);
      } else {
        btn.classList.add("liked");
        localStorage.setItem(`like-${id}`, "true");
        count++;
        
        // Retrigger animation
        const icon = btn.querySelector("i");
        icon.classList.remove("pop");
        void icon.offsetWidth;  // Void (force browser refresh for animation)
        icon.classList.add("pop");
      }

      countEl.textContent = count;
      localStorage.setItem(`like-count-${id}`, count);
    });
  });
});