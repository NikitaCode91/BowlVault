
/** 
 * BowlVault — main frontend script
 * 
 * Comment Structure:
 * 
 * // ===== Section ===== //      → Marks the start of a major section
 * // -- Comment -- //            → Comment about linked files or references
 * // == Comment == //            → Highlights an importent step or feature within a section
 * // Comment                     → General explanation of code
 *
 * Purpose:
 * - Controls theme (light/dark).
 * - Loads, shows, filters, edits, and deletes saved games.
 * - Manages the profile modal (edit name, avatar, favourite ball).
 * - Shows a daily motivational quote.
 * - Shows a game-details modal with live average calculations and player lists.
 *
 * Important constants and storage keys:
 * - gamesKey = "bowlvault_games"     // array of saved game objects in localStorage
 * - theme key = "theme"              // "dark" or "light" in localStorage
 * - lastFilter = "lastFilter"        // last selected game filter
 * - profile fields saved to localStorage: firstName, surname, gamerName,
 *   favBallName, ballWeight, handed, purposes, profilePic, favBallImg
 *
 * Expected DOM elements (IDs / classes used by this script):
 * - #theme-toggle (button) with a child .emoji
 * - #gameList (ul or ol) to render games
 * - .sort-btn elements (buttons) with data-mode attributes
 * - #clearRecentGames (button) to clear all games
 * - #profile-circle (clickable avatar)
 * - #profile-modal (profile modal container)
 * - #profile-pic-preview, #profile-pic, #fav-ball, #fav-ball-img
 * - #save-profile (button) to save profile edits
 * - #quote (element to show daily quote)
 * - #test-game-modal (modal for showing game details)
 *
 * Notes / safety:
 * - This script reads and writes localStorage. If localStorage is cleared,
 *   saved games and profile data will be lost.
 * - The script assumes date strings stored in game.date are parseable by Date().
 * - Defensive checks are recommended if localStorage might be corrupted.
 *
 * File structure (sections you will find below):
 * 1. Theme toggle (light/dark)
 * 2. Games state + rendering + stats
 * 3. Filter buttons and clear-all flow
 * 4. Profile modal: load, edit, save, and image resizing
 * 5. Daily quote selector
 * 6. Game details modal: view, edit, players, delete
 *
 * Author: Kita
 * Last updated: 20 Oct 2025
 */


// ===== Light & Dark Mode ===== //
const toggleBtn = document.getElementById('theme-toggle');
const emojiSpan = toggleBtn.querySelector('.emoji');

// Load saved theme when the page starts 
const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    emojiSpan.textContent = '🌞';
    toggleBtn.classList.add('toggled');
  } else {
    document.body.classList.remove('dark-mode');
    emojiSpan.textContent = '🌙';
    toggleBtn.classList.remove('toggled');
  }

// When the user clicks the button 
toggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  emojiSpan.textContent = isDark ? "🌞" : "🌙";
  toggleBtn.classList.toggle("toggled");

  localStorage.setItem("theme", isDark ? "dark" : "light");
});



'use strict';

// ===== Games ===== //
// Load, display, filter and manage game stats
const gamesKey = 'bowlvault_games';

// -- Load games from localStorage -- //
let games = JSON.parse(localStorage.getItem(gamesKey)) || [];
let currentFilter = localStorage.getItem('lastFilter') || 'all'; 

// Is for tracking selection
let selectedGameIndex = null;

// == Incoming games Text-Colors (text only CSS classes) == //
const modeClasses = {
  '2v2': 'text-2v2',
  '3v3': 'text-3v3',
  '4v4': 'text-4v4',
  'practice': 'text-practice',
  'league': 'text-league'
};

// == All about Quick Stats == //
function updateStats() {
  document.getElementById('gamesPlayed').textContent = games.length;

  const totalScore = games.reduce((sum, g) => sum + (g.score || 0), 0);
  document.getElementById('gamesScore').textContent = totalScore;

  const highScore = games.reduce((max, g) => Math.max(max, g.score), 0);
  document.getElementById('highScore').textContent = highScore;

  const lowScore = games.length ? games.reduce((min, g) => 
    Math.min(min, g.score || Infinity), Infinity) : 0;
  document.getElementById('lowScore').textContent = lowScore;

  const ballCounts = games.reduce((acc, g, index) => {
    if (!g.ball) return acc;

    // Split multiple balls into individual names
    const balls = g.ball
      .split(/,|\/|&/g) 
      .map(b => b.trim())
      .filter(Boolean);

    balls.forEach(ball => {
      if (!acc[ball]) {
        acc[ball] = { count: 0, bestScore: 0, lastUsedIndex: -1 };
      }

      acc[ball].count += 1;
      acc[ball].bestScore = Math.max(
        acc[ball].bestScore,
        g.score || 0
      );

      // Track most recently used game index
      acc[ball].lastUsedIndex = index;
    });
    
    return acc;
  }, {});

  const favoriteBall =
    Object.entries(ballCounts)
      .sort((a, b) =>
        b[1].count - a[1].count ||
        b[1].bestScore - a[1].bestScore ||
        b[1].lastUsedIndex - a[1].lastUsedIndex
      )[0]?.[0] || "None";

  document.getElementById('favoriteBall').textContent = favoriteBall;
}


