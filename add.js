// ====================
// Bowling Scoring Logic (Everyday Mode)
// ====================

// --- THEME TOGGLE --- //
const toggleBtn = document.getElementById("theme-toggle");
if (toggleBtn) {
  const emojiSpan = toggleBtn.querySelector(".emoji");
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    emojiSpan.textContent = "🌞";
    toggleBtn.classList.add("toggled");
  } else {
    emojiSpan.textContent = "🌙";
  }
  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    emojiSpan.textContent = isDark ? "🌞" : "🌙";
    toggleBtn.classList.toggle("toggled");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}








"use strict";

// --- GAME STATE --- //
let gameStarted = false;
let currentFrame = 0;
let rollInFrame = 0;
let frames = Array.from({ length: 10 }, () => ({ rolls: [] }));
let gameMode = ""; // "practice" or "league" (UI may set this but scoring is league-only)
let leagueSize = ""; // "2v2" | "3v3" | "4v4"
let returningFromBallVault = false;

// --- ELEMENTS --- //
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

// inputs
const placeInput = document.getElementById("placeInput");
const laneInput = document.getElementById("laneInput");

// --- MODALS (custom IDs from your HTML) --- //
const playerTypeModal = document.getElementById("playerTypeModal");
const practiceBtn = document.getElementById("practice-btn");
const leagueBtn = document.getElementById("league-btn");
const closeModalBtn = document.getElementById("close-modal");

const ballChoiceModal = document.getElementById("ballChoiceModal");
const ballVaultBtn = document.getElementById("ball-vault-btn");
const houseBallsBtn = document.getElementById("house-balls-btn");
const closeBallModal = document.getElementById("close-ball-modal");

const leagueSizeModal = document.getElementById("leagueSizeModal");
const size2v2Btn = document.getElementById("size-2v2");
const size3v3Btn = document.getElementById("size-3v3");
const size4v4Btn = document.getElementById("size-4v4");
const closeSizeModal = document.getElementById("close-size-modal");

// --- Your new modals --- //
const endgameModal = document.getElementById("endgameModal");
const endgameMessageEl = document.getElementById("endgameMessage");
const endgamePrimaryBtn = document.getElementById("endgamePrimaryBtn");
const endgameCancelBtn = document.getElementById("endgameCancelBtn");

const saveFirstModal = document.getElementById("saveFirstModal");
const saveFirstMessageEl = document.getElementById("saveFirstMessage");
const saveFirstPrimaryBtn = document.getElementById("saveFirstPrimaryBtn");
const saveFirstCancelBtn = document.getElementById("saveFirstCancelBtn");

// --- CONFIRMATION FLAG --- //
let confirmShown = sessionStorage.getItem("confirmShown") === "true";
let savedPlace = localStorage.getItem("savedPlace") || "";
let savedLane = localStorage.getItem("savedLane") || "";

// --- INITIALIZE INPUTS --- //
if (placeInput) placeInput.value = savedPlace;
if (laneInput) laneInput.value = savedLane;

// --- UTIL FUNCTIONS --- //
function rollValue(r, previous = 0) {
    if (r === "X") return 10;
    if (r === "/") return 10 - previous;
    if (r === "F" || r === "-") return 0;
    return typeof r === "number" ? r : Number(r) || 0;
}

function updateMainBtn(text) {
    if (!mainBtn) return;
    mainBtn.textContent = text;
    mainBtn.classList.remove("start-game", "end-game", "save-game");
    if (text === "Start Game") mainBtn.classList.add("start-game");
    else if (text === "End Game") mainBtn.classList.add("end-game");
    else if (text === "Save Game") mainBtn.classList.add("save-game");
}

// --- LOAD SELECTED BALLS --- //
function loadSelectedBallDisplay() {
    if (!selectedBallDisplay) return;
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
        } catch (e) { console.error("Error loading ball images", e); }
    }
}

