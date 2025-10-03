// === Light & Dark Mode === //

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








"use strict";

const gamesKey = "bowlvault_games";

// Load games from localStorage
let games = JSON.parse(localStorage.getItem(gamesKey)) || [];
let currentFilter = localStorage.getItem("lastFilter") || "all"; // Remember last filter
let selectedGameIndex = null;

// --- Color map for game modes (text only CSS classes) ---
const modeClasses = {
  "2v2": "text-2v2",
  "3v3": "text-3v3",
  "4v4": "text-4v4",
  "practice": "text-practice",
  "league": "text-league"
};

// --- Update stats ---
function updateStats() {
  document.getElementById("gamesPlayed").textContent = games.length;

  const highScore = games.reduce((max, g) => Math.max(max, g.score), 0);
  document.getElementById("highScore").textContent = highScore;

  const ballCounts = games.reduce((acc, g) => {
    acc[g.ball] = (acc[g.ball] || 0) + 1;
    return acc;
  }, {});
  const favoriteBall = Object.entries(ballCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
  document.getElementById("favoriteBall").textContent = favoriteBall;
}

// --- Render games ---
function renderGames() {
  const list = document.getElementById("gameList");
  if (!list) return;
  list.innerHTML = "";

  const filteredGames = currentFilter === "all"
    ? games
    : games.filter(g => {
        const mode = (g.mode || "").toLowerCase();
        const size = (g.leagueSize || "").toLowerCase();

        if (currentFilter === "practice") return mode === "practice";
        if (["2v2", "3v3", "4v4"].includes(currentFilter)) return size === currentFilter.toLowerCase();
        return false;
      });

  filteredGames
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest on top
    .forEach((game) => {
      const li = document.createElement("li");

      let cls = "";
      if ((game.mode || "").toLowerCase() === "practice") cls = modeClasses["practice"];
      else if (["2v2", "3v3", "4v4"].includes(game.leagueSize)) cls = modeClasses[game.leagueSize];
      else cls = modeClasses["league"];

      li.className = cls;

      const originalIndex = games.indexOf(game);
      li.dataset.index = originalIndex;

      li.innerHTML = `
        <span>${new Date(game.date).toLocaleDateString()}</span>
        <span>${game.ball}</span>
        <span>${game.lane}</span>
        <span>${game.score}</span>
        <span>${game.place}</span>
      `;
      list.appendChild(li);
    });

  document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === currentFilter);
  });
}

// --- Filter buttons ---
document.querySelectorAll(".sort-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.mode;
    localStorage.setItem("lastFilter", currentFilter);
    renderGames();
  });
});

// --- Initial load ---
updateStats();
renderGames();

// --- Clear all games ---
const clearBtn = document.getElementById("clearRecentGames");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    const overlay = document.createElement("div");
    overlay.id = "deleteOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 9999;

    const popup = document.createElement("div");
    popup.id = "deletePopup";
    popup.innerHTML = `
      <h1 class="statsHeading">Clear All Stats</h1>
      <p>Are you sure you want to clear all games? This cannot be undone.</p>
      <div class="popupBtns">
        <button id="yesClear">Yes</button>
        <button id="noClear">No</button>
      </div>
    `;
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    document.getElementById("yesClear").addEventListener("click", () => {
      games = [];
      localStorage.setItem(gamesKey, JSON.stringify([]));
      updateStats();
      renderGames();
      document.body.removeChild(overlay);
    });

    document.getElementById("noClear").addEventListener("click", () => {
      document.body.removeChild(overlay);
    });
  });
}

// --- Expose for AddGames.js ---
window.updateDashboardGames = () => {
  games = JSON.parse(localStorage.getItem(gamesKey)) || [];
  updateStats();
  renderGames();
};

