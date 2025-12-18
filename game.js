
/** 
 * Bowling Scoring Logic (Everyday Mode)
 * --------------------------------------
 * This script manages the bowling game flow:
 * theme toggling, frame scoring, league & practice modes,
 * ball selection, modals, notes, and saving/restoring games.
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
 * 1. Theme Toggle (Light / Dark)
 * 2. Game State & Variables
 * 3. DOM Elements
 * 4. Modals (Player Type, Ball Choice, League Size, Endgame, Save-First)
 * 5. Utility Functions (rollValue, remainingPins, etc.)
 * 6. Setup & Start New Game
 * 7. Add Roll Logic
 * 8. Scoring Functions (League / Practice)
 * 9. Render Function
 * 10. Button Event Listeners (pins, strike, miss, foul)
 * 11. Endgame & Save Modals
 * 12. Main Button Logic (Start, End, Save)
 * 13. Save Game & Reset Logic
 * 14. Reset Game Function
 * 15. Modal Logic (Player Type, League Size, Ball Choice)
 * 16. Undo Last Roll
 * 17. Practice Notes System
 * 18. Initialization on Page Load
 * 19. Helper Functions (escapeHtml)
 * ===================================
 */


// ===== Light & Dark Mode ===== //
const toggleBtn = document.getElementById("theme-toggle");
const emojiSpan = toggleBtn.querySelector(".emoji");

// Load saved theme
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

// Toggle theme and save preference
toggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  emojiSpan.textContent = isDark ? "🌞" : "🌙";
  toggleBtn.classList.toggle("toggled");

  localStorage.setItem("theme", isDark ? "dark" : "light");
});


"use strict";

// ===== Game State ===== //
// == Game state variables == //
let gameStarted = false;
let currentFrame = 0;
let rollInFrame = 0;
let frames = Array.from({ length: 10 }, () => ({ rolls: [] }));
let gameMode = ""; 
let leagueSize = ""; 
let returningFromBallVault = false;

// == DOM Elements == //
let frameEls = Array.from(document.querySelectorAll(".frame"));
const pinBtns = Array.from(document.querySelectorAll(".pin"));
const foulBtn = document.querySelector(".foul");
const missBtn = document.querySelector(".miss");
const strikeBtn = document.querySelector(".strike");
const mainBtn = document.getElementById("main-btn");
const undoBtn = document.getElementById("undo-btn");
const totalElNormal = document.getElementById("total-score-normal");
const totalElLeague = document.getElementById("total-score-league");
const selectedBallDisplay = document.getElementById("selected-ball-display");

// == Inputs (place & lane) == //
const placeInput = document.getElementById("placeInput");
const laneInput = document.getElementById("laneInput");

// == Modals (player type selection modal) == //
const playerTypeModal = document.getElementById("playerTypeModal");
const practiceBtn = document.getElementById("practice-btn");
const leagueBtn = document.getElementById("league-btn");
const closeModalBtn = document.getElementById("close-modal");

// == Ball selection modal == //
const ballChoiceModal = document.getElementById("ballChoiceModal");
const ballVaultBtn = document.getElementById("ball-vault-btn");
const houseBallsBtn = document.getElementById("house-balls-btn");
const closeBallModal = document.getElementById("close-ball-modal");

// == League size modal == //
const leagueSizeModal = document.getElementById("leagueSizeModal");
const size2v2Btn = document.getElementById("size-2v2");
const size3v3Btn = document.getElementById("size-3v3");
const size4v4Btn = document.getElementById("size-4v4");
const closeSizeModal = document.getElementById("close-size-modal");

// == Modal for confirmation (end & save) == //
const endgameModal = document.getElementById("endgameModal");
const endgameMessageEl = document.getElementById("endgameMessage");
const endgamePrimaryBtn = document.getElementById("endgamePrimaryBtn");
const endgameCancelBtn = document.getElementById("endgameCancelBtn");