// --- RETURN FROM BALL VAULT --- //
function checkReturnFromBallVault() {
    const fromGames = localStorage.getItem("fromGames");
    const pickMode = localStorage.getItem("pickMode");
    const pickedJson = localStorage.getItem("pickedBallsForGame");
    if (fromGames === "true" && (pickMode === "true" || pickedJson)) {
        returningFromBallVault = true;
        localStorage.removeItem("fromGames");
        localStorage.removeItem("pickMode");
        loadSelectedBallDisplay();
        // Restore temp mode & size saved before leaving
        const tempMode = localStorage.getItem("tempGameMode");
        const tempSize = localStorage.getItem("tempLeagueSize");
        if(tempMode) { gameMode = tempMode; localStorage.removeItem("tempGameMode"); }
        if(tempSize) { leagueSize = tempSize; localStorage.removeItem("tempLeagueSize"); }
        // Continue game without page reload
        setupNewGame(gameMode || "league");
    }
}

// --- SETUP NEW GAME --- //
function setupNewGame(mode) {
    gameMode = mode; 
    gameStarted = true;
    currentFrame = 0;
    rollInFrame = 0;
    frames = Array.from({ length: 10 }, () => ({ rolls: [] }));
    frameEls = Array.from(document.querySelectorAll(".frame"));
    frameEls.forEach((el, idx) => {
        el.innerHTML = `<div class="marks"><span class="r1"></span><span class="r2"></span>${idx===9?'<span class="r3"></span>':''}</div><div class="cum"></div>`;
    });
    updateMainBtn("End Game");
    loadSelectedBallDisplay();
    render();
}

// --- REMAINING PINS --- //
function remainingPins() {
    const f = frames[currentFrame];
    if (!f) return 0;
    const isTenth = currentFrame === 9;
    if (!isTenth) return rollInFrame === 0 ? 10 : Math.max(0, 10 - rollValue(f.rolls[0]));
    if (rollInFrame === 0) return 10;
    if (rollInFrame === 1) return f.rolls[0] === "X" ? 10 : Math.max(0, 10 - rollValue(f.rolls[0]));
    if (rollInFrame === 2) {
        const first = rollValue(f.rolls[0]);
        const second = rollValue(f.rolls[1], first);
        if(f.rolls[0]==="X" && f.rolls[1]==="X") return 10;
        if(f.rolls[0]==="X" && second < 10) return 10 - second;
        if(first + second === 10) return 10;
        return 0;
    }
    return 0;
}

// --- ADD ROLL --- //
function addRoll(pins, mark = "") {
    if (!gameStarted || currentFrame > 9) return;
    const f = frames[currentFrame];
    const max = remainingPins();
    if (pins > max) pins = max;
    const isFoul = mark === "F";
    const isMiss = mark === "-";

    if (currentFrame < 9) {
        if (rollInFrame === 0) {
            f.rolls[0] = isFoul ? "F" : (pins === 10 ? "X" : (isMiss ? "-" : pins));
            if(f.rolls[0]==="X"){currentFrame++; rollInFrame=0;} else rollInFrame=1;
        } else {
            const firstVal = rollValue(f.rolls[0]);
            f.rolls[1] = isFoul ? "F" : (isMiss ? "-" : (firstVal + pins === 10 ? "/" : pins));
            currentFrame++; rollInFrame=0;
        }
    } else {
        const first = f.rolls[0]?rollValue(f.rolls[0]):0;
        const second = f.rolls[1]?rollValue(f.rolls[1], first):0;
        if (rollInFrame === 0) {
            f.rolls[0] = isFoul ? "F" : (pins === 10 ? "X" : (isMiss ? "-" : pins));
            rollInFrame = 1;
        } else if (rollInFrame === 1) {
            if(f.rolls[0] !== "X") f.rolls[1] = isFoul ? "F" : (isMiss ? "-" : (first + pins === 10 ? "/" : pins));
            else f.rolls[1] = isFoul ? "F" : (isMiss ? "-" : (pins === 10 ? "X" : pins));
            if(f.rolls[0]==="X" || f.rolls[1]==="/" || f.rolls[1]==="X") rollInFrame=2;
            else { currentFrame++; updateMainBtn("Save Game"); }
        } else if (rollInFrame === 2) {
            const firstMark = f.rolls[0], secondMark = f.rolls[1];
            if(isFoul) f.rolls[2] = "F";
            else if(isMiss) f.rolls[2] = "-";
            else {
                const firstV = rollValue(firstMark);
                const secondV = rollValue(secondMark, firstV);
                if(firstMark === "X" && secondMark === "X") f.rolls[2] = (pins === 10 ? "X" : pins);
                else if(firstMark === "X" && secondV < 10) f.rolls[2] = (secondV + pins === 10 ? "/" : pins);
                else if(firstV + secondV === 10) f.rolls[2] = (pins === 10 ? "X" : pins);
                else f.rolls[2] = pins;
            }
            currentFrame++;
            updateMainBtn("Save Game");
        }
    }
    render();
}

