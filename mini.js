
/**
 * UI Interaction Logic
 * --------------------
 * This script manages global UI interactions and interactive components
 * used across the site. It controls visual state, user-triggered actions,
 * modals, animations, and persistent UI data.
 *
 * Features:
 * - Light & Dark mode toggle with saved preference
 * - Target Score Challenge (generation, animation, difficulty modes)
 * - Modal management (Target, Wall, Clear Confirmation)
 * - Persistent Brick Wall with pass / fail tracking
 * - LocalStorage state handling
 *
 * Comment Structure:
 *
 * // ===== Section ===== //      → Marks the start of a major section
 * // -- Comment -- //            → Notes linked files, dependencies, or references
 * // == Comment == //            → Highlights an important step or feature
 * // Comment                     → General explanation of logic
 *
 * ===================================
 *  Contents
 * ===================================
 * 1. Light & Dark Mode
 *    - Load saved theme on page load
 *    - Toggle theme on button click
 *    - Update icon / visual state
 *
 * 2. Target Score Challenge
 *    - Difficulty selection
 *    - Animated target generation
 *    - Retry and save handling
 *
 * 3. Target Wall
 *    - Persistent score storage
 *    - Pass / fail state updates
 *    - Animated brick insertion
 *
 * 4. Modal Management
 *    - Open / close Target modal
 *    - Open / close Wall modal
 *    - Clear-all confirmation modal
 *
 **/

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



// ===== Target Score Challenge ===== //
// = Dom elements == //
const startTargetBtn = document.getElementById("startTargetBtn");
const targetModal = document.getElementById("target-modal");
const targetResult = document.getElementById("target-result");
const targetNumberEl = document.getElementById("target-number");

const diffButtons = document.querySelectorAll(".diff-btn");

const retryTargetBtn = document.getElementById("retryTarget");
const saveTargetBtn = document.getElementById("saveTarget");
const closeTargetModal = document.getElementById("closeTargetModal");

const targetWallBtn = document.getElementById("targetWallBtn");
const brickWallContainer = document.getElementById("brick-wall");

const targetWallModal = document.getElementById("target-wall-modal");
const closeWallModal = document.getElementById("closeWallModal");

const clearAllBtn = document.getElementById("clearWallBtn");
const clearAllModal = document.getElementById("clearAllModal");
const confirmClearAll = document.getElementById("confirmClearAll");
const cancelClearAll = document.getElementById("cancelClearAll");


// == Stats == //
let currentMode = null;
let isRunning = false;


// == CONFIG == //
const ranges = {
  low: [60, 110],
  medium: [111, 180],
  high: [181, 260],
  random: [60, 300]
};


// == Target generate == //
function generateTarget(mode) {
  const [min, max] = ranges[mode];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showTarget() {
  if (!currentMode) return;

  const finalValue = generateTarget(currentMode);
  targetNumberEl.textContent = "";
  targetResult.classList.remove("hidden");

  // Disable buttons while running
  isRunning = true;
  retryTargetBtn.disabled = true;
  saveTargetBtn.disabled = true;
  retryTargetBtn.classList.add("disabled-btn");
  saveTargetBtn.classList.add("disabled-btn");

  const digits = finalValue.toString().padStart(3, "0").split("");
  let completedDigits = 0;

  digits.forEach((digit, i) => {
    const span = document.createElement("span");
    targetNumberEl.appendChild(span);

    let stepCount = 0;
    const steps = 15;

    const interval = setInterval(() => {
      span.textContent = Math.floor(Math.random() * 10);
      stepCount++;

      if (stepCount >= steps) {
        clearInterval(interval);
        span.textContent = digit;
        span.style.transform = "scale(1.2)";
        setTimeout(() => (span.style.transform = "scale(1)"), 150);

        completedDigits++;
        if (completedDigits === digits.length) {
          isRunning = false;
          retryTargetBtn.disabled = false;
          saveTargetBtn.disabled = false;
          retryTargetBtn.classList.remove("disabled-btn");
          saveTargetBtn.classList.remove("disabled-btn");
        }
      }
    }, 50 + i * 30);
  });
}


// == Target modal events == //
startTargetBtn?.addEventListener("click", () => {
  targetModal.classList.remove("hidden");
  targetResult.classList.add("hidden");
});

closeTargetModal?.addEventListener("click", () => {
  targetModal.classList.add("hidden");
});

retryTargetBtn?.addEventListener("click", showTarget);


// == Difficult btns == //
diffButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;

    diffButtons.forEach(b => {
      b.classList.remove("active");
      b.nextElementSibling?.classList.remove("active-range");
    });

    btn.classList.add("active");
    btn.nextElementSibling?.classList.add("active-range");

    showTarget();
  });
});


