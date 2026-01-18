
/**
 * UI Interaction Logic
 * --------------------
 * This script handles global UI interactions used across the site,
 * including theme toggling (light/dark mode).
 *
 * Features:
 * - Light & Dark mode toggle with saved preference
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


// ===== Ball Picker ===== //
"use strict";

window.addEventListener("DOMContentLoaded", () => {

  const selectBtn = document.getElementById("selectBallsBtn");
  const modal = document.getElementById("ball-picker-modal");
  const img = document.getElementById("ball-image");
  const result = document.getElementById("result-text");
  const retryBtn = document.getElementById("retry");
  const doneBtn = document.getElementById("done");

  let balls = [];

  // == 1. Open Vault to pick balls == //
  selectBtn?.addEventListener("click", () => {
    localStorage.setItem("pickMode", "true");
    localStorage.removeItem("pickedBallsForMiniGame");
    localStorage.setItem("pickSource", "mini");
    window.location.href = "vault.html";
  });

  // == 2. Load balls if there are any == //
  function loadBalls() {
    const storedBallIDs = JSON.parse(localStorage.getItem("pickedBallsForMiniGame")) || [];
    if (storedBallIDs.length === 0) return [];

    const vaultBalls = JSON.parse(localStorage.getItem("bowlVaultBalls")) || [];
    return storedBallIDs.map(id => vaultBalls.find(b => b.id === id)).filter(Boolean);
  }

  balls = loadBalls();

  // Only show modal and spin if we actually have balls
  if (balls.length > 0) {
    modal.classList.remove("hidden");

    requestAnimationFrame(() => {
      spinBall();
    });
  }

  // == 3. Spinner == //
  function spinBall(ballArray = balls) {
  if (ballArray.length === 0) return;

  result.textContent = "Spinning...";

  let steps = 8;             
  let index = 0;
  let direction = 1;           
  const slideDistance = 70;    
  const intervalTime = 300;   

  // Reset ball to center and normal size
  img.style.transform = "translateX(0) scale(1)";
  img.style.width = "50px";
  img.style.height = "50px";

  const spinInterval = setInterval(() => {
    if (index >= steps) {
      clearInterval(spinInterval);

      // Final chosen ball - make it bigger
      const chosen = ballArray[Math.floor(Math.random() * ballArray.length)];
      img.src = chosen.image || "images/placeholder.jpg";
      img.style.transform = "translateX(0) scale(1.6)"; 
      img.style.width = "80px";
      img.style.height = "80px";

      result.textContent = `Your chosen ball is: ${chosen.nickname || "(No nickname)"}`;

      return;
    }

    // Pick a random ball for this slide
    const tempBall = ballArray[Math.floor(Math.random() * ballArray.length)];
    img.src = tempBall.image || "images/placeholder.jpg";

    // Apply left-right slide and scale
    const pos = direction * slideDistance;
    img.style.transform = `translateX(${pos}px) scale(1.2)`; 

    direction *= -1;
    index++;
  }, intervalTime);
}

  // == 4. Retry button == //
  retryBtn?.addEventListener("click", () => {
    balls = loadBalls();
    spinBall();
  });

  // == 5. Done button == //
  doneBtn?.addEventListener("click", () => {
    modal?.classList.add("hidden");
    localStorage.removeItem("pickedBallsForMiniGame");
  });

});