const saveFirstModal = document.getElementById("saveFirstModal");
const saveFirstMessageEl = document.getElementById("saveFirstMessage");
const saveFirstPrimaryBtn = document.getElementById("saveFirstPrimaryBtn");
const saveFirstCancelBtn = document.getElementById("saveFirstCancelBtn");


// == Place & Lane == //
// Check if the confirmation message was already shown this session
let confirmShown = sessionStorage.getItem("confirmShown") === "true";
let savedPlace = localStorage.getItem("savedPlace") || "";
let savedLane = localStorage.getItem("savedLane") || "";

// Fill input boxes with saved place/lane if available
if (placeInput) placeInput.value = savedPlace;
if (laneInput) laneInput.value = savedLane;

// == Roll value helper == //
// Converts a roll symbol (X, /, F, -, or number) into a numeric pin value
function rollValue(r, previous = 0) {
    if (r === "X") return 10;
    if (r === "/") return 10 - previous;
    if (r === "F" || r === "-") return 0;
    return typeof r === "number" ? r : Number(r) || 0;
}

// == Main button updater == //
// Updates the button label and style
function updateMainBtn(text) {
    if (!mainBtn) return;
    mainBtn.textContent = text;
    mainBtn.classList.remove("start-game", "end-game", "save-game");
    if (text === "Start Game") mainBtn.classList.add("start-game");
    else if (text === "End Game") mainBtn.classList.add("end-game");
    else if (text === "Save Game") mainBtn.classList.add("save-game");
}

// == Load selected balls into display == //
// Shows small images of the balls chosen for the game
function loadSelectedBallDisplay() {

    // No display found just return
    if (!selectedBallDisplay) return;

    // Clear old images
    selectedBallDisplay.innerHTML = "";

    const pickedJson = localStorage.getItem("pickedBallsForGame");
    if (pickedJson) {
        try {
            const pickedArr = JSON.parse(pickedJson);
            const vault = JSON.parse(localStorage.getItem("bowlVaultBalls") || "[]");

            pickedArr.forEach(id => {
                const found = vault.find(b => b.id === id);
                if (!found || !found.image) return;
                const img = document.createElement("img");
                img.src = found.image;
                img.alt = found.nickname || found.realname || "Ball";
                img.style.width = "40px";
                img.style.height = "40px";
                img.style.margin = "0 4px";
                selectedBallDisplay.appendChild(img);
            });

        } catch (e) { 
        console.error("Error loading ball images", e); 
        }
    }
}

// == Return from Ball Vault handler == //
// Restores game mode, league size, and selected balls when coming back from the Vault
function checkReturnFromBallVault() {
    const fromGames = localStorage.getItem("fromGames");
    const pickMode = localStorage.getItem("pickMode");
    const pickedJson = localStorage.getItem("pickedBallsForGame");

    // Only continue if we actually returned from the game and picked balls
    if (fromGames === "true" && (pickMode === "true" || pickedJson)) {
        returningFromBallVault = true;
        localStorage.removeItem("fromGames");
        localStorage.removeItem("pickMode");
        loadSelectedBallDisplay();

        // Restore mode and league size saved before entering the Vault
        const tempMode = localStorage.getItem("tempGameMode");
        const tempSize = localStorage.getItem("tempLeagueSize");
        if (tempMode) { 
            gameMode = tempMode;
            localStorage.removeItem("tempGameMode"); 
        }   
        if (tempSize) { 
            leagueSize = tempSize;
            localStorage.removeItem("tempLeagueSize"); 
        }

        // Resume the game without reloading the page
        setupNewGame(gameMode || "league");
    }
}

// == Setup for starting a game == //
// Resets all game state, clears frames, prepares scoreboard UI, and starts a new match
function setupNewGame(mode) {
    gameMode = mode; 
    gameStarted = true;
    currentFrame = 0;
    rollInFrame = 0;

    // Create 10 empty frames
    frames = Array.from({ length: 10 }, () => ({ rolls: [] }));
    frameEls = Array.from(document.querySelectorAll(".frame"));

    // Reset each scoreboard frame and adds the extra roll in 10th frame
    frameEls.forEach((el, idx) => {
        el.innerHTML = `
        <div class="marks"><span class="r1"></span><span class="r2"></span>
        ${idx === 9 ? '<span class="r3"></span>' : ''}
        </div><div class="cum"></div> 
        `; 
    });

    updateMainBtn("End Game");
    loadSelectedBallDisplay();
    render();
}