// == Displaying the list of games == //
function renderGames() {
  const list = document.getElementById('gameList');
  if (!list) return;
  list.innerHTML = '';

  const filteredGames = currentFilter === 'all'
    ? games
    : games.filter(g => {
        const mode = (g.mode || '').toLowerCase();
        const size = (g.leagueSize || '').toLowerCase();

        if (currentFilter === 'practice') return mode === 'practice';
        if (['2v2', '3v3', '4v4'].includes(currentFilter)) return size === currentFilter.toLowerCase();
        return false;
      });

  // Create a copy, then reverse newest games appear on top 
  filteredGames.slice().reverse().forEach((game, index) => {
    const li = document.createElement('li');

    // Color or style different game types differently 
    let cls = '';
    if ((game.mode || '').toLowerCase() === 'practice')
      cls = modeClasses['practice'];
    else if (['2v2', '3v3', '4v4'].includes(game.leagueSize)) 
      cls = modeClasses[game.leagueSize];
    else cls = modeClasses['league'];

    li.className = cls;

    // Saves the position of this game inside the original games array 
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

  // This is how the "selected filter" visually updates 
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === currentFilter);
  });
}

// Filter buttons 
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.mode;
    localStorage.setItem('lastFilter', currentFilter);
    renderGames();
  });
});

// Initial load when page starts 
updateStats();
renderGames();


// ===== Clear all games ===== //
const clearBtn = document.getElementById('clearRecentGames');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {

    // Makes a full-screen, centered dark overlay to hold the confirmation popup 
    const overlay = document.createElement('div');
    overlay.id = 'deleteOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = '#00000080';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9999;

    // Makes the popup box
    const popup = document.createElement('div');
    popup.id = 'deletePopup';
    popup.innerHTML = `
      <h1 class="statsHeading">Clear All Stats</h1>
      <p>Are you sure you want to clear all games? This cannot be undone.</p>
      <div class="popupBtns">
        <button id="yesClear">Yes</button>
        <button id="noClear">No</button>
      </div>
    `;

    // Makes overlay show on in front of everything
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Close the popup once the clearing action is done and saves (YES)  
    document.getElementById('yesClear').addEventListener('click', () => {

    // Clear all games
    games = [];
    localStorage.setItem(gamesKey, JSON.stringify([]));

    // 🔴 ALSO clear all frames
    localStorage.removeItem("leagueFrames");

    // Update UI
    updateStats();
    renderGames();
    updateCircles();   // 🔴 reset circles

    // Close popup
    document.body.removeChild(overlay);
    });

    // Close the popup without clearing anything (NO)
    document.getElementById('noClear').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  });
}


// -- Expose for Games.js -- //
// Makes the function global so another script can use it
window.updateDashboardGames = () => {
  // Show my games or an empty array
  games = JSON.parse(localStorage.getItem(gamesKey)) || [];

  // Updates total/statistics
  updateStats();

  // Refreshes what's displayed on the page
  renderGames();
};


