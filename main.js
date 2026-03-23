const revealElements = document.querySelectorAll("[data-reveal]");
const chips = document.querySelectorAll(".chip");
const searchInput = document.querySelector("#articleSearch");
const articleCards = document.querySelectorAll(".article-card");
const emptyState = document.querySelector("#emptyState");

let currentFilter = "all";
let currentQuery = "";

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.16 }
);

revealElements.forEach((element, index) => {
  element.style.transitionDelay = `${index * 35}ms`;
  revealObserver.observe(element);
});

const normalize = (value) => (value || "").toLowerCase().trim();

const renderCards = () => {
  let visibleCount = 0;

  articleCards.forEach((card) => {
    const category = card.dataset.category || "";
    const keywords = normalize(card.dataset.keywords);
    const text = normalize(card.textContent);

    const categoryMatch = currentFilter === "all" || currentFilter === category;
    const queryMatch =
      !currentQuery || keywords.includes(currentQuery) || text.includes(currentQuery);

    const show = categoryMatch && queryMatch;
    card.classList.toggle("hidden", !show);

    if (show) {
      visibleCount += 1;
    }
  });

  if (emptyState) {
    emptyState.classList.toggle("hidden", visibleCount > 0);
  }
};

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((button) => button.classList.remove("is-active"));
    chip.classList.add("is-active");
    currentFilter = chip.dataset.filter || "all";
    renderCards();
  });
});

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    currentQuery = normalize(event.target.value);
    renderCards();
  });
}

renderCards();