// == Remaining pins == //
// Determines how many pins are still standing for the current roll, including all 10th-frame rules
function remainingPins() {
    const f = frames[currentFrame];
    if (!f) return 0;

    const isTenth = currentFrame === 9;

    // Frames 1-9 use simple logic
    if (!isTenth) return rollInFrame === 0 
    ? 10 
    : Math.max(0, 10 - rollValue(f.rolls[0])
    );

    // 10th frame rules (different reset logic)
    if (rollInFrame === 0) return 10;

    if (rollInFrame === 1) return f.rolls[0] === "X" 
    ? 10 
    : Math.max(0, 10 - rollValue(f.rolls[0])
    );

    if (rollInFrame === 2) {
        const first = rollValue(f.rolls[0]);
        const second = rollValue(f.rolls[1], first);

        if (f.rolls[0] === "X" && f.rolls[1] === "X") return 10;
        if (f.rolls[0] === "X" && second < 10) return 10 - second;
        if (first + second === 10) return 10;
        return 0;
    }
    return 0;
}

// == Add roll == //
// Handles adding a new roll, applying marks, and advancing frame/roll logic
function addRoll(pins, mark = "") {
    if (!gameStarted || currentFrame > 9) return;

    const f = frames[currentFrame];
    const max = remainingPins();
    if (pins > max) pins = max;

    const isFoul = mark === "F";
    const isMiss = mark === "-";

    // Frame 1-9 (simple rules)
    if (currentFrame < 9) {

        // First roll
        if (rollInFrame === 0) {
            f.rolls[0] = isFoul ? "F" 
            : (pins === 10 ? "X" 
            : (isMiss ? "-" : pins)
        );

        if (f.rolls[0] === "X") {
            currentFrame++;
            rollInFrame = 0;

        } else rollInFrame = 1;

        // Second roll (check for spare)
        } else {
            const firstVal = rollValue(f.rolls[0]);
            f.rolls[1] = isFoul ? "F" 
            : (isMiss ? "-" 
            : (firstVal + pins === 10 ? "/" : pins)
        );
        currentFrame++; 
        rollInFrame = 0;
    }

    // 10th frame (complex rules)
    } else {
        const first = f.rolls[0] ? rollValue(f.rolls[0]) : 0;
        const second = f.rolls[1] ? rollValue(f.rolls[1], first) : 0;

        // First roll
        if (rollInFrame === 0) {
            f.rolls[0] = isFoul ? "F" : (pins === 10 ? "X" : (isMiss ? "-" : pins)
        );
        rollInFrame = 1;

        // Second roll
        } else if (rollInFrame === 1) {
            if (f.rolls[0] !== "X") 
                f.rolls[1] = isFoul ? "F" 
                : (isMiss ? "-" 
                : (first + pins === 10 ? "/" : pins)
            );

            else f.rolls[1] = isFoul ? "F" 
                : (isMiss ? "-" 
                : (pins === 10 ? "X" : pins)
            );

            // If strike/spare allow 3rd roll
            if (f.rolls[0] === "X" || f.rolls[1] === "/" || f.rolls[1] === "X")
                rollInFrame = 2;
            else { 
                currentFrame++;
                updateMainBtn("Save Game"); 
            }

        // Third roll
        } else if (rollInFrame === 2) {
            const firstMark = f.rolls[0], secondMark = f.rolls[1];

            if (isFoul) f.rolls[2] = "F";
            else if (isMiss) f.rolls[2] = "-";

            else {
                const firstV = rollValue(firstMark);
                const secondV = rollValue(secondMark, firstV);

                if (firstMark === "X" && secondMark === "X")
                    f.rolls[2] = (pins === 10 ? "X" : pins);

                else if (firstMark === "X" && secondV < 10)
                    f.rolls[2] = (secondV + pins === 10 ? "/" : pins);

                else if (firstV + secondV === 10)
                    f.rolls[2] = (pins === 10 ? "X" : pins);

                else f.rolls[2] = pins;
            }

        currentFrame++;
        updateMainBtn("Save Game");
        }
    }
    render();
}

