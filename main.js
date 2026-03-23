const revealElements = document.querySelectorAll("[data-reveal]");
const chips = document.querySelectorAll(".chip");
const searchInput = document.querySelector("#articleSearch");
const articleCards = document.querySelectorAll(".article-card");
const emptyState = document.querySelector("#emptyState");
const topicCards = document.querySelectorAll(".topic-grid .topic-card");
const topicUpdatedAt = document.querySelector("#topicUpdatedAt");

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

const loadDailyTopics = async () => {
  if (!topicCards.length) {
    return;
  }

  try {
    const response = await fetch(`/data/daily-topics.json?v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const topics = Array.isArray(payload.topics) ? payload.topics.slice(0, 5) : [];

    topics.forEach((topic, index) => {
      const card = topicCards[index];
      if (!card) {
        return;
      }

      const titleEl = card.querySelector("h3");
      const descEl = card.querySelector("p");

      if (titleEl && topic.title) {
        titleEl.textContent = topic.title;
      }

      if (descEl && topic.summary) {
        descEl.textContent = topic.summary;
      }
    });

    if (topicUpdatedAt && payload.updated_at) {
      const updatedAt = payload.updated_at_kst || payload.updated_at;
      topicUpdatedAt.textContent = `최근 갱신: ${updatedAt} (KST 기준)`;
    }
  } catch (error) {
    if (topicUpdatedAt) {
      topicUpdatedAt.textContent = "일일 주제 데이터를 불러오지 못했습니다.";
    }
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
loadDailyTopics();
