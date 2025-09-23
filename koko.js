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


// === Heart === //

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
        
        // retrigger animation
        const icon = btn.querySelector("i");
        icon.classList.remove("pop");
        void icon.offsetWidth;
        icon.classList.add("pop");
      }

      countEl.textContent = count;
      localStorage.setItem(`like-count-${id}`, count);
    });
  });
});