// == League score == //
// Collects numeric roll values from all frames        
function scoreLeagueGame() {
    let total = 0, cumul = Array(10).fill(""), rolls = [];

    frames.forEach((f) => {
        if(!f || !f.rolls) return;
        for (let idx = 0; 
            idx < f.rolls.length;
            idx++) {
            const r = f.rolls[idx];
            const prevRaw = idx === 0 ? null : f.rolls[idx - 1];
            const prevVal = prevRaw ? rollValue(prevRaw) : 0;
            rolls.push(rollValue(r, prevVal));
        }
    });

    let rollIndex = 0;

    // Calculate scores for the 10 frame
    for (let i = 0; i < 10; i++) {
        if (rollIndex >= rolls.length) break;

        const first = rolls[rollIndex] ?? 0;
        const second = rolls[rollIndex + 1] ?? 0;
        const third = rolls[rollIndex + 2] ?? 0;
        let frameScore = 0;

        if (first === 10) { 
            frameScore = first + (rolls[rollIndex + 1] ?? 0) + (rolls[rollIndex + 2] ?? 0);
            rollIndex += 1;

        } else if (first + second === 10) { 
            frameScore = 10 + (rolls[rollIndex + 2] ?? 0);
            rollIndex += 2;
            
        } else { 
            frameScore = first + second;
            rollIndex += 2;
        }

        total += frameScore;
        cumul[i] = frames[i] ? total : "";
    }

    return { total, cumul };
}

// == Render scored frames to the UI == //
// Get game scores and updates frame rolls + totals
function scoreGame() { 
    return scoreLeagueGame();
}

// Scored data (rolls + cumul + total)
function render() {
    const active = scoreGame();

    frames.forEach((f, i) => {
        const el = frameEls[i]; 
        if (!el) return;
        
        const r1 = el.querySelector(".r1"),
         r2 = el.querySelector(".r2"),
         r3 = el.querySelector(".r3"),
         cum = el.querySelector(".cum");

        if (r1) r1.textContent = f.rolls[0] ?? "";
        if (r2) r2.textContent = f.rolls[1] ?? "";
        if (i === 9 && r3) r3.textContent = f.rolls[2] ?? "";
        if (cum) cum.textContent = active.cumul[i] ?? "";
    });

    if (totalElNormal) totalElNormal.textContent = "";
    if (totalElLeague) totalElLeague.textContent = active.total ?? "";

    if (typeof updateDashboardGames === "function") updateDashboardGames();
}

// == Add rolls from buttons == //
// For every pin button, when clicked, take the number on the button and add it as a roll
pinBtns.forEach(btn => btn.addEventListener("click", () => addRoll(Number(btn.textContent))));

if (strikeBtn) 
    strikeBtn.addEventListener("click", () => addRoll(remainingPins()));

if (missBtn) 
    missBtn.addEventListener("click", () => addRoll(0, "-"));  

if (foulBtn) 
    foulBtn.addEventListener("click", () => addRoll(0, "F"));

