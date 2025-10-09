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

// ---------- 1. Seed data ----------
const sampleBalls = [
  {
    id: "jack1",
    nickname: "Jackal",
    realname: "Motiv Jackal Onyx",
    image: "./images/Jackal.jpg",
    material: "Reactive Resin",
    weight: "15 lbs",
    color: "Black with red & gray",
    gotDate: "",
    gotBy: "",
    startDate: "",
    fixed: "",
    stars: 5,
    notes: "High hook potential, excellent backend",
    displayName: "nick",
    isHouseBall: false
  },
  {
    id: "greml1",
    nickname: "Gremlin",
    realname: "Roto Grip Gremlin",
    image: "./images/Gremlin.jpg",
    material: "Pearl Reactive",
    weight: "15 lbs",
    color: "Plum/Raisin/Tanzanite",
    gotDate: "",
    gotBy: "",
    startDate: "",
    fixed: "",
    stars: 4,
    notes: "Smooth motion, great for medium-heavy oil",
    displayName: "nick",
    isHouseBall: false
  }
];

/* =====================================================
   DOM READY
===================================================== */
window.addEventListener("DOMContentLoaded", () => {
  const ballGrid       = document.getElementById("ballGrid");
  const detailDrawer   = document.getElementById("ballDetails");
  const addNewBallBtn  = document.getElementById("addNewBallBtn");
  const deleteModal        = document.getElementById("deleteModal");
  const confirmDeleteBtn   = document.getElementById("confirmDelete");
  const cancelDeleteBtn    = document.getElementById("cancelDelete");
  const continueBtn        = document.getElementById("continueBtn");

  let ballData       = loadBalls();
  let deleteTargetId = null;
  let pickedBalls    = [];

  let gamePickMode = localStorage.getItem("pickMode") === "true";
  if (gamePickMode) localStorage.removeItem("pickMode");
  addNewBallBtn.style.display = gamePickMode ? "none" : "inline-block";
  continueBtn.style.display = gamePickMode ? "inline-block" : "none";

  /* =====================================================
     RENDER CARDS
===================================================== */
  function renderBallCards() {
    ballGrid.innerHTML = "";
    ballData.forEach((ball, i) => {
      const card = document.createElement("article");
      card.className = "ball-card";
      card.dataset.id = ball.id;
      card.dataset.index = i;

      const buttonHTML = gamePickMode
        ? `<button class="details-btn" data-id="${ball.id}">${pickedBalls.includes(ball.id) ? "Picked ✅" : "Pick Me!"}</button>`
        : `<button class="details-btn" data-id="${ball.id}">Details</button>`;

      card.innerHTML = `
        <div class="card-header">
          <div class="ball-photo-wrap">
            <img src="${ball.image || "images/placeholder.jpg"}" class="ball-photo" />
          </div>
          <button class="delete-btn" data-id="${ball.id}" aria-label="Delete ball">💣</button>
        </div>

        <div class="ball-rating">${getStars(ball.stars)}</div>

        <h3 class="ball-name">
          ${ball.displayName === "real" ? (ball.realname || "(No real name)") : (ball.nickname || "(No nickname)")}
        </h3>

        <hr class="card-divider" />
        ${buttonHTML}
      `;
      ballGrid.appendChild(card);
    });
  }

  renderBallCards();

  /* =====================================================
     EVENT LISTENERS
===================================================== */
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("details-btn")) {
      const id = e.target.dataset.id;
      if (gamePickMode) {
        togglePickSelection(id);
        const ball = ballData.find(b => b.id === id);
        if (ball) localStorage.setItem("selectedBall", ball.image || "images/placeholder.jpg");
      } else {
        const ball = ballData.find(b => b.id === id);
        if (ball) showBallDetails(ball);
      }
      return;
    }

    if (e.target.classList.contains("delete-btn")) {
      deleteTargetId = e.target.dataset.id;
      deleteModal.classList.remove("hidden");
      return;
    }

    if (e.target === confirmDeleteBtn) {
      if (deleteTargetId) {
        ballData = ballData.filter(b => b.id !== deleteTargetId);
        saveBalls();
        renderBallCards();
      }
      deleteModal.classList.add("hidden");
      return;
    }

    if (e.target === cancelDeleteBtn) {
      deleteTargetId = null;
      deleteModal.classList.add("hidden");
      return;
    }

    if (e.target.classList.contains("star")) {
      const card   = e.target.closest(".ball-card");
      const id     = card.querySelector(".details-btn").dataset.id;
      const ball   = ballData.find(b => b.id === id);
      const rating = Array.from(e.target.parentNode.children).indexOf(e.target) + 1;
      if (ball) {
        ball.stars = rating;
        saveBalls();
        renderBallCards();
      }
      return;
    }

    if (e.target.classList.contains("close-details")) {
      hideDrawer();
      return;
    }

    if (e.target.classList.contains("edit-btn") && detailDrawer.dataset.mode === "edit") {
      saveEditedBall(detailDrawer.dataset.id);
      return;
    }

    if (e.target.id === "saveNewBallBtn") saveNewBall();
  });

  addNewBallBtn.addEventListener("click", () => showNewBallForm());

  continueBtn.addEventListener("click", () => {
    localStorage.setItem("pickedBallsForGame", JSON.stringify(pickedBalls));
    if (pickedBalls.length > 0) {
      const lastSelected = ballData.find(b => b.id === pickedBalls[pickedBalls.length - 1]);
      if (lastSelected) localStorage.setItem("selectedBall", lastSelected.image || "images/placeholder.jpg");
    }
    pickedBalls = [];
    window.location.href = "game.html";
  });

  /* =====================================================
     HELPERS
===================================================== */
  function loadBalls() {
    try { return JSON.parse(localStorage.getItem("bowlVaultBalls")) || sampleBalls.slice(); }
    catch { localStorage.removeItem("bowlVaultBalls"); return sampleBalls.slice(); }
  }

  function saveBalls() { localStorage.setItem("bowlVaultBalls", JSON.stringify(ballData)); }

  function togglePickSelection(id) {
    if (pickedBalls.includes(id)) pickedBalls = pickedBalls.filter(x => x !== id);
    else if (pickedBalls.length < 3) pickedBalls.push(id);
    else return alert("You can only pick up to 3 balls!");
    renderBallCards();
  }

  function getStars(count = 0) {
    let html = "";
    for (let i = 1; i <= 5; i++) html += `<span class="star ${i <= count ? "filled" : ""}">${i <= count ? "★" : "☆"}</span>`;
    return html;
  }

  /* ---------------- DRAWER ---------------- */
  function showBallDetails(ball) {
    detailDrawer.dataset.mode = "edit";
    detailDrawer.dataset.id = ball.id;
    detailDrawer.innerHTML = `
      <button class="close-details" aria-label="Close details">👋</button>
      <label class="image-upload-label">
        <img src="${ball.image || "images/placeholder.jpg"}" id="detailPhoto" alt="${ball.nickname}" />
        <input type="file" id="imageUpload" accept="image/*" hidden />
      </label>
      <button class="remove-img-btn" id="removeImageBtn">⚓ Remove image</button>
      <div class="name-row">
        <span class="name-label">Display Name:</span>
        <div class="name-switch">
          <input type="radio" name="nameChoice" id="real${ball.id}" value="real" ${ball.displayName === "real" ? "checked" : ""} />
          <label class="option-left" for="real${ball.id}">Real</label>
          <input type="radio" name="nameChoice" id="nick${ball.id}" value="nick" ${ball.displayName !== "real" ? "checked" : ""}/>
          <label class="option-right" for="nick${ball.id}">Nick</label>
        </div>
      </div>
      <div class="details-meta">
        <li><span>Real Name:</span><input id="editReal"  value="${ball.realname || ""}"></li>
        <li><span>Nick Name:</span><input id="editNick"  value="${ball.nickname || ""}"></li>
      </div>
      <ul class="details-meta">
        <li><span>Ball Material:</span><input id="editMaterial" value="${ball.material || ""}"></li>
        <li><span>Ball Weight:</span><input id="editWeight" value="${ball.weight || ""}"></li>
        <li><span>Ball Color:</span><input id="editColor" value="${ball.color || ""}"></li>
        <li><span>When I Got It:</span><input id="editGotDate" value="${ball.gotDate || ""}"></li>
        <li><span>Got By / Cost:</span><input id="editGotBy" value="${ball.gotBy || ""}"></li>
        <li><span>Start Using:</span><input id="editStartDate" value="${ball.startDate || ""}"></li>
        <li><span>Got Fixed / Cost:</span><input id="editFixed" value="${ball.fixed || ""}"></li>
      </ul>
      <textarea id="editNotes" placeholder="Extra notes...">${ball.notes || ""}</textarea>
      <button class="edit-btn">Save Changes</button>
    `;
    detailDrawer.hidden = false;
    setTimeout(() => detailDrawer.classList.add("open"), 10);
    attachImageUpload(document.getElementById("detailPhoto"));
    document.getElementById("removeImageBtn").addEventListener("click", () => clearImage(document.getElementById("detailPhoto")));
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  }

  function hideDrawer() {
    detailDrawer.classList.remove("open");
    detailDrawer.hidden = true;
    detailDrawer.innerHTML = "";
    document.body.style.position = "";
    document.body.style.width = "";
  }

  /* ---------------- IMAGE UPLOAD FIX ---------------- */
  function attachImageUpload(imgEl) {
    const uploader = document.getElementById("imageUpload");
    uploader.addEventListener("change", async (evt) => {
      const file = evt.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        // Resize image on mobile-friendly size
        const resized = await resizeImage(file, 600); // max width 600px
        imgEl.src = resized;
        imgEl.dataset.newImage = resized;
      }
    });
  }

  function clearImage(imgEl) {
    imgEl.src = "images/placeholder.jpg";
    delete imgEl.dataset.newImage;
  }

  async function resizeImage(file, maxWidth) {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------------- NEW BALL & EDIT ---------------- */
  function showNewBallForm() {
    detailDrawer.dataset.mode = "new";
    detailDrawer.innerHTML = `
      <button class="close-details" aria-label="Close details">👋</button>
      <label class="image-upload-label">
        <img src="images/placeholder.jpg" id="detailPhoto" alt="" />
        <input type="file" id="imageUpload" accept="image/*" hidden />
      </label>

      <div class="name-row">
        <span class="name-label">Display Name:</span>
        <div class="name-switch">
          <input type="radio" name="nameChoice" id="realNew" value="real" checked />
          <label class="option-left" for="realNew">Real</label>
          <input type="radio" name="nameChoice" id="nickNew" value="nick" />
          <label class="option-right" for="nickNew">Nick</label>
        </div>
      </div>

      <div class="details-meta">
        <li><span>Real Name</span><input id="newReal"></li>
        <li><span>Nick Name</span><input id="newNick"></li>
      </div>

      <ul class="details-meta">
        <li><span>Ball Material</span><input id="newMaterial"></li>
        <li><span>Ball Weight</span><input id="newWeight"></li>
        <li><span>Ball Color</span><input id="newColor"></li>
        <li><span>When I Got It</span><input id="newGotDate"></li>
        <li><span>Got By / Cost</span><input id="newGotBy"></li>
        <li><span>Start Using</span><input id="newStartDate"></li>
        <li><span>Got Fixed / Cost</span><input id="newFixed"></li>
      </ul>

      <textarea id="newNotes" placeholder="Extra notes..."></textarea>
      <button id="saveNewBallBtn" class="edit-btn">Add Ball</button>
    `;
    
    detailDrawer.hidden = false;
    setTimeout(() => detailDrawer.classList.add("open"), 10);
    attachImageUpload(document.getElementById("detailPhoto"));
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  }

  function saveNewBall() {
    const newBall = {
      id: `ball${Date.now()}`,
      displayName: document.querySelector('input[name="nameChoice"]:checked')?.value || "nick",
      realname:  document.getElementById("newReal").value.trim(),
      nickname:  document.getElementById("newNick").value.trim(),
      material:  document.getElementById("newMaterial").value.trim(),
      weight:    document.getElementById("newWeight").value.trim(),
      color:     document.getElementById("newColor").value.trim(),
      gotDate:   document.getElementById("newGotDate").value.trim(),
      gotBy:     document.getElementById("newGotBy").value.trim(),
      startDate: document.getElementById("newStartDate").value.trim(),
      fixed:     document.getElementById("newFixed").value.trim(),
      notes:     document.getElementById("newNotes").value.trim(),
      stars:     0,
      image:     document.getElementById("detailPhoto").dataset.newImage || "images/placeholder.jpg",
      isHouseBall: false
    };

    ballData.push(newBall);
    saveBalls();
    hideDrawer();
    renderBallCards();
  }

  function saveEditedBall(id) {
  const ball = ballData.find(b => b.id === id);
  if (!ball) return;

  // Save text fields
  ball.displayName = document.querySelector('input[name="nameChoice"]:checked')?.value || "nick";
  ball.realname    = document.getElementById("editReal").value.trim();
  ball.nickname    = document.getElementById("editNick").value.trim();
  ball.material    = document.getElementById("editMaterial").value.trim();
  ball.weight      = document.getElementById("editWeight").value.trim();
  ball.color       = document.getElementById("editColor").value.trim();
  ball.gotDate     = document.getElementById("editGotDate").value.trim();
    ball.gotBy       = document.getElementById("editGotBy").value.trim();
    ball.startDate   = document.getElementById("editStartDate").value.trim();
    ball.fixed       = document.getElementById("editFixed").value.trim();
    ball.notes       = document.getElementById("editNotes").value.trim();

    // Save new image if uploaded
    const imgEl = document.getElementById("detailPhoto");
    if (imgEl && imgEl.dataset.newImage) {
      ball.image = imgEl.dataset.newImage;
    }

    saveBalls();
    hideDrawer();
    renderBallCards();
  }

  /* ===== SORTABLEJS DRAG & DROP ===== */
  const vaultGrid = document.getElementById("ballGrid");
  if (vaultGrid) {
    Sortable.create(vaultGrid, {
      animation: 150,
      ghostClass: 'dragging',
      handle: '.ball-photo-wrap',
      onEnd: function(evt) {
        const movedItem = ballData.splice(evt.oldIndex, 1)[0];
        ballData.splice(evt.newIndex, 0, movedItem);
        saveBalls();
        renderBallCards();
      }
    });
  }
});