// --- LEAGUE SCORE CALCULATION --- //
function scoreLeagueGame() {
    let total = 0, cumul = Array(10).fill(""), rolls = [];
    frames.forEach((f) => {
        if(!f || !f.rolls) return;
        for (let idx = 0; idx < f.rolls.length; idx++) {
            const r = f.rolls[idx];
            const prevRaw = idx === 0 ? null : f.rolls[idx - 1];
            const prevVal = prevRaw ? rollValue(prevRaw) : 0;
            rolls.push(rollValue(r, prevVal));
        }
    });

    let rollIndex = 0;
    for (let i = 0; i < 10; i++) {
        if (rollIndex >= rolls.length) break;
        const first = rolls[rollIndex] ?? 0;
        const second = rolls[rollIndex + 1] ?? 0;
        const third = rolls[rollIndex + 2] ?? 0;
        let frameScore = 0;

        if (first === 10) { // strike
            frameScore = first + (rolls[rollIndex + 1] ?? 0) + (rolls[rollIndex + 2] ?? 0);
            rollIndex += 1;
        } else if (first + second === 10) { // spare
            frameScore = 10 + (rolls[rollIndex + 2] ?? 0);
            rollIndex += 2;
        } else { // open
            frameScore = first + second;
            rollIndex += 2;
        }

        total += frameScore;
        cumul[i] = frames[i] ? total : "";
    }

    return { total, cumul };
}

function scoreGame() { return scoreLeagueGame(); }

// --- RENDER --- //
function render(){
    const active = scoreGame();
    frames.forEach((f, i) => {
        const el = frameEls[i]; if(!el) return;
        const r1 = el.querySelector(".r1"), r2 = el.querySelector(".r2"), r3 = el.querySelector(".r3"), cum = el.querySelector(".cum");
        if(r1) r1.textContent = f.rolls[0] ?? "";
        if(r2) r2.textContent = f.rolls[1] ?? "";
        if(i === 9 && r3) r3.textContent = f.rolls[2] ?? "";
        if(cum) cum.textContent = active.cumul[i] ?? "";
    });

    if(totalElNormal) totalElNormal.textContent = "";
    if(totalElLeague) totalElLeague.textContent = active.total ?? "";

    if (typeof updateDashboardGames === "function") updateDashboardGames();
}

// --- BUTTONS --- //
pinBtns.forEach(btn => btn.addEventListener("click", () => addRoll(Number(btn.textContent))));
if(strikeBtn) strikeBtn.addEventListener("click", () => addRoll(remainingPins()));
if(missBtn) missBtn.addEventListener("click", () => addRoll(0, "-"));
if(foulBtn) foulBtn.addEventListener("click", () => addRoll(0, "F"));

// --- Endgame Pop-up modal --- //
function showEndgameConfirm(message = "Are you sure you want to end the game?") {
    return new Promise((resolve) => {
        // fallback to native confirm if modal not present
        if (!endgameModal || !endgamePrimaryBtn || !endgameCancelBtn || !endgameMessageEl) {
            const ok = window.confirm(message);
            resolve(ok);
            return;
        }

        // build heading + message so it matches the new style
        endgameMessageEl.innerHTML = `
          <div class="endgame-heading">End Game</div>
          <div class="endgame-message">${escapeHtml(message)}</div>
        `;
        endgamePrimaryBtn.textContent = "OK";
        endgameCancelBtn.textContent = "Cancel";

        endgameModal.style.display = "flex";
        endgameModal.setAttribute("aria-hidden", "false");

        function cleanup() {
            endgamePrimaryBtn.removeEventListener("click", onPrimary);
            endgameCancelBtn.removeEventListener("click", onCancel);
            endgameModal.style.display = "none";
            endgameModal.setAttribute("aria-hidden", "true");
        }

        function onPrimary(e) { e && e.preventDefault(); cleanup(); resolve(true); }
        function onCancel(e)  { e && e.preventDefault(); cleanup(); resolve(false); }

        endgamePrimaryBtn.addEventListener("click", onPrimary);
        endgameCancelBtn.addEventListener("click", onCancel);
    });
}