// ===== Profile modal & logic ===== //
// Wait until the HTML is fully loaded before selecting elements and running code
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

    // Checks the corresponding radio button
    const handed = localStorage.getItem('handed');
    handedInputs.forEach(input => {
      input.checked = input.value === handed;
    });

    // Adds 'selected' class to buttons whose data-value exists in saved purposes, remove it otherwise
    const purposes = JSON.parse(localStorage.getItem('purposes') || '[]');
    purposeButtons.forEach(btn => {
      btn.classList.toggle('selected', purposes.includes(btn.dataset.value));
    });

    // Sets preview div's background to profile image (or default), ensure it fits nicely
    const profileImg = localStorage.getItem('profilePic') || defaultProfileImg;
    profilePicPreview.style.backgroundImage = `url(${profileImg})`;
    profilePicPreview.dataset.tempImg = '';
    profilePicPreview.style.backgroundSize = 'cover';
    profilePicPreview.style.backgroundPosition = 'center';

    const favImg = localStorage.getItem('favBallImg') || ''; 

    // If a favorite ball image only if it's saved in localStorage and the <img> element is on the page, display it
    if (favImg && favBall) 
      favBall.src = favImg;
  }

  const savedProfileImg = localStorage.getItem('profilePic') || defaultProfileImg;
  if (profileCircle) {
    profileCircle.style.backgroundImage = `url(${savedProfileImg})`;
    profileCircle.style.backgroundSize = 'cover';
    profileCircle.style.backgroundPosition = 'center';

    // Opens Profile Modal
    profileCircle.addEventListener('click', () => {
      loadProfile();
      profileModal.classList.remove('hidden');
      profileModal.classList.add('active');
      profileModal.style.display = 'flex';
      profileModal.style.alignItems = 'center';
      profileModal.style.justifyContent = 'center';

      // Make modal visible and interactive
      profileModal.style.opacity = '1';
      profileModal.style.pointerEvents = 'auto';

      // Prevent background scrolling while modal is open
      document.body.classList.add('modal-open');
    });
  }

  // Function to hide the profile modal and re-enable page scrolling
  function closeModal() {
    profileModal.classList.remove('active');
    profileModal.classList.add('hidden');
    profileModal.style.display = 'none';
    profileModal.style.opacity = '0';
    profileModal.style.pointerEvents = 'none';
    document.body.classList.remove('modal-open');
  }

  // Close modal when the close button is clicked
  if (closeBtn) 
    closeBtn.addEventListener('click', closeModal);

  // Close modal when clicking on the background (outside modal content)
  if (profileModal) {
    profileModal.addEventListener('click', e => {
      if (e.target === profileModal) 
        closeModal();
    });
  }

  // == Check if both preview and input elements exist before running == //
  if (profilePicPreview && profilePicInput) {

    // When user clicks the preview, open the file selector
    profilePicPreview.addEventListener('click', () => profilePicInput.click());

    // When a new image file is chosen
    profilePicInput.addEventListener('change', () => {
      const file = profilePicInput.files[0];

      // If the user actually selected a file 
      if (file) {
        const reader = new FileReader();

        // When the file is fully read (converted to base64)
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result;

          // When the image finishes loading in memory
          img.onload = () => {

            // Prepare to resize the image
            const canvas = document.createElement('canvas');
            const maxSize = 200; // Max width or height in pixels
            let width = img.width;
            let height = img.height;

            // Keep proportions while resizing
            if (width > height) {
              if (width > maxSize) { 
                height = Math.round(height * (maxSize / width));
                width = maxSize; 
              }
            } else {
              if (height > maxSize) {
                width = Math.round(width * (maxSize / height));
                height = maxSize; 
              }
            }

            // Draw the resized image on the canvas
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert canvas back to image data and show preview
            const resizedDataUrl = canvas.toDataURL('image/png');
            profilePicPreview.style.backgroundImage = `url(${resizedDataUrl})`;

            // Store resized image temporarily for later upload
            profilePicPreview.dataset.tempImg = resizedDataUrl;
          };
        };

        // Start reading the selected file
        reader.readAsDataURL(file);
      }
    });
  }

  // == Handle favorite ball image upload == //
  if (favBall && favBallImgInput) {

    // Click image to open file selector
    favBall.addEventListener('click', () => favBallImgInput.click());

    // On file selection
    favBallImgInput.addEventListener('change', () => {
      const file = favBallImgInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {

            // Resize image to max 200px
            const canvas = document.createElement('canvas');
            const maxSize = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) { 
              if (width > maxSize) {
                  height = Math.round(height * (maxSize / width));
                  width = maxSize; 
                } 
              } else { 
              if (height > maxSize) {
                  width = Math.round(width * (maxSize / height));
                  height = maxSize; 
                } 
              }

            // Draw and apply resized image
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

  // == Save profile info to localStorage == //
  if (saveBtn) saveBtn.addEventListener('click', () => {

    // Save basic input values
    localStorage.setItem('firstName', firstName.value.trim());
    localStorage.setItem('surname', surname.value.trim());
    localStorage.setItem('gamerName', gamerName.value.trim());
    localStorage.setItem('favBallName', favBallName.value.trim());
    localStorage.setItem('ballWeight', ballWeight.value.trim());

    // Save handedness (radio button)
    const handedSelected = document.querySelector('input[name="handed"]:checked');
    localStorage.setItem('handed', handedSelected ? handedSelected.value : '');

    // Save selected purposes (multi-buttons)
    const selectedPurposes = [];
    purposeButtons.forEach(btn => {
      if (btn.classList.contains('selected'))
        selectedPurposes.push(btn.dataset.value);
    });
    localStorage.setItem('purposes', JSON.stringify(selectedPurposes));

    // Save profile picture if updated
    const profileTempImg = profilePicPreview.dataset.tempImg;
    if (profileTempImg) {
      localStorage.setItem('profilePic', profileTempImg);
      if (profileCircle) profileCircle.style.backgroundImage = `url(${profileTempImg})`;
      delete profilePicPreview.dataset.tempImg;
    }

    // Save favorite ball image if updated
    const favBallTempImg = favBall.dataset.tempImg;
    if (favBallTempImg) {
      localStorage.setItem('favBallImg', favBallTempImg);
      delete favBall.dataset.tempImg;
    }

    // Close modal after saving
    closeModal();
  });

  // Allow purpose buttons to toggle selected state
  purposeButtons.forEach(btn => btn.addEventListener('click', () =>
    btn.classList.toggle('selected')
    ));
});


// ===== Daily Boost ===== //
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
    "Push yourself. No one else will. ⚔",
    "Winners are not afraid of losing. Failure is part of success. 🏆🔥",
    "Stop being afraid of what could go wrong, start being excited about what could go right. ⚡",
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
    "Your future is created by what you do today, not tomorrow. ⚡",
    "Every frame is a fresh start. 🎳",
    "Consistency turns a good bowler into a great one. 💪",
    "Perfect form beats perfect luck. 🎯",
    "When your arm is tired, let your focus throw the ball. 🧠🔥",
    "Don't chase strikes, chase improvement. 🏆",
    "One pin at a time, one step at a time. 🚀",
    "Focus is sharper than power. ⚡",
    "Bowling is 10% skill, 90% mental game. 🏋🎳",
    "Master your mind, master the lane. 🧠🎳",
    "Pressure creates diamonds. Shine under it. 💎",
    "Every setback is a setup for a comeback. 🔄💥",
    "The lanes reward patience and precision. 🏁",
    "Strike with confidence, spare with patience. 🎳✨",
    "Your only competition is yourself. 💪",
    "Train insane or remain the same. 🔥",
    "Focus on the process, not the pins. ⚡",
    "Great bowlers are made in practice, not games. 🏆",
    "Every pin counts — make each one matter. 🎯",
    "Failing is learning. Keep rolling. 💥",
    "Precision beats power every time. 🧠",
    "The lane doesn't forgive laziness. Stay sharp. ⚡",
    "Consistency > talent. 💪",
    "Don't wait for luck, create it. 🎳",
    "Strike fear into your doubts, not your balls. ⚡",
    "Momentum is built one frame at a time. 🔄",
    "Focus on the follow-through. 🏁",
    "Your best game is always ahead. 🚀",
    "Excellence is forged in practice. 🏋",
    "Winners make it happen; losers make excuses. ⚔",
    "Visualize the perfect game before it happens. 🧠",
    "Patience is power. 🎳",
    "Every champion was once a beginner. 🌟",
    "Strike with intent, spare with focus. 💥",
    "Mindset is the lane to success. 🏆",
    "The ball follows the mind. Focus sharp. ⚡",
    "Sweat in practice, shine in competition. 🔥",
    "The harder you push, the further you roll. 💪",
    "Success favors the prepared. 🏁",
    "Don't fear failure; embrace it. 💥",
    "Every day is a new lane. 🎳",
    "Skill is nothing without discipline. 🏋",
    "Flow is the bowler's secret weapon. 🌀",
    "Control your breath, control the lane. 🌬🎯",
    "Energy without focus is wasted. ⚡",
    "Train like you mean it. 💪🔥",
    "The mind decides the pins, not the arm. 🧠",
    "Persistence is the strike of champions. 🎳",
    "Bowling is art in motion. 🌟",
    "Hustle, hit, never quit. 💥",
    "Every ball is an opportunity. 🚀",
    "Focus. Commit. Roll. 🏆",
    "Precision under pressure creates legends. ⚡",
    "Your frame, your game, your pride. 🎳",
    "Never underestimate the power of one pin. 💪",
    "The lane rewards consistency, not chaos. 🔄",
    "Strike fear into doubt, spare hope for success. 💥",
    "Bowling is 90% mental, 10% physical. 🧠",
    "Small improvements compound into greatness. ✨",
    "The perfect shot starts in the mind. 🏁",
    "Make every practice count. 🔥",
    "Fear nothing, roll everything. ⚡",
    "Concentration wins games. 🎯",
    "The lane is a mirror of your focus. 🪞🎳",
    "Success is built frame by frame. 🏆",
    "Energy + consistency = dominance. 💪",
    "Dream big, roll true. 🚀",
    "Your best game comes after your hardest practice. 🔄",
    "Champions focus on growth, not outcome. 🏋",
    "Every throw is a statement. 💥",
    "Commitment creates champions. 🎳",
    "The lane never lies — your focus shows. ⚡",
    "Perfect practice creates perfect performance. 🏁",
    "Discipline beats talent when talent sleeps. 🔥",
    "A calm mind throws the perfect ball. 🧠",
    "Pressure reveals character. 💪",
    "Every pin is a challenge, every frame a battle. 🎯",
    "Strive for progress, not perfection. 🚀",
    "Your form today defines your game tomorrow. 💥",
    "Keep your eyes on the lane, not the scoreboard. 🎳",
    "Small victories lead to big wins. 🏆",
    "Bowling is patience in motion. ⚡",
    "Excellence is earned one frame at a time. 🔄",
    "Focus on improvement, not applause. 💪",
    "Train with purpose, roll with confidence. 🏁",
    "Every strike starts with belief. ✨",
    "The ball rolls where the mind guides. 🧠",
    "Hard work compounds faster than talent. 💥",
    "Consistency builds champions. ⚡",
    "The lane is your canvas — throw like an artist. 🌟",
    "Bowling is 100% practice, 100% patience. 🏋",
    "Success is patience in motion. 🚀",
    "Visualize, focus, execute. 🏁",
    "Every roll is a chance to improve. 💪",
    "Commitment is the backbone of greatness. 🔥",
    "Your mind sets the lane, your arm follows. 🧠🎯",
    "Pressure is opportunity in disguise. ⚡",
    "The perfect strike is born from persistence. 🎳",
    "Stay disciplined when others quit. 💥",
    "The journey to mastery is one frame at a time. 🏆",
    "Never underestimate practice over talent. 💪",
    "Bowling greatness is a habit, not luck. 🔄",
    "The lane rewards the relentless. 🎳",
    "Flow, focus, finish. 🏁",
    "Strike with vision, spare with patience. ⚡",
    "Your mind throws the ball before your arm does. 🧠",
    "Train hard, stay humble, roll true. 💥",
    "Every frame is a chance to reset. 🚀",
    "Success is built on tiny daily wins. 🏆",
    "The mind controls the game; the body obeys. 🧠",
    "Bowling is a test of focus and persistence. 🎳",
    "Be fearless, stay consistent, roll strong. 💪",
    "Your effort today is the score tomorrow. 🔥",
    "Practice with intensity, play with confidence. ⚡",
    "One frame, one focus, one goal. 🎯",
    "Every strike starts with a single thought. 🧠🎳",
    "The best bowlers are masters of their mindset. 🏆",
    "Stay disciplined, stay rolling, stay winning. 💥",
    "Bowling is mental toughness in motion. ⚡",
    "Commit to the process, not just the pins. 🎳",
    "Your frame is your statement — roll it strong. 🚀"
  ];

  const quoteEl = document.getElementById("quote");
  if (quoteEl) {

    // Get today's date and time
    const today = new Date();

    // Calculate which day of the year it is (1-365)
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );

    // Pick which quote to show by using remainder (%) to loop through the list
    const index = dayOfYear % quotes.length;

    // Display the selected quote inside the HTML element
    quoteEl.textContent = quotes[index];
  }
});