// == Target Wall Modal == //
targetWallBtn?.addEventListener("click", () => {
  targetModal.classList.add("hidden");
  targetWallModal.classList.remove("hidden");
});

closeWallModal?.addEventListener("click", () => {
  targetWallModal.classList.add("hidden");
});


// == Clear All Saved Targets Modal == //
clearAllBtn?.addEventListener("click", () => {
  clearAllModal.classList.remove("hidden");
});

cancelClearAll?.addEventListener("click", () => {
  clearAllModal.classList.add("hidden");
});

confirmClearAll?.addEventListener("click", () => {
  localStorage.removeItem("savedTargets");
  brickWallContainer.innerHTML = "";
  clearAllModal.classList.add("hidden");
});


// == Persistent Brick Wall == //
function addBrickToWall(brickData, save = true) {
  const { score, mode, status } = brickData;

  const brick = document.createElement("div");
  brick.classList.add("brick");
  brick.textContent = `${score} (${mode})`;

  const controls = document.createElement("div");
  controls.classList.add("brick-controls");

  if (!status) {
    const passBtn = document.createElement("button");
    passBtn.textContent = "✔";
    passBtn.classList.add("brick-pass");

    const failBtn = document.createElement("button");
    failBtn.textContent = "✖";
    failBtn.classList.add("brick-fail");

    controls.appendChild(failBtn);
    controls.appendChild(passBtn);

    passBtn.addEventListener("click", () => {
      brick.classList.add("pass");
      controls.remove();
      updateBrickStatus(score, mode, "pass");
    });

    failBtn.addEventListener("click", () => {
      brick.classList.add("fail");
      controls.remove();
      updateBrickStatus(score, mode, "fail");
    });
  } else {
    brick.classList.add(status);
  }

  brick.appendChild(controls);
  brickWallContainer.prepend(brick);

  brick.style.opacity = 0;
  brick.style.transform = "translateY(-30px)";
  setTimeout(() => {
    brick.style.transition = "all 0.4s ease";
    brick.style.opacity = 1;
    brick.style.transform = "translateY(0)";
  }, 10);

  if (save) {
    const saved = JSON.parse(localStorage.getItem("savedTargets")) || [];
    saved.push({ score, mode, status: null });
    localStorage.setItem("savedTargets", JSON.stringify(saved));
  }
}

function updateBrickStatus(score, mode, status) {
  const saved = JSON.parse(localStorage.getItem("savedTargets")) || [];
  const index = saved.findIndex(
    b => b.score === score && b.mode === mode && !b.status
  );

  if (index !== -1) {
    saved[index].status = status;
    localStorage.setItem("savedTargets", JSON.stringify(saved));
  }
}

function loadBricks() {
  const saved = JSON.parse(localStorage.getItem("savedTargets")) || [];
  saved.forEach(b => addBrickToWall(b, false));
}

loadBricks();


// == Save target == //
saveTargetBtn?.addEventListener("click", () => {
  if (!currentMode) return;

  const targetScore = targetNumberEl.textContent;
  addBrickToWall({ score: targetScore, mode: currentMode });
  targetModal.classList.add("hidden");
});
