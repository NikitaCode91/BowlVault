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

  // --- Filter logic FIXED ---
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
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((game, index) => {
      const li = document.createElement("li");

      // Correctly assign class for coloring
      let cls = "";
      if ((game.mode || "").toLowerCase() === "practice") cls = modeClasses["practice"];
      else if (["2v2", "3v3", "4v4"].includes(game.leagueSize)) cls = modeClasses[game.leagueSize];
      else cls = modeClasses["league"];

      li.className = cls;
      li.dataset.index = index;
      li.innerHTML = `
        <span>${new Date(game.date).toLocaleDateString()}</span>
        <span>${game.ball}</span>
        <span>${game.lane}</span>
        <span>${game.score}</span>
        <span>${game.place}</span>
      `;

      // Long press to delete
      let pressTimer;
      li.addEventListener('mousedown', () => {
        li.classList.add('delete-hold');
        pressTimer = setTimeout(() => {
          li.classList.remove('delete-hold');

          const confirmDiv = document.createElement('div');
          confirmDiv.className = 'delete-confirm';
          confirmDiv.innerHTML = `Delete this game?<button class="yes-btn">Yes</button><button class="no-btn">No</button>`;
          li.appendChild(confirmDiv);

          confirmDiv.querySelector('.yes-btn').addEventListener('click', () => {
            games.splice(index, 1);
            localStorage.setItem(gamesKey, JSON.stringify(games));
            updateStats();
            renderGames();
          });

          confirmDiv.querySelector('.no-btn').addEventListener('click', () => {
            li.removeChild(confirmDiv);
          });

        }, 1000);
      });

      li.addEventListener('mouseup', () => {
        li.classList.remove('delete-hold');
        clearTimeout(pressTimer);
      });

      li.addEventListener('mouseleave', () => {
        li.classList.remove('delete-hold');
        clearTimeout(pressTimer);
      });

      list.appendChild(li);
    });

  // Highlight active sort button
  document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === currentFilter);
  });
}

// --- Filter buttons ---
document.querySelectorAll(".sort-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.mode;
    localStorage.setItem("lastFilter", currentFilter); // Save last filter
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
    if (confirm("Are you sure you want to clear all games? This cannot be undone.")) {
      games = [];
      localStorage.setItem(gamesKey, JSON.stringify([]));
      updateStats();
      renderGames();
    }
  });
}

// --- Expose global function for AddGames.js ---
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
  const favBallImgInput = document.getElementById('fav-ball-img');
  const favBall = document.getElementById('fav-ball');

  const firstName = document.getElementById('first-name');
  const surname = document.getElementById('surname');
  const gamerName = document.getElementById('gamer-name');
  const handednessInputs = document.querySelectorAll('input[name="handed"]');
  const purposeButtons = document.querySelectorAll('.purpose-options .tag');
  const favBallName = document.getElementById('fav-ball-name');
  const ballWeight = document.getElementById('ball-weight');

  function loadProfile() {
    firstName.value = localStorage.getItem('firstName') || '';
    surname.value = localStorage.getItem('surname') || '';
    gamerName.value = localStorage.getItem('gamerName') || '';
    favBallName.value = localStorage.getItem('favBallName') || '';
    ballWeight.value = localStorage.getItem('ballWeight') || '';

    const handed = localStorage.getItem('handed');
    if (handed) {
      const input = document.querySelector(`input[name="handed"][value="${handed}"]`);
      if (input) input.checked = true;
    }

    const purposes = JSON.parse(localStorage.getItem('purposes') || '[]');
    purposeButtons.forEach(btn => {
      btn.classList.toggle('selected', purposes.includes(btn.dataset.value));
    });

    const profileImg = localStorage.getItem('profilePic');
    if (profileImg) {
      profilePicPreview.style.backgroundImage = `url(${profileImg})`;
      profileCircle.style.backgroundImage = `url(${profileImg})`;
      profileCircle.style.backgroundSize = 'cover';
      profileCircle.style.backgroundPosition = 'center';
    }

    const ballImg = localStorage.getItem('favBallImg');
    if (ballImg) {
      favBall.src = ballImg;
    }
  }

  if(profileCircle) {
    profileCircle.addEventListener('click', () => {
      loadProfile();
      profileModal.classList.remove('hidden');
      profileModal.classList.add('active');
      profileModal.style.opacity = '1';
      profileModal.style.pointerEvents = 'auto';
      document.body.classList.add('modal-open');
    });
  }

  function closeModal() {
    profileModal.classList.remove('active');
    profileModal.classList.add('hidden');
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
      if (btn.classList.contains('selected')) selectedPurposes.push(btn.dataset.value);
    });
    localStorage.setItem('purposes', JSON.stringify(selectedPurposes));

    closeModal();
  });

  purposeButtons.forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('selected')));

  // Profile pic upload
  if(profilePicPreview && profilePicInput) {
    profilePicPreview.addEventListener('click', () => profilePicInput.click());
    profilePicInput.addEventListener('change', () => {
      const file = profilePicInput.files[0];
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

            if(width > height) {
              if(width > maxSize) {
                height = Math.round(height * (maxSize / width));
                width = maxSize;
              }
            } else {
              if(height > maxSize) {
                width = Math.round(width * (maxSize / height));
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const resizedDataUrl = canvas.toDataURL('image/png');

            profilePicPreview.style.backgroundImage = `url(${resizedDataUrl})`;
            profileCircle.style.backgroundImage = `url(${resizedDataUrl})`;
            profileCircle.style.backgroundSize = 'cover';
            profileCircle.style.backgroundPosition = 'center';
            localStorage.setItem('profilePic', resizedDataUrl);
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Favorite ball upload
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

            if(width > height) {
              if(width > maxSize) {
                height = Math.round(height * (maxSize / width));
                width = maxSize;
              }
            } else {
              if(height > maxSize) {
                width = Math.round(width * (maxSize / height));
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const resizedDataUrl = canvas.toDataURL('image/png');

            favBall.src = resizedDataUrl;
            localStorage.setItem('favBallImg', resizedDataUrl);
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }

  loadProfile();
});

// === Daily Boost === //

document.addEventListener('DOMContentLoaded', () => {
  const quotes = [
    // --- Normal Boosts ---
    "Hard work beats talent when talent doesn’t work hard. 💪",
    "Dreams don’t work unless you do. ✨",
    "Small steps every day lead to big results. 🚀",
    "Great things never come from comfort zones. 🌟",
    "Discipline is choosing between what you want now and what you want most. 🏋",
    "Don’t stop when you’re tired, stop when you’re done. 🔥",
    "The secret of getting ahead is getting started. 🏁",
    "Fall seven times and stand up eight. 💥",
    "Energy and persistence conquer all things. ⚡",
    "Success is the sum of small efforts repeated daily. 🏆",

    // --- Funny Boosts ---
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

    // --- Angry / Tough Love Boosts ---
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