// --- Helper: show save-first custom modal --- //
// now accepts the lane/place values and a short message; it builds heading, details and message
function showSaveFirstConfirm(laneVal = "?", placeVal = "?", note = "Press Continue to proceed or Go Back to cancel.") {
    return new Promise((resolve) => {
        if (!saveFirstModal || !saveFirstPrimaryBtn || !saveFirstCancelBtn || !saveFirstMessageEl) {
            // fallback to native confirm with a simple string
            const ok = window.confirm(`Double-check:\nLane: ${laneVal}\nPlace: ${placeVal}\n\nPress OK to Continue or Cancel to Go Back.`);
            resolve(ok);
            return;
        }

        // Build the structured HTML inside the modal message container
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

        function cleanup() {
            saveFirstPrimaryBtn.removeEventListener("click", onPrimary);
            saveFirstCancelBtn.removeEventListener("click", onCancel);
            saveFirstModal.style.display = "none";
            saveFirstModal.setAttribute("aria-hidden", "true");
        }

        function onPrimary(e) { e && e.preventDefault(); cleanup(); resolve(true); }
        function onCancel(e)  { e && e.preventDefault(); cleanup(); resolve(false); }

        saveFirstPrimaryBtn.addEventListener("click", onPrimary);
        saveFirstCancelBtn.addEventListener("click", onCancel);
    });
}

// --- MAIN BUTTON LOGIC --- //
if(mainBtn){mainBtn.addEventListener("click", () => {
    if(!gameStarted){
        if(playerTypeModal) playerTypeModal.style.display = "block";
        return;
    }
    if(mainBtn.textContent === "End Game"){
        showEndgameConfirm("Are you sure you want to end the game?").then(proceed => {
            if (proceed) resetGame();
        });
        return;
    }
    if(mainBtn.textContent === "Save Game"){
        saveGameAndReset();
    }
});}

// --- SAVE GAME --- //
function saveGameAndReset(){
    const vault = JSON.parse(localStorage.getItem("bowlVaultBalls") || "[]");
    const pickedJson = localStorage.getItem("pickedBallsForGame");
    let ballNames = [];
    if(pickedJson){
        try {
            const pickedArr = JSON.parse(pickedJson);
            ballNames = pickedArr.map(id => {
                const b = vault.find(x => x.id === id);
                if(!b) return "(Unknown Ball)";
                return b.displayName === "real" ? (b.realname || "(No real name)") : (b.nickname || "(No nickname)");
            });
        } catch(e) { ballNames = []; }
    }
    const ballToSave = ballNames.length > 0 ? ballNames.join(", ") : (houseBallsBtn ? "House Ball" : "(No Ball)");
    const laneVal = laneInput ? laneInput.value || "?" : "?";
    const placeVal = placeInput ? placeInput.value || "?" : "?";
    savedLane = laneVal;
    savedPlace = placeVal;
    localStorage.setItem("savedLane", savedLane);
    localStorage.setItem("savedPlace", savedPlace);
    const finalScore = scoreGame().total ?? 0;
    const dateISO = (new Date()).toISOString();
    const newGame = { date: dateISO, ball: ballToSave, lane: laneVal, score: finalScore, place: placeVal, mode: gameMode, leagueSize: leagueSize };

    // performSave encapsulates the actual saving & reset flow
    function performSave() {
        confirmShown = true;
        sessionStorage.setItem("confirmShown", "true");

        const gamesKey = "bowlvault_games";
        const existing = JSON.parse(localStorage.getItem(gamesKey) || "[]");
        existing.push(newGame);
        localStorage.setItem(gamesKey, JSON.stringify(existing));
        localStorage.setItem("lastGameData", JSON.stringify(newGame));
        localStorage.removeItem("pickedBallsForGame");

        resetGame();
        if (typeof updateDashboardGames === "function") updateDashboardGames();
    }

    // if not shown before, use the save-first custom modal (with structured content)
    if(!confirmShown){
        showSaveFirstConfirm(laneVal, placeVal, "Press Continue to proceed or Go Back to cancel.").then(proceed => {
            if(!proceed) return;
            performSave();
        });
        return; // wait for modal result
    }

    // else save immediately
    performSave();
}

