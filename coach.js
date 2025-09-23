document.addEventListener('DOMContentLoaded', () => {
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const tipsSection = document.getElementById('tips-section');
  const categoriesContainer = document.getElementById('categories-container');

  // Initialize from localStorage for persistence
  let userHand = localStorage.getItem('userHand') || null;
  let userStyle = localStorage.getItem('userStyle') || null;

  const TIPS_PER_PAGE = 4;

  const expandedState = {};
  const categories = [
    "Footwork",
    "Lane Reading",
    "Release Technique",
    "Mental Game"
  ];

  // ===== INSERT YOUR TIPS DATA OBJECT HERE ===== //

  const tipsData = {
  // === 1-Handed lefties ===
    "left-1-handed-Footwork": [
    "Keep your steps smooth and consistent.",
    "Focus on balance during your approach.",
    "Practice timing your slide foot precisely.",
    "Avoid rushing your delivery."
  ],
  "left-1-handed-Lane Reading": [
    "Pay attention to how the oil pattern breaks down over time.",
    "Target boards on the lane rather than the pins for better precision.",
    "Adjust your starting position if the ball hooks too early or late.",
    "Watch how other left-handed bowlers' shots react on the lane."
  ],
  "left-1-handed-Release Technique": [
    "Maintain a relaxed grip to avoid grabbing the ball at release.",
    "Keep your wrist firm and avoid excessive turning.",
    "Work on a clean follow-through toward your target.",
    "Experiment with slight axis changes for different lane conditions."
  ],
  "left-1-handed-Mental Game": [
    "Focus on one shot at a time—don't dwell on past frames.",
    "Have a consistent pre-shot routine to calm nerves.",
    "Visualize your shot before stepping on the approach.",
    "Stay patient when adjusting to changing lane conditions."
  ],

  // === 1-Handed Righties ===
    "right-1-handed-Footwork": [
    "Maintain a smooth and steady pace throughout your approach.",
    "Keep your shoulders square toward your target.",
    "Finish with a strong, balanced slide on your left foot.",
    "Avoid overstepping — consistency in step length is key."
  ],
  "right-1-handed-Lane Reading": [
    "Focus on the arrows or boards, not the pins, for aiming.",
    "Adjust your line when you notice early or late hook.",
    "Use ball reaction in the mid-lane to judge oil breakdown.",
    "Observe other right-handers to anticipate lane transition."
  ],
    "right-1-handed-Release Technique": [
    "Keep a firm wrist through release for better control.",
    "Allow a natural hand rotation — don't over-turn.",
    "Follow through toward your target to improve accuracy.",
    "Experiment with lofting slightly to delay hook on heavy oil."
  ],
    "right-1-handed-Mental Game": [
    "Clear your mind before every shot with a consistent routine.",
    "Don’t dwell on mistakes — focus on the next delivery.",
    "Visualize your ideal ball path during setup.",
    "Stay calm under pressure and trust your adjustments."
  ],

  // === 2-Handed Lefties ===
    "left-2-handed-Footwork": [
    "Use a strong, athletic stance to start your approach.",
    "Keep your steps compact and powerful for better balance.",
    "Engage your legs to generate momentum without rushing.",
    "Finish with a stable slide to maintain shot accuracy."
  ],
    "left-2-handed-Lane Reading": [
    "Watch for early friction on the left side as it breaks down faster.",
    "Adjust your angles aggressively when lanes transition.",
    "Pay attention to where the ball picks up its roll in the mid-lane.",
    "Track your ball's motion off the breakpoint for consistency."
  ],
    "left-2-handed-Release Technique": [
    "Maintain both hands on the ball until just before release.",
    "Use your body rotation to help generate revs instead of forcing with the arms.",
    "Keep your swing smooth and avoid muscling the ball.",
    "Work on a consistent release point to improve control."
  ],
    "left-2-handed-Mental Game": [
    "Trust your physical game and avoid overthinking adjustments.",
    "Have a set plan for lane changes and stick to it until proven otherwise.",
    "Stay confident even if you leave challenging spares.",
    "Visualize the entire shot path before stepping on the approach."
  ],

  // === 2-Handed Righties ===
    "right-2-handed-Footwork": [
    "Keep your steps controlled and balanced to maintain accuracy.",
    "Use your legs to power the approach without rushing.",
    "Finish strong with a stable slide on your left foot.",
    "Practice consistency in your timing and step length."
  ],
    "right-2-handed-Lane Reading": [
    "Notice how the right side breaks down differently—adjust accordingly.",
    "Focus on the ball's reaction in the mid-lane for better reads.",
    "Make strategic lane adjustments as the oil pattern changes.",
    "Observe other right-handed two-handers for cues on lane transition."
  ],
    "right-2-handed-Release Technique": [
    "Hold the ball with both hands until the moment of release.",
    "Use body rotation to generate revs, not just arm strength.",
    "Keep a smooth swing and avoid forcing the ball.",
    "Aim for a consistent release point for accuracy and control."
  ],
    "right-2-handed-Mental Game": [
    "Trust your technique and avoid overthinking shot adjustments.",
    "Stick to your game plan unless the lane clearly demands change.",
    "Maintain confidence even when facing difficult spares.",
    "Visualize your shot path thoroughly before your approach."
  ]
};

  let changeSelectionBtn = null;

  // Show saved selection on load or show steps
  if (userHand && userStyle) {
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    showCategories(userHand, userStyle);
  } else {
    step1.classList.remove('hidden');
    step2.classList.add('hidden');
    tipsSection.classList.add('hidden');
  }

  document.querySelectorAll('#step-1 .choice-btn').forEach(button => {
    button.addEventListener('click', () => {
      userHand = button.dataset.hand;
      if (userHand) {
        localStorage.setItem('userHand', userHand);  // Save selection
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
      }
    });
  });

  document.querySelectorAll('#step-2 .choice-btn').forEach(button => {
    button.addEventListener('click', () => {
      userStyle = button.dataset.style;
      if (userStyle) {
        localStorage.setItem('userStyle', userStyle);  // Save selection
        step2.classList.add('hidden');
        showCategories(userHand, userStyle);
      }
    });
  });

  function showCategories(hand, style) {
    tipsSection.classList.remove('hidden');
    categoriesContainer.innerHTML = '';

    categories.forEach(category => {
      const card = document.createElement('div');
      card.classList.add('category-card');
      card.dataset.category = category;

      const header = document.createElement('div');
      header.classList.add('category-header');
      header.innerHTML = `<span>${category}</span><span>▶</span>`;
      card.appendChild(header);

      const content = document.createElement('div');
      content.classList.add('category-content');

      const tipsContainer = document.createElement('div');
      tipsContainer.classList.add('tips-container');
      content.appendChild(tipsContainer);

      const key = `${hand}-${style}-${category}`;
      const tips = tipsData[key] || ["No tips available for this category."];

      expandedState[category] = {
        page: 1,
        totalPages: Math.ceil(tips.length / TIPS_PER_PAGE),
        tips: tips
      };

      let pagination = null;
      if (expandedState[category].totalPages > 1) {
        pagination = document.createElement('div');
        pagination.classList.add('pagination-controls');

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Prev';
        prevBtn.disabled = true;

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';

        pagination.appendChild(prevBtn);
        pagination.appendChild(nextBtn);

        content.appendChild(pagination);

        prevBtn.addEventListener('click', () => {
          if (expandedState[category].page > 1) {
            expandedState[category].page--;
            updateTipsContent(tipsContainer, tips, expandedState[category].page);
            updatePaginationButtons(prevBtn, nextBtn, expandedState[category]);
          }
        });

        nextBtn.addEventListener('click', () => {
          if (expandedState[category].page < expandedState[category].totalPages) {
            expandedState[category].page++;
            updateTipsContent(tipsContainer, tips, expandedState[category].page);
            updatePaginationButtons(prevBtn, nextBtn, expandedState[category]);
          }
        });
      }

      updateTipsContent(tipsContainer, tips, 1);

      header.addEventListener('click', () => {
        card.classList.toggle('open');
      });

      card.appendChild(content);
      categoriesContainer.appendChild(card);
    });

    if (!changeSelectionBtn) {
      changeSelectionBtn = document.createElement('button');
      changeSelectionBtn.textContent = "Change Selection";
      changeSelectionBtn.classList.add('choice-btn');
      changeSelectionBtn.style.margin = '2rem auto 0 auto';
      changeSelectionBtn.style.display = 'block';
      changeSelectionBtn.style.background = '#ff5858';
      changeSelectionBtn.style.width = 'fit-content';

      changeSelectionBtn.addEventListener('click', () => {
        tipsSection.classList.add('hidden');
        categoriesContainer.innerHTML = '';
        userHand = null;
        userStyle = null;
        localStorage.removeItem('userHand');  // Clear saved
        localStorage.removeItem('userStyle'); // Clear saved
        step1.classList.remove('hidden');
        step2.classList.add('hidden');
        for (const cat in expandedState) {
          expandedState[cat].page = 1;
        }
        changeSelectionBtn.remove();
        changeSelectionBtn = null;
      });

      tipsSection.appendChild(changeSelectionBtn);
    }
  }

  function updateTipsContent(container, tips, page) {
    container.innerHTML = '';

    const start = (page - 1) * TIPS_PER_PAGE;
    const end = start + TIPS_PER_PAGE;
    const pageTips = tips.slice(start, end);

    pageTips.forEach(tip => {
      const tipCard = document.createElement('div');
      tipCard.classList.add('tip-card');
      tipCard.textContent = tip;
      container.appendChild(tipCard);
    });
  }

  function updatePaginationButtons(prevBtn, nextBtn, state) {
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= state.totalPages;
  }
});



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