// == Endgame pop-up modal == //
// Show the confirm modal and return true/false based on user choice
function showEndgameConfirm(message = "Are you sure you want to end the game?") {
    return new Promise((resolve) => {

        // Use browser confirm if modal elements are missing
        if (!endgameModal || !endgamePrimaryBtn || !endgameCancelBtn || !endgameMessageEl) {
            const yes = window.confirm(message);
            resolve(yes);
            return;
        }

        endgameMessageEl.innerHTML = `
          <div class="endgame-heading">End Game</div>
          <div class="endgame-message">${escapeHtml(message)}</div>
        `;
        endgamePrimaryBtn.textContent = "Yes";
        endgameCancelBtn.textContent = "Cancel";

        endgameModal.style.display = "flex";
        endgameModal.setAttribute("aria-hidden", "false");

        // Hide modal + remove listeners
        function cleanup() {
            endgamePrimaryBtn.removeEventListener("click", onPrimary);
            endgameCancelBtn.removeEventListener("click", onCancel);
            endgameModal.style.display = "none";
            endgameModal.setAttribute("aria-hidden", "true");
        }

        // User clicked Yes
        function onPrimary(e) { 
            e && e.preventDefault();
            cleanup(); 
            resolve(true); 
        }

        // User clicked Cancel
        function onCancel(e)  { 
            e && e.preventDefault();
            cleanup(); 
            resolve(false); 
        }

        endgamePrimaryBtn.addEventListener("click", onPrimary);
        endgameCancelBtn.addEventListener("click", onCancel);
    });
}

// == Save-first custom modal == //
// Show the save-first modal and return true/false based on user choice
function showSaveFirstConfirm(laneVal="?", placeVal="?", note="Press Continue to proceed or Go Back to cancel.") {
    return new Promise((resolve) => {

        // Use browser confirm if modal elements are missing
        if (!saveFirstModal || !saveFirstPrimaryBtn || !saveFirstCancelBtn || !saveFirstMessageEl) {
            const ok = window.confirm(`Double-check:\nLane: ${laneVal}\nPlace: ${placeVal}\n\nPress OK to Continue or Cancel to Go Back.`);
            resolve(ok);
            return;
        }

        saveFirstMessageEl.innerHTML = `
          <div class="save-first-heading">Double-check</div>
          <div class="save-first-details">
            <div class="lane"><strong>Lane:</strong> ${escapeHtml(laneVal)}</div>
            <div class="place"><strong>Place:</strong> ${escapeHtml(placeVal)}</div>
          </div>
          <div class="save-first-message">${escapeHtml(note)}</div>
        `;

        saveFirstPrimaryBtn.textContent = "Continue";
        saveFirstCancelBtn.textContent = "Go Back";

        saveFirstModal.style.display = "flex";
        saveFirstModal.setAttribute("aria-hidden", "false");

        // Hide modal + remove listeners
        function cleanup() {
            saveFirstPrimaryBtn.removeEventListener("click", onPrimary);
            saveFirstCancelBtn.removeEventListener("click", onCancel);
            saveFirstModal.style.display = "none";
            saveFirstModal.setAttribute("aria-hidden", "true");
        }

        // User clicked Continue
        function onPrimary(e) {
            e && e.preventDefault();
            cleanup();
            resolve(true); 
        }

        // User clicked Go Back
        function onCancel(e)  {
            e && e.preventDefault(); 
            cleanup();
            resolve(false); 
        }

        saveFirstPrimaryBtn.addEventListener("click", onPrimary);
        saveFirstCancelBtn.addEventListener("click", onCancel);
    });
}

// == Main button logic == //
// Handle main button clicks depending on game state and button text
if (mainBtn) {mainBtn.addEventListener("click", () => {

    // Show player type modal if game has not started
    if (!gameStarted) {
        if (playerTypeModal) playerTypeModal.style.display = "block";
        return;
    } 

    // End game confirmation
    if (mainBtn.textContent === "End Game") {
        showEndgameConfirm("Are you sure you want to end the game?").then(proceed => {
            if (proceed) resetGame();
        });
        return;
    } 

    // Save game and reset immediately
    if (mainBtn.textContent === "Save Game") {
        saveGameAndReset();
    } 
  });
}