// ===== Click Game for Details pop up ===== //
document.addEventListener('DOMContentLoaded', () => {
  const gameList = document.getElementById('gameList');
  const modal = document.getElementById('test-game-modal');

  const leagueTypes = ["2v2", "3v3", "4v4"];

  // Background for average display
  const avgColors = {
    "2v2": "#f0fff0",
    "3v3": "#fff5e0",
    "4v4": "#ffe0e0",
    "practice": "#ffe6eb" 
  };

  // == Calculate Average Score for a League or practice == //
  function calculateLeagueAvg(size) {

    // Filter games that match the league size or practice mode
    const leagueGames = games.filter(g =>
      (g.leagueSize === size || (size === 'practice' && g.mode === 'practice'))
    );

    // If there are no games, return "0.0" to avoid division by zero
    if (!leagueGames.length) return "0.0";

    // Sum all the scores of the filtered games 
    // If a game has no score, count it as 0
    const total = leagueGames.reduce((sum, g) => sum + (g.score || 0), 0);

    // Calculate the average and round to one decimal place
    return (total / leagueGames.length).toFixed(1);
  }

  // == When a game in the list is clicked == //
  gameList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    // Get the index of the clicked game and retrieve its data
    selectedGameIndex = parseInt(li.dataset.index);
    const game = games[selectedGameIndex];
    const modalContent = modal.querySelector('.modal-content');

    // Determine game type:
    // If it's a league game, keep its leagueSize (2v2, 3v3, 4v4)
    // If it's practice game, mark as "practice"
    // Otherwise, mark as null
    const leagueSize = leagueTypes.includes(game.leagueSize)
     ? game.leagueSize 
     : (game.mode === 'practice' ? 'practice' : null);
    const isDarkMode = document.body.classList.contains('dark-mode');

    // Build game details modal
    function buildGameDetails() {

      // Only show players icon for league games
      const showPlayersIcon = leagueTypes.includes(game.leagueSize);

      // Build and insert the modal HTML content dynamically
      modalContent.innerHTML = `
        <div class="modal-header">
          ${showPlayersIcon ? '<span id="players-icon" title="Players">👥</span>' 
            : '<span style="width:22px;"></span>'}
          <h2>Game Details</h2>
          <span id="delete-icon">🗑</span>
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
              border:2px solid ${leagueSize === '2v2' 
                ? '#2a7f2a' : leagueSize === '3v3' 
                ? '#e69500' : leagueSize === '4v4' 
                ? '#b22222' : '#e0405b'
              };
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

      // == Set date input == //
      const modalDateInput = modalContent.querySelector('#modal-date');
      const dateObj = new Date(game.date);
      const yyyy = dateObj.getFullYear();

      // Get month (0-based, so +1 to get a normal month number)
      let mm = dateObj.getMonth() + 1;
      let dd = dateObj.getDate();

      // Adds a leading 0 if month/day < 10
      if (mm < 10) mm = '0' + mm;
      if (dd < 10) dd = '0' + dd;
      modalDateInput.value = `${yyyy}-${mm}-${dd}`;

      // Set modal mode based on league size or game
      modal.dataset.mode = leagueSize || game.mode;
      modal.style.display = 'flex';
      modal.classList.remove('hidden');

      // Inputs styling and focus effect
      modalContent.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '#999';
        input.addEventListener('focus', () => input.style.borderColor = '#3d80ff');
        input.addEventListener('blur', () => input.style.borderColor = '#999');
      });

      // == Event listeners for icons and buttons == //
      const playersIcon = modalContent.querySelector('#players-icon');
      if (playersIcon) playersIcon.addEventListener('click', () => buildPlayersView());

      const deleteIcon = modalContent.querySelector('#delete-icon');
      if (deleteIcon) deleteIcon.addEventListener('click', () => showDeleteConfirm());

      const saveBtn = modalContent.querySelector('#modal-save');
      saveBtn.addEventListener('click', () => {
        const updatedGame = {

          // ...game copies all existing game data, then overwrite fields below
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

        // If a league size exists, update the displayed league average 
        if (leagueSize) {
          const avgSpan = modalContent.querySelector('.avg-display');
          if (avgSpan) avgSpan.textContent = calculateLeagueAvg(leagueSize);
        }

        modal.classList.add('hidden');
        modal.style.display = 'none';
      });

      // Close btn
      const closeModalBtn = modalContent.querySelector('#close-test-modal');
      closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      });


      // == Live average update == //
      const avgSpan = modalContent.querySelector('.avg-display');
      const scoreInput = modalContent.querySelector('#modal-score');

      // Make sure league size, display span, and score input exist before running
      if (leagueSize && avgSpan && scoreInput) {

        // When user types a score, update the average live
        scoreInput.addEventListener('input', () => {

          // Get current input as number, or 0 if empty
          const tempScore = parseInt(scoreInput.value) || 0;

          // Get all games from the same league (or practice mode)
          const leagueGames = games.filter(g => 
            (g.leagueSize === leagueSize || (leagueSize === 'practice' && g.mode === 'practice')));

          // Calculate total score (replace current game's score with typed one)
          const total = leagueGames.reduce((sum, g) => 
            sum + (g === game ? tempScore : g.score || 0), 0);

          // Show the new average with one decimal
          avgSpan.textContent = (total / leagueGames.length).toFixed(1);
        });
      }
    }

    // == Build players modal == //
    function buildPlayersView() {

      // Get number of players per team (e.g. "3v3" or default 2)
      const teamSize = parseInt(leagueSize?.charAt(0)) || 2;

      // Use saved players if they exist, else make empty slots
      const savedPlayers = game.players || { 
        teamA: Array(teamSize).fill(""), 
        teamB: Array(teamSize).fill("") 
      };

      // Create player input boxes for each team
      const teamInputs = (team, side) => savedPlayers[team]
        .map((p, i) => `<input type="text" id="${side}-${i}" placeholder="Player ${i + 1}" value="${p}"
         style="margin:4px; padding:8px; font-size:1rem; width:90%; border-radius:4px;">`)
        .join('');

      // Build modal layout with both teams and buttons
      modalContent.innerHTML = `
        <div class="modal-header" style="display:flex; align-items:center; justify-content:space-between;">
          <span id="back-to-details" title="Back">👈</span>
          <h2 style="margin:0;">Players</h2>
          <span style="width:22px;"></span>
        </div>

        <div class="players-container" style="display:flex; flex-direction:column; align-items:center;
         margin-top:10px;">
          <div class="team teamA" style="display:flex; flex-direction:column; align-items:center;">
          ${teamInputs('teamA', 'teamA')}</div>
          <div class="vs-text" style="margin:10px 0; font-weight:bold;">VS</div>
          <div class="team teamB" style="display:flex; flex-direction:column; align-items:center;">
          ${teamInputs('teamB', 'teamB')}</div>
        </div>

        <div class="button-row">
          <button id="save-players">Save</button>
          <button id="close-players">Close</button>
        </div>
      `;

      // == Player modal buttons == //
      // Back button -> return to game details
      const backBtn = modalContent.querySelector('#back-to-details');
      backBtn.addEventListener('click', () => buildGameDetails());

      // Get Save + Close buttons
      const saveBtn = modalContent.querySelector('#save-players');
      const closeBtn = modalContent.querySelector('#close-players');

      // Save players and return to details
      saveBtn.addEventListener('click', () => {

        // Collect player names from inputs
        const updatedPlayers = {
          teamA: savedPlayers.teamA.map((_, i) => modalContent.querySelector(`#teamA-${i}`).value),
          teamB: savedPlayers.teamB.map((_, i) => modalContent.querySelector(`#teamB-${i}`).value)
        };

        // Save to selected game and localStorage
        games[selectedGameIndex].players = updatedPlayers;
        localStorage.setItem(gamesKey, JSON.stringify(games));

        // Return to details view
        buildGameDetails();
      });

      // Close full modal instead of going back (Players Close)
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      });
    }

    buildGameDetails();
  });

  // == Single delete pop up == //
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

    // == Single delete pop up confirm == //
    confirmModal.querySelector('#confirm-cancel').addEventListener('click', () => confirmModal.remove());
    confirmModal.querySelector('#confirm-delete').addEventListener('click', () => {

    // Remove the game
    games.splice(selectedGameIndex, 1);
    localStorage.setItem(gamesKey, JSON.stringify(games));

    // Remove that game's frames (10 frames per game)
    const frames = JSON.parse(localStorage.getItem("leagueFrames") || "[]");
    frames.splice(selectedGameIndex * 10, 10);
    localStorage.setItem("leagueFrames", JSON.stringify(frames));

    // Update UI
    updateStats();
    renderGames();
    updateCircles();

    // 🔴 CLOSE BOTH POPUPS (THIS WAS MISSING)
    confirmModal.remove();              // close delete popup
    modal.classList.add('hidden');      // close game details modal
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

// ===== Yearly update ===== //
const footerYear = document.getElementById('footer-year');
if (footerYear) {
  const currentYear = new Date().getFullYear();
  footerYear.textContent = `© ${currentYear} Your Bowling Journey`;
}









// ====== FRAME STATS CIRCLES ======

// Load league data from localStorage
function loadLeagueData() {
  const storedFrames = localStorage.getItem('leagueFrames');
  return storedFrames ? JSON.parse(storedFrames) : [];
}

// ====== Calculate percentages ======
function calculateStats(frames) {
  let totalShots = 0;
  let strikeShots = 0;
  let spareShots = 0;
  let openShots = 0;

  frames.forEach(frame => {
    const { roll1, roll2, roll3 } = frame;

    const isStrikeFrame = roll1 === "X" || roll1 === 10;
    const isSpareFrame  = roll2 === "/";

    // Roll 1
    if (roll1 != null) {
      totalShots++;
      if (roll1 === "X" || roll1 === 10) {
        strikeShots++;
      } else if (!isStrikeFrame && !isSpareFrame) {
        openShots++;
      }
    }

    // Roll 2
    if (roll2 != null) {
      totalShots++;
      if (roll2 === "/") {
        spareShots++;
      } else if (!isStrikeFrame && !isSpareFrame) {
        openShots++;
      }
    }

    // Roll 3 (bonus roll only)
    if (roll3 != null) {
      totalShots++;
      if (roll3 === "X" || roll3 === 10) {
        strikeShots++;
      } else if (roll3 === "/") {
        spareShots++;
      }
      // bonus rolls are never open
    }
  });

  // 🔴 HARD NaN / divide-by-zero guard
  if (totalShots === 0) {
    return {
      strikePct: 0,
      sparePct: 0,
      openPct: 0
    };
  }

  return {
    strikePct: Math.round((strikeShots / totalShots) * 100),
    sparePct:  Math.round((spareShots  / totalShots) * 100),
    openPct:   Math.round((openShots   / totalShots) * 100),
  };
}

// ====== HELPER: Convert roll to number ======
function rollValue(roll) {
  if (roll === "X") return 10;
  if (roll === "/") return null; // handled separately
  return Number(roll) || 0;
}

// ====== Get stats for circle percentages ======
// ====== FRAME STATS CIRCLES ======

// Load league data from localStorage
function loadLeagueData() {
  const storedFrames = localStorage.getItem('leagueFrames');
  return storedFrames ? JSON.parse(storedFrames) : [];
}

// ====== Calculate percentages ======
function calculateStats(frames) {
  let totalShots = 0;
  let strikeShots = 0;
  let spareShots = 0;
  let openShots = 0;

  frames.forEach(frame => {
    const { roll1, roll2, roll3 } = frame;

    const isStrikeFrame = roll1 === "X" || roll1 === 10;
    const isSpareFrame  = roll2 === "/";

    // Roll 1
    if (roll1 != null) {
      totalShots++;
      if (roll1 === "X" || roll1 === 10) {
        strikeShots++;
      } else if (!isStrikeFrame && !isSpareFrame) {
        openShots++;
      }
    }

    // Roll 2
    if (roll2 != null) {
      totalShots++;
      if (roll2 === "/") {
        spareShots++;
      } else if (!isStrikeFrame && !isSpareFrame) {
        openShots++;
      }
    }

    // Roll 3 (bonus roll only)
    if (roll3 != null) {
      totalShots++;
      if (roll3 === "X" || roll3 === 10) {
        strikeShots++;
      } else if (roll3 === "/") {
        spareShots++;
      }
      // bonus rolls are never open
    }
  });

  // 🔴 HARD NaN / divide-by-zero guard
  if (totalShots === 0) {
    return {
      strikePct: 0,
      sparePct: 0,
      openPct: 0
    };
  }

  return {
    strikePct: Math.round((strikeShots / totalShots) * 100),
    sparePct:  Math.round((spareShots  / totalShots) * 100),
    openPct:   Math.round((openShots   / totalShots) * 100),
  };
}

// ====== HELPER: Convert roll to number ======
function rollValue(roll) {
  if (roll === "X") return 10;
  if (roll === "/") return null; // handled separately
  return Number(roll) || 0;
}

// ====== Get stats for circle percentages ======
function getStats() {
  const frames = JSON.parse(localStorage.getItem('leagueFrames') || "[]");
  let strikes = 0, spares = 0, opens = 0;

  frames.forEach((frame, index) => {
    const r1 = frame.roll1;
    const r2 = frame.roll2;
    const r3 = frame.roll3;

    // Frames 1-9
    if (index < 9) {
      if (r1 === "X" || r1 === 10) strikes++;
      else if (r2 === "/" || (rollValue(r1) + rollValue(r2) === 10)) spares++;
      else opens++;
    } 
    // 10th frame
    else {
      if (r1 === "X" || r1 === 10) strikes++;
      else if (r2 === "/" || (rollValue(r1) + rollValue(r2) === 10)) spares++;
      else opens++;
    }
  });

  const totalFrames = frames.length || 1; // avoid divide by zero
  return {
    strikePerc: Math.round((strikes / totalFrames) * 100),
    sparePerc:  Math.round((spares  / totalFrames) * 100),
    openPerc:   Math.round((opens   / totalFrames) * 100),
  };
}

// ====== Update circle UI ======
function setCircle(id, percent) {
  const container = document.getElementById(id);
  if (!container) return;

  const progress = container.querySelector('circle.progress');
  if (!progress) return;

  const radius = progress.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  progress.style.strokeDasharray = `${circumference} ${circumference}`;
  progress.style.strokeDashoffset =
    circumference - (percent / 100) * circumference;

  progress.style.transition = 'stroke-dashoffset 0.6s ease';
}

// ====== Update all circles ======
function updateCircles() {
  const stats = getStats();

  document.getElementById("strikePercent").textContent = `${stats.strikePerc}%`;
  document.getElementById("sparePercent").textContent  = `${stats.sparePerc}%`;
  document.getElementById("openPercent").textContent   = `${stats.openPerc}%`;

  setCircle("strikeCircle", stats.strikePerc);
  setCircle("spareCircle", stats.sparePerc);
  setCircle("openCircle", stats.openPerc);
}

// ====== Reset circles ======
function resetCircles() {
  document.getElementById("strikePercent").textContent = "0%";
  document.getElementById("sparePercent").textContent  = "0%";
  document.getElementById("openPercent").textContent   = "0%";

  setCircle("strikeCircle", 0);
  setCircle("spareCircle", 0);
  setCircle("openCircle", 0);
}

// ====== Initialize on DOM ready ======
document.addEventListener('DOMContentLoaded', () => {
  updateCircles();
});

game.js 

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

// Helper function
function rollValue(roll) {
  if (roll === "X") return 10;
  if (roll === "/") return null; // handled separately
  return Number(roll) || 0;
}

// ====== Update circle UI ======
function setCircle(id, percent) {
  const container = document.getElementById(id);
  if (!container) return;

  const progress = container.querySelector('circle.progress');
  if (!progress) return;

  const radius = progress.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  progress.style.strokeDasharray = `${circumference} ${circumference}`;
  progress.style.strokeDashoffset =
    circumference - (percent / 100) * circumference;

  progress.style.transition = 'stroke-dashoffset 0.6s ease';
}

// ====== Update all circles ======
function updateCircles() {
  const stats = getStats();

  document.getElementById("strikePercent").textContent = `${stats.strikePerc}%`;
  document.getElementById("sparePercent").textContent  = `${stats.sparePerc}%`;
  document.getElementById("openPercent").textContent   = `${stats.openPerc}%`;

  setCircle("strikeCircle", stats.strikePerc);
  setCircle("spareCircle", stats.sparePerc);
  setCircle("openCircle", stats.openPerc);
}

// ====== Reset circles ======
function resetCircles() {
  document.getElementById("strikePercent").textContent = "0%";
  document.getElementById("sparePercent").textContent  = "0%";
  document.getElementById("openPercent").textContent   = "0%";

  setCircle("strikeCircle", 0);
  setCircle("spareCircle", 0);
  setCircle("openCircle", 0);
}

// ====== Initialize on DOM ready ======
document.addEventListener('DOMContentLoaded', () => {
  updateCircles();
});

