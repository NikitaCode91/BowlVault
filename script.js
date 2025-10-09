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

  // ❌ No date sorting
  // ✅ Newest game on top
  filteredGames.slice().reverse().forEach((game, index) => {
    const li = document.createElement("li");

    let cls = "";
    if ((game.mode || "").toLowerCase() === "practice") cls = modeClasses["practice"];
    else if (["2v2", "3v3", "4v4"].includes(game.leagueSize)) cls = modeClasses[game.leagueSize];
    else cls = modeClasses["league"];

    li.className = cls;

    // Map index to the original games array
    li.dataset.index = games.indexOf(game);

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
    profileModal.style.display = 'none';
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
  "Be stronger than your excuses. 💥😤",
  "Nobody cares, work harder. 😡💪",
  "Push yourself. No one else will. ⚔",
  "Winners are not afraid of losing. Failure is part of success. 🏆🔥",
  "Pain is weakness leaving the body. 💀➡💪",
  "Stop being afraid of what could go wrong, start being excited about what could go right. ⚡",
  "Hungry? Good. Stay hungry. 🍽🔥",
  "The pain you feel today will be the strength you feel tomorrow. 💪⏳",
  "Consistency beats motivation every time. 🔄💥",
  "Don't wish for it. Work for it. 🎯🔥",
  "Success doesn't come to you. You go to it. 🏃‍♂",
  "Your only limit is you. 🚀",
  "Greatness starts with a single step. ✨",
  "The harder you work, the luckier you get. 💪",
  "Focus on your goals, not your fears. ⚡",
  "Dream it. Plan it. Do it. 🏁",
  "Strength grows in the moments when you think you can't go on. 💥",
  "Winners train, losers complain. 🏆",
  "Make today count, or someone else will. 🔥",
  "Your future is created by what you do today, not tomorrow. ⚡"
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

  const leagueTypes = ["2v2", "3v3", "4v4"];
  const avgColors = {
    "2v2": "#f0fff0",
    "3v3": "#fff5e0",
    "4v4": "#ffe0e0",
    "practice": "#ffe6eb" // light pink for practice
  };

  function calculateLeagueAvg(size) {
    const leagueGames = games.filter(g => (g.leagueSize === size || (size === 'practice' && g.mode === 'practice')));
    if (!leagueGames.length) return "0.0";
    const total = leagueGames.reduce((sum, g) => sum + (g.score || 0), 0);
    return (total / leagueGames.length).toFixed(1);
  }

  gameList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    selectedGameIndex = parseInt(li.dataset.index);
    const game = games[selectedGameIndex];
    const modalContent = modal.querySelector('.modal-content');
    const leagueSize = leagueTypes.includes(game.leagueSize) ? game.leagueSize : (game.mode === 'practice' ? 'practice' : null);
    const isDarkMode = document.body.classList.contains('dark-mode');

    // build game details modal
    function buildGameDetails() {
      // Only show players icon for league games
      const showPlayersIcon = leagueTypes.includes(game.leagueSize);

      modalContent.innerHTML = `
        <div class="modal-header">
          ${showPlayersIcon ? '<span id="players-icon" title="Players">👥</span>' : '<span style="width:22px;"></span>'}
          <h2>Game Details</h2>
          <span id="delete-icon">🗑️</span>
        </div>

        <div class="modal-row"><span>Date:</span> <input type="date" id="modal-date"></div>
        <div class="modal-row"><span>Ball:</span> <input type="text" id="modal-ball" value="${game.ball}"></div>
        <div class="modal-row"><span>Lane:</span> <input type="text" id="modal-lane" value="${game.lane}"></div>
        <div class="modal-row"><span>Score:</span> <input type="number" id="modal-score" value="${game.score}"></div>
        <div class="modal-row"><span>Place:</span> <input type="text" id="modal-place" value="${game.place}"></div>
        ${leagueSize ? `
          <div class="modal-row">
            <span>Average:</span>
            <span class="avg-display" style="
              display:inline-block;
              width:calc(100% - 85px);
              padding:5px 10px;
              border:2px solid ${leagueSize === '2v2' ? '#2a7f2a' : leagueSize === '3v3' ? '#e69500' : leagueSize === '4v4' ? '#b22222' : '#e0405b'};
              border-radius:4px;
              text-align:center;
              font-weight:500;
              box-sizing:border-box;
              background-color:${isDarkMode ? '#333' : avgColors[leagueSize]};
              color:${isDarkMode ? '#eee' : '#000'};
            ">${calculateLeagueAvg(leagueSize)}</span>
          </div>` : ''}

        <div class="button-row">
          <button id="modal-save">Save</button>
          <button id="close-test-modal">Close</button>
        </div>
      `;

      // Set date input
      const modalDateInput = modalContent.querySelector('#modal-date');
      const dateObj = new Date(game.date);
      const yyyy = dateObj.getFullYear();
      let mm = dateObj.getMonth() + 1;
      let dd = dateObj.getDate();
      if (mm < 10) mm = '0' + mm;
      if (dd < 10) dd = '0' + dd;
      modalDateInput.value = `${yyyy}-${mm}-${dd}`;

      modal.dataset.mode = leagueSize || game.mode;
      modal.style.display = 'flex';
      modal.classList.remove('hidden');

      // Inputs styling and focus effect
      modalContent.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '#999';
        input.addEventListener('focus', () => input.style.borderColor = '#3d80ff');
        input.addEventListener('blur', () => input.style.borderColor = '#999');
      });

      // Event listeners for icons and buttons
      const playersIcon = modalContent.querySelector('#players-icon');
      if (playersIcon) playersIcon.addEventListener('click', () => buildPlayersView());

      const deleteIcon = modalContent.querySelector('#delete-icon');
      if (deleteIcon) deleteIcon.addEventListener('click', () => showDeleteConfirm());

      const saveBtn = modalContent.querySelector('#modal-save');
      saveBtn.addEventListener('click', () => {
        const updatedGame = {
          ...game,
          date: modalContent.querySelector('#modal-date').value,
          ball: modalContent.querySelector('#modal-ball').value,
          lane: modalContent.querySelector('#modal-lane').value,
          score: parseInt(modalContent.querySelector('#modal-score').value),
          place: modalContent.querySelector('#modal-place').value,
        };
        games[selectedGameIndex] = updatedGame;
        localStorage.setItem(gamesKey, JSON.stringify(games));
        updateStats();
        renderGames();
        if (leagueSize) {
          const avgSpan = modalContent.querySelector('.avg-display');
          if (avgSpan) avgSpan.textContent = calculateLeagueAvg(leagueSize);
        }
        modal.classList.add('hidden');
        modal.style.display = 'none';
      });

      const closeModalBtn = modalContent.querySelector('#close-test-modal');
      closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      });

      // Average live update
      const avgSpan = modalContent.querySelector('.avg-display');
      const scoreInput = modalContent.querySelector('#modal-score');
      if (leagueSize && avgSpan && scoreInput) {
        scoreInput.addEventListener('input', () => {
          const tempScore = parseInt(scoreInput.value) || 0;
          const leagueGames = games.filter(g => (g.leagueSize === leagueSize || (leagueSize === 'practice' && g.mode === 'practice')));
          const total = leagueGames.reduce((sum, g) => sum + (g === game ? tempScore : g.score || 0), 0);
          avgSpan.textContent = (total / leagueGames.length).toFixed(1);
        });
      }
    }

    // build players modal
    function buildPlayersView() {
      const teamSize = parseInt(leagueSize?.charAt(0)) || 2;
      const savedPlayers = game.players || { teamA: Array(teamSize).fill(""), teamB: Array(teamSize).fill("") };

      const teamInputs = (team, side) => savedPlayers[team]
        .map((p, i) => `<input type="text" id="${side}-${i}" placeholder="Player ${i + 1}" value="${p}" style="margin:4px; padding:8px; font-size:1rem; width:90%; border-radius:4px;">`)
        .join('');

      modalContent.innerHTML = `
        <div class="modal-header" style="display:flex; align-items:center; justify-content:space-between;">
          <span id="back-to-details" title="Back">👈</span>
          <h2 style="margin:0;">Players</h2>
          <span style="width:22px;"></span>
        </div>

        <div class="players-container" style="display:flex; flex-direction:column; align-items:center; margin-top:10px;">
          <div class="team teamA" style="display:flex; flex-direction:column; align-items:center;">${teamInputs('teamA', 'teamA')}</div>
          <div class="vs-text" style="margin:10px 0; font-weight:bold;">VS</div>
          <div class="team teamB" style="display:flex; flex-direction:column; align-items:center;">${teamInputs('teamB', 'teamB')}</div>
        </div>

        <div class="button-row">
          <button id="save-players">Save</button>
          <button id="close-players">Close</button>
        </div>
      `;

      const backBtn = modalContent.querySelector('#back-to-details');
      backBtn.addEventListener('click', () => buildGameDetails());

      const saveBtn = modalContent.querySelector('#save-players');
      const closeBtn = modalContent.querySelector('#close-players');

      saveBtn.addEventListener('click', () => {
        const updatedPlayers = {
          teamA: savedPlayers.teamA.map((_, i) => modalContent.querySelector(`#teamA-${i}`).value),
          teamB: savedPlayers.teamB.map((_, i) => modalContent.querySelector(`#teamB-${i}`).value)
        };
        games[selectedGameIndex].players = updatedPlayers;
        localStorage.setItem(gamesKey, JSON.stringify(games));
        buildGameDetails();
      });

      // Close full modal instead of going back
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      });
    }

    buildGameDetails();
  });

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

    confirmModal.querySelector('#confirm-cancel').addEventListener('click', () => confirmModal.remove());
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

  // Close modal when clicking outside content
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  });
});