// == Save game and reset == //
// Save current game to localStorage and reset game state
function saveGameAndReset() {

    // Load vault and picked balls
    const vault = JSON.parse(localStorage.getItem("bowlVaultBalls") || "[]");
    const pickedJson = localStorage.getItem("pickedBallsForGame");
    let ballNames = [];

    // Map picked balls to human-readable names
    if (pickedJson) {
        try {
            const pickedArr = JSON.parse(pickedJson);
            ballNames = pickedArr.map(id => {
                const b = vault.find(ball => ball.id === id);
                if (!b) return "(Unknown Ball)";
                return b.displayName === "real" ? (b.realname || "(No real name)") : (b.nickname || "(No nickname)");
            });
        } catch(e) { 
            ballNames = []; 
        }
    }

    // Determine ball label to save
    const ballToSave = ballNames.length > 0 ? ballNames.join(", ") : (houseBallsBtn ? "House Ball" : "(No Ball)");

    // Save lane and place values
    const laneVal = laneInput ? laneInput.value || "?" : "?";
    const placeVal = placeInput ? placeInput.value || "?" : "?";
    savedLane = laneVal;
    savedPlace = placeVal;
    localStorage.setItem("savedLane", savedLane);
    localStorage.setItem("savedPlace", savedPlace);

    // Get final score and build game
    const finalScore = scoreGame().total ?? 0;
    const dateISO = (new Date()).toISOString();
    const newGame = { 
        id: crypto.randomUUID,
        date: dateISO,
        ball: ballToSave, 
        lane: laneVal, 
        score: finalScore, 
        place: placeVal, 
        mode: gameMode, 
        leagueSize: leagueSize 
        };

    // Actaul save and reset workflow
    function performSave() {
    confirmShown = true;
    sessionStorage.setItem("confirmShown", "true");

    const gamesKey = "bowlvault_games";
    const existing = JSON.parse(localStorage.getItem(gamesKey) || "[]");
    existing.push(newGame);
    localStorage.setItem(gamesKey, JSON.stringify(existing));
    localStorage.setItem("lastGameData", JSON.stringify(newGame));
    localStorage.removeItem("pickedBallsForGame");

    // ===== RECORD FRAMES FOR CIRCLES ===== //
    frames.forEach(f => {
        const roll1 = f.rolls[0] ?? 0;
        const roll2 = f.rolls[1] ?? 0;
        const roll3 = f.rolls[2] ?? null;
        recordFrame(roll1, roll2, roll3);
    });

    resetGame();

    if (typeof updateDashboardGames === "function") 
        updateDashboardGames();
}

    // Show save-first confirmation modal if not shown yet
    if (!confirmShown){
        showSaveFirstConfirm(laneVal, placeVal, "Press Continue to proceed or Go Back to cancel.").then(proceed => {
            if (!proceed) return;
            performSave();
        });
        return; 
    }

    // Save immediately if already confirmed
    performSave();
}

// == Reset Game == //
// Fully reset game state, UI and inputs
function resetGame() {

    updateMainBtn("Start Game");
    gameStarted = false;

    // Create fresh empty frames
    frames = Array.from({ length: 10 }, () => ({ rolls: [] }));

    // Reset all scoreboard cells
    frameEls.forEach((el, i) => {
        if (!el) return;
        el.innerHTML = `
            <div class="marks">
                <span class="r1"></span>
                <span class="r2"></span>
                ${i === 9 ? '<span class="r3"></span>' : ''}
            </div>
            <div class="cum"></div>
        `;
    });

    render();
    loadSelectedBallDisplay();

    currentFrame = 0; 
    rollInFrame = 0;

    if (selectedBallDisplay) selectedBallDisplay.innerHTML = "";
    if (placeInput) placeInput.value = savedPlace;
    if (laneInput) laneInput.value = savedLane;
}

// == Modal logic of starting a game == //
// Handle player selection and show the correct next modal
if (practiceBtn) practiceBtn.addEventListener("click", () => {
    playerTypeModal.style.display = "none";
    ballChoiceModal.style.display = "block";
    gameMode = "practice"; 
});

if (leagueBtn) leagueBtn.addEventListener("click", () => {
    playerTypeModal.style.display = "none";
    leagueSizeModal.style.display = "block";
});