// --- RESET GAME --- //
function resetGame(){
    updateMainBtn("Start Game");
    gameStarted = false;
    frames = Array.from({length:10},()=>({rolls:[]}));
    frameEls.forEach((el,i)=>{
        if(!el) return;
        el.innerHTML = `<div class="marks"><span class="r1"></span><span class="r2"></span>${i===9?'<span class="r3"></span>':''}</div><div class="cum"></div>`;
    });
    render();
    loadSelectedBallDisplay();
    currentFrame = 0; 
    rollInFrame = 0;
    if(selectedBallDisplay) selectedBallDisplay.innerHTML = "";
    if(placeInput) placeInput.value = savedPlace;
    if(laneInput) laneInput.value = savedLane;
}

// --- MODAL LOGIC --- //
// Player Type
if(practiceBtn) practiceBtn.addEventListener("click", ()=>{
    playerTypeModal.style.display = "none";
    ballChoiceModal.style.display = "block";
    gameMode = "practice"; // UI only — scoring remains league-only
});
if(leagueBtn) leagueBtn.addEventListener("click", ()=>{
    playerTypeModal.style.display = "none";
    leagueSizeModal.style.display = "block";
});
if(closeModalBtn) closeModalBtn.addEventListener("click", ()=>{
    playerTypeModal.style.display = "none";
    resetGame();
});

// League Size
[size2v2Btn, size3v3Btn, size4v4Btn].forEach(btn => {
  if (!btn) return;
  btn.addEventListener("click", () => {
    leagueSize = btn.textContent.trim(); 
    leagueSizeModal.style.display = "none";
    ballChoiceModal.style.display = "block";
    gameMode = "league";
  });
});

if(closeSizeModal) closeSizeModal.addEventListener("click", ()=>{
    leagueSizeModal.style.display = "none";
    resetGame();
});

// Ball Choice
if(ballVaultBtn) ballVaultBtn.addEventListener("click", ()=>{
    ballChoiceModal.style.display = "none";
    localStorage.setItem("fromGames","true"); 
    localStorage.setItem("pickMode","true"); 
    localStorage.setItem("tempGameMode", gameMode);
    localStorage.setItem("tempLeagueSize", leagueSize);
    window.location.href="myballs.html";
});
if(houseBallsBtn) houseBallsBtn.addEventListener("click", ()=>{
    ballChoiceModal.style.display = "none";
    setupNewGame(gameMode);
});
if(closeBallModal) closeBallModal.addEventListener("click", ()=>{
    ballChoiceModal.style.display = "none";
    resetGame();
});

// --- UNDO --- //
if(undoBtn){undoBtn.addEventListener("click", ()=>{
    if(!gameStarted) return;
    if(currentFrame > 9) currentFrame = 9;
    let f = frames[currentFrame];
    if(f && f.rolls.length === 0 && currentFrame > 0){
        currentFrame--;
        f = frames[currentFrame];
    }
    if(f && f.rolls.length > 0){
        f.rolls.pop();
        rollInFrame = f.rolls.length;
        updateMainBtn("End Game");
        render();
    }
});}

// --- INIT --- //
updateMainBtn("Start Game");
loadSelectedBallDisplay();
checkReturnFromBallVault();
if (typeof updateDashboardGames === "function") updateDashboardGames();

// --- Small helper: escape HTML to avoid injection when inserting values ---
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}