// === Profile modal & logic === //
document.addEventListener('DOMContentLoaded', () => {
  const profileCircle = document.getElementById('profile-circle');
  const profileModal = document.getElementById('profile-modal');
  const closeBtn = document.getElementById('close-btn');
  const saveBtn = document.getElementById('save-profile');

  const profilePicPreview = document.getElementById('profile-pic-preview');
  const profilePicInput = document.getElementById('profile-pic');

  const firstName = document.getElementById('first-name');
  const surname = document.getElementById('surname');
  const gamerName = document.getElementById('gamer-name');
  const purposeButtons = document.querySelectorAll('.purpose-options .tag');
  const favBallName = document.getElementById('fav-ball-name');
  const ballWeight = document.getElementById('ball-weight');
  const favBallImgInput = document.getElementById('fav-ball-img');
  const favBall = document.getElementById('fav-ball');
  const handedInputs = document.querySelectorAll('input[name="handed"]');

  const defaultProfileImg = './images/default-profile-img.jpg';

  function loadProfile() {
    firstName.value = localStorage.getItem('firstName') || '';
    surname.value = localStorage.getItem('surname') || '';
    gamerName.value = localStorage.getItem('gamerName') || '';
    favBallName.value = localStorage.getItem('favBallName') || '';
    ballWeight.value = localStorage.getItem('ballWeight') || '';

    const handed = localStorage.getItem('handed');
    handedInputs.forEach(input => {
      input.checked = input.value === handed;
    });

    const purposes = JSON.parse(localStorage.getItem('purposes') || '[]');
    purposeButtons.forEach(btn => {
      btn.classList.toggle('selected', purposes.includes(btn.dataset.value));
    });

    const profileImg = localStorage.getItem('profilePic') || defaultProfileImg;
    profilePicPreview.style.backgroundImage = `url(${profileImg})`;
    profilePicPreview.dataset.tempImg = '';
    profilePicPreview.style.backgroundSize = 'cover';
    profilePicPreview.style.backgroundPosition = 'center';

    const favImg = localStorage.getItem('favBallImg') || '';
    if(favImg && favBall) favBall.src = favImg;
  }

  const savedProfileImg = localStorage.getItem('profilePic') || defaultProfileImg;
  if(profileCircle) {
    profileCircle.style.backgroundImage = `url(${savedProfileImg})`;
    profileCircle.style.backgroundSize = 'cover';
    profileCircle.style.backgroundPosition = 'center';
  }

  if(profileCircle) {
    profileCircle.addEventListener('click', () => {
      loadProfile();
      profileModal.classList.remove('hidden');
      profileModal.classList.add('active');
      // ⚡ FIX: proper flex centering for modal
      profileModal.style.display = 'flex';
      profileModal.style.alignItems = 'center';
      profileModal.style.justifyContent = 'center';
      profileModal.style.opacity = '1';
      profileModal.style.pointerEvents = 'auto';
      document.body.classList.add('modal-open');
    });
  }

  function closeModal() {
    profileModal.classList.remove('active');
    profileModal.classList.add('hidden');
    profileModal.style.display = 'none'; // ⚡ hide modal properly
    profileModal.style.opacity = '0';
    profileModal.style.pointerEvents = 'none';
    document.body.classList.remove('modal-open');
  }
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  if(profileModal) {
    profileModal.addEventListener('click', e => {
      if (e.target === profileModal) closeModal();
    });
  }

  if (profilePicPreview && profilePicInput) {
    profilePicPreview.addEventListener("click", () => profilePicInput.click());
    profilePicInput.addEventListener("change", () => {
      const file = profilePicInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxSize = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxSize) { height = Math.round(height * (maxSize / width)); width = maxSize; }
            } else {
              if (height > maxSize) { width = Math.round(width * (maxSize / height)); height = maxSize; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const resizedDataUrl = canvas.toDataURL("image/png");
            profilePicPreview.style.backgroundImage = `url(${resizedDataUrl})`;
            profilePicPreview.dataset.tempImg = resizedDataUrl;
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if(favBall && favBallImgInput) {
    favBall.addEventListener('click', () => favBallImgInput.click());
    favBallImgInput.addEventListener('change', () => {
      const file = favBallImgInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 200;
            let width = img.width;
            let height = img.height;

            if(width > height) { if(width > maxSize){ height = Math.round(height * (maxSize / width)); width = maxSize; } }
            else { if(height > maxSize){ width = Math.round(width * (maxSize / height)); height = maxSize; } }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const resizedDataUrl = canvas.toDataURL('image/png');
            favBall.dataset.tempImg = resizedDataUrl;
            favBall.src = resizedDataUrl;
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if(saveBtn) saveBtn.addEventListener('click', () => {
    localStorage.setItem('firstName', firstName.value.trim());
    localStorage.setItem('surname', surname.value.trim());
    localStorage.setItem('gamerName', gamerName.value.trim());
    localStorage.setItem('favBallName', favBallName.value.trim());
    localStorage.setItem('ballWeight', ballWeight.value.trim());

    const handedSelected = document.querySelector('input[name="handed"]:checked');
    localStorage.setItem('handed', handedSelected ? handedSelected.value : '');

    const selectedPurposes = [];
    purposeButtons.forEach(btn => {
      if(btn.classList.contains('selected')) selectedPurposes.push(btn.dataset.value);
    });
    localStorage.setItem('purposes', JSON.stringify(selectedPurposes));

    const profileTempImg = profilePicPreview.dataset.tempImg;
    if(profileTempImg) {
      localStorage.setItem('profilePic', profileTempImg);
      if(profileCircle) profileCircle.style.backgroundImage = `url(${profileTempImg})`;
      delete profilePicPreview.dataset.tempImg;
    }

    const favBallTempImg = favBall.dataset.tempImg;
    if(favBallTempImg) {
      localStorage.setItem('favBallImg', favBallTempImg);
      delete favBall.dataset.tempImg;
    }

    closeModal();
  });

  purposeButtons.forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('selected')));
});

// === Daily Boost === //
document.addEventListener('DOMContentLoaded', () => {
  const quotes = [
    "Hard work beats talent when talent doesn't work hard. 💪",
    "Dreams don't work unless you do. ✨",
    "Small steps every day lead to big results. 🚀",
    "Great things never come from comfort zones. 🌟",
    "Discipline is choosing between what you want now and what you want most. 🏋",
    "Don't stop when you're tired, stop when you're done. 🔥",
    "The secret of getting ahead is getting started. 🏁",
    "Fall seven times and stand up eight. 💥",
    "Energy and persistence conquer all things. ⚡",
    "Success is the sum of small efforts repeated daily. 🏆",
    "Stop scrolling. Start doing. 😏",
    "Excuses don't burn calories. 🍕➡💪",
    "Your couch is winning. Get up. 🛋❌",
    "You're stronger than your Wi-Fi signal. 📶💪",
    "Future you is watching. Don't disappoint them. 👀",
    "Sweat now, shine later. 💦✨",
    "Your bed is lying to you. Get up. 🛏❌",
    "Coffee won't fix lazy. Move. ☕🏃",
    "Netflix won't clap for you. 📺👏❌",
    "Be stronger than your excuses. 💥😤",
    "Nobody cares, work harder. 😡💪",
    "Push yourself. No one else will. ⚔",
    "Winners are not afraid of losing. Failure is part of success. 🏆🔥",
    "Pain is weakness leaving the body. 💀➡💪",
    "Stop being afraid of what could go wrong, start being excited about what could go right. ⚡😁",
    "Hungry? Good. Stay hungry. 🍽🔥",
    "Comfort is the enemy of progress. 🛋🚫",
    "The pain you feel today will be the strength you feel tomorrow. 💪⏳",
    "Consistency beats motivation every time. 🔄💥",
    "Don't wish for it. Work for it. 🎯🔥"
  ];

  const quoteEl = document.getElementById("quote");
  if (quoteEl) {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
    const index = dayOfYear % quotes.length;
    quoteEl.textContent = quotes[index];
  }
});






// === Click Game for Details pop up === //

document.addEventListener('DOMContentLoaded', () => {
  const gameList = document.getElementById('gameList');
  const modal = document.getElementById('test-game-modal');

  gameList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    selectedGameIndex = parseInt(li.dataset.index);
    const game = games[selectedGameIndex];

    // Fill modal with game info for editing
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
      <div class="modal-header" style="display:flex; align-items:center; gap:10px;">
        <h2 style="margin:0;">Game Details</h2>
        <span id="delete-icon">🗑️</span>
      </div>

      <div class="modal-row"><span>Date:</span> <input type="date" id="modal-date"></div>
      <div class="modal-row"><span>Ball:</span> <input type="text" id="modal-ball" value="${game.ball}"></div>
      <div class="modal-row"><span>Lane:</span> <input type="text" id="modal-lane" value="${game.lane}"></div>
      <div class="modal-row"><span>Score:</span> <input type="number" id="modal-score" value="${game.score}"></div>
      <div class="modal-row"><span>Place:</span> <input type="text" id="modal-place" value="${game.place}"></div>

      <div class="button-row">
        <button id="modal-save">Save</button>
        <button id="close-test-modal">Close</button>
      </div>
    `;

    // Set correct date for the input in YYYY-MM-DD format
    const modalDateInput = modalContent.querySelector('#modal-date');
    const dateObj = new Date(game.date);
    const yyyy = dateObj.getFullYear();
    let mm = dateObj.getMonth() + 1;
    let dd = dateObj.getDate();
    if (mm < 10) mm = '0' + mm;
    if (dd < 10) dd = '0' + dd;
    modalDateInput.value = `${yyyy}-${mm}-${dd}`;

    // Set data-mode to trigger CSS border color
    modal.dataset.mode = game.mode === "practice" ? "practice" : game.leagueSize;

    // Show modal
    modal.style.display = 'flex';
    modal.classList.remove('hidden');

    // Style inputs dynamically for focus/inactive
    modalContent.querySelectorAll('input').forEach(input => {
      input.style.borderColor = '#999'; // default gray
      input.addEventListener('focus', () => {
        input.style.borderColor = '#3d80ff'; // blue on focus
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#999'; // gray when not focused
      });
    });

    // Save button
    const saveBtn = modalContent.querySelector('#modal-save');
    saveBtn.style.fontWeight = '600';
    saveBtn.addEventListener('click', () => {
      const updatedGame = {
        date: modalContent.querySelector('#modal-date').value,
        ball: modalContent.querySelector('#modal-ball').value,
        lane: modalContent.querySelector('#modal-lane').value,
        score: parseInt(modalContent.querySelector('#modal-score').value),
        place: modalContent.querySelector('#modal-place').value,
        mode: games[selectedGameIndex].mode,
        leagueSize: games[selectedGameIndex].leagueSize
      };

      games[selectedGameIndex] = updatedGame;
      localStorage.setItem(gamesKey, JSON.stringify(games));

      updateStats();
      renderGames();
      modal.classList.add('hidden');
      modal.style.display = 'none';
    });

    // Close button
    const closeModalBtn = modalContent.querySelector('#close-test-modal');
    closeModalBtn.style.fontWeight = '600';
    closeModalBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    });

    // Delete icon
    const deleteIcon = modalContent.querySelector('#delete-icon');
    deleteIcon.addEventListener('click', () => {
      showDeleteConfirm();
    });
  });

  // --- Confirmation Popup ---
  function showDeleteConfirm() {
    const confirmModal = document.createElement('div');
    confirmModal.className = 'confirm-modal';
    confirmModal.innerHTML = `
      <div class="confirm-box">
        <h3 class="statsHeading">Delete Game?</h3>
        <p>This action cannot be undone.</p>
        <div class="popupBtns">
          <button id="confirm-delete">Delete</button>
          <button id="confirm-cancel">Cancel</button>         
        </div>
      </div>
    `;

    document.body.appendChild(confirmModal);

    // Cancel
    confirmModal.querySelector('#confirm-cancel').addEventListener('click', () => {
      confirmModal.remove();
    });

    // Confirm delete
    confirmModal.querySelector('#confirm-delete').addEventListener('click', () => {
      games.splice(selectedGameIndex, 1);
      localStorage.setItem(gamesKey, JSON.stringify(games));
      updateStats();
      renderGames();
      confirmModal.remove();
      modal.classList.add('hidden');
      modal.style.display = 'none';
    });
  }

  // Click outside modal closes it
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  });
});