if (closeModalBtn) closeModalBtn.addEventListener("click", () => {
    playerTypeModal.style.display = "none";
    resetGame();
});

// == League size selection == //
// Handle league size choice and proceed to ball selection
[size2v2Btn, size3v3Btn, size4v4Btn].forEach(btn => {
  if (!btn) return;

  btn.addEventListener("click", () => {
    leagueSize = btn.textContent.trim(); 
    leagueSizeModal.style.display = "none";
    ballChoiceModal.style.display = "block";
    gameMode = "league";
  });
});

if (closeSizeModal) closeSizeModal.addEventListener("click", () => {
    leagueSizeModal.style.display = "none";
    resetGame();
});

// == Ball choice == //
// Handle selection between house balls or personal balls
if (ballVaultBtn) ballVaultBtn.addEventListener("click", () => {
    ballChoiceModal.style.display = "none";
    localStorage.setItem("fromGames", "true"); 
    localStorage.setItem("pickMode", "true"); 
    localStorage.setItem("tempGameMode", gameMode);
    localStorage.setItem("tempLeagueSize", leagueSize);
    window.location.href = "vault.html";
});

if (houseBallsBtn) houseBallsBtn.addEventListener("click", () => {
    ballChoiceModal.style.display = "none";
    setupNewGame(gameMode);
});

if (closeBallModal) closeBallModal.addEventListener("click", () => {
    ballChoiceModal.style.display = "none";
    resetGame();
});

// == Undo button == //
// Remove the last roll
if (undoBtn) undoBtn.addEventListener("click", () => {
    if (!gameStarted) return;
    if (currentFrame > 9) currentFrame = 9;

    let f = frames[currentFrame];

    // Move back one frame if current frame is empty
    if (f && f.rolls.length === 0 && currentFrame > 0) {
        currentFrame--;
        f = frames[currentFrame];
    }

    if (f && f.rolls.length > 0) {
        f.rolls.pop();
        rollInFrame = f.rolls.length;
        updateMainBtn("End Game");
        render();
    }
});

// == Init == //
// Set initial UI state and restore previous ball selections
updateMainBtn("Start Game");
loadSelectedBallDisplay();
checkReturnFromBallVault();
if (typeof updateDashboardGames === "function") 
    updateDashboardGames();

// == Escape HTML == //
// Prevent HTML injection when inserting values
function escapeHtml (str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ===== Notes for practice games ===== //
// Set up notes system and grab all related buttons/elements
document.addEventListener("DOMContentLoaded", () => {

  const practiceBtn = document.getElementById("practice-btn");
  const leagueBtn = document.getElementById("league-btn");
  const closeModalBtn = document.getElementById("close-modal");
  const mainBtn = document.getElementById("main-btn");

  const houseBallsBtn = document.getElementById("house-balls-btn");
  const ballVaultBtn = document.getElementById("ball-vault-btn");
  const closeBallModalBtn = document.getElementById("close-ball-modal");

  const noteToggle = document.getElementById("note-toggle");
  const notePopup = document.getElementById("note-popup");
  const closeNote = document.getElementById("close-note");
  const addNoteBtn = document.getElementById("add-note");
  const noteTextInput = document.getElementById("note-text");
  const noteList = document.getElementById("note-list");

  if (noteToggle) noteToggle.style.display = "none";
  if (notePopup) notePopup.classList.add("note-hidden");

  // Handle practice mode state and saving/loading notes
  let isPracticeMode = sessionStorage.getItem("isPracticeMode") === "true";

  function setPracticeMode(value) {
    isPracticeMode = value;
    sessionStorage.setItem("isPracticeMode", value);
  }

  function loadNotes() {
    const saved = JSON.parse(localStorage.getItem("practiceNotes") || "[]");
    noteList.innerHTML = "";
    saved.forEach((n) => createNoteItem(n.text, !!n.done));
  }

  function saveNotes() {
    const notes = [];
    noteList.querySelectorAll("li").forEach(li => {
      const span = li.querySelector("span");
      const done = li.classList.contains("done");
      notes.push({ text: span ? span.textContent : "", done });
    });

    localStorage.setItem("practiceNotes", JSON.stringify(notes));
  }

  // Create a note item with text, a delete button, and done-toggle behavior
  function createNoteItem(text, done = false) {
    const li = document.createElement("li");
    li.style.cursor = "pointer";

    const span = document.createElement("span");
    span.textContent = text;
    li.appendChild(span);

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "🗑";
    del.classList.add("note-del");
    li.appendChild(del);

    if (done) li.classList.add("done");

    span.addEventListener("click", () => {
      li.classList.toggle("done");
      saveNotes();
    });

    del.addEventListener("click", (e) => {
      e.stopPropagation();
      li.remove();
      saveNotes();
    });

    noteList.appendChild(li);
  }

  // Handle adding notes, opening/closing the notes popup and enabling/disabling practice notes
  if (addNoteBtn) {
    addNoteBtn.addEventListener("click", () => {
      const text = (noteTextInput && noteTextInput.value) ? noteTextInput.value.trim() : "";
      if (!text) return;
      createNoteItem(text, false);
      saveNotes();
      if (noteTextInput) noteTextInput.value = "";
    });
  }

  if (noteTextInput) {
    noteTextInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addNoteBtn.click();
    });
  }

  if (noteToggle) {
    noteToggle.addEventListener("click", () => {
      if (!notePopup) return;
      notePopup.classList.toggle("note-hidden");
      if (!notePopup.classList.contains("note-hidden")) loadNotes();
    });
  }

  if (closeNote) {
    closeNote.addEventListener("click", () => {
      if (notePopup) notePopup.classList.add("note-hidden");
    });
  }

  function enablePracticeNotes() {
    if (noteToggle) noteToggle.style.display = "block";
    if (notePopup) notePopup.classList.add("note-hidden");
    loadNotes();
  }

  function disablePracticeNotes() {
    if (noteToggle) noteToggle.style.display = "none";
    if (notePopup) notePopup.classList.add("note-hidden");
  }

    // Buttons of notes
    if (practiceBtn) practiceBtn.addEventListener("click", () => { 
        setPracticeMode(true); 
        disablePracticeNotes(); 
    });

    if (leagueBtn) leagueBtn.addEventListener("click", () => { 
        setPracticeMode(false); 
        disablePracticeNotes(); 
    });

    if (closeModalBtn) closeModalBtn.addEventListener("click", () => { 
        setPracticeMode(false); 
        disablePracticeNotes(); 
    });

    // Start button (mainBtn)
    if (mainBtn) mainBtn.addEventListener("click", () => { 
        setPracticeMode(false); 
        disablePracticeNotes(); 
    });

    // When you select a ball to roll with in Practice Mode
    function handlePracticeBallClick() {
    if (isPracticeMode) {
        enablePracticeNotes();
        }
    }

    [houseBallsBtn, ballVaultBtn].forEach(btn => {
        if (btn) btn.addEventListener("click", handlePracticeBallClick);
    });

    // Make sure notes are shown or hidden correctly when the page loads
    isPracticeMode ? enablePracticeNotes() : disablePracticeNotes();
});












// ====== GAME DATA TRACKER ======
let leagueFrames = [];

// Load existing league data if any
const storedFrames = localStorage.getItem('leagueFrames');
if (storedFrames) {
  leagueFrames = JSON.parse(storedFrames);
}

// Record a frame
function recordFrame(roll1, roll2, roll3 = null) {
  leagueFrames.push({ roll1, roll2, roll3 });

  // Save updated data to localStorage
  localStorage.setItem('leagueFrames', JSON.stringify(leagueFrames));
}

// Delete a single frame/game
function deleteFrame(index) {
  if (index >= 0 && index < leagueFrames.length) {
    leagueFrames.splice(index, 1);
    localStorage.setItem('leagueFrames', JSON.stringify(leagueFrames));
  }
}