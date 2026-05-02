const revealElements = document.querySelectorAll("[data-reveal]");
const chips = document.querySelectorAll(".chip");
const searchInput = document.querySelector("#articleSearch");
const articleCards = document.querySelectorAll(".article-card");
const emptyState = document.querySelector("#emptyState");
const topicCards = document.querySelectorAll(".topic-grid .topic-card");
const topicUpdatedAt = document.querySelector("#topicUpdatedAt");
const authForm = document.querySelector("#authForm");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authMessage = document.querySelector("#authMessage");
const authSession = document.querySelector("#authSession");
const authUserEmail = document.querySelector("#authUserEmail");
const signInButton = document.querySelector("#signInButton");
const signUpButton = document.querySelector("#signUpButton");
const signOutButton = document.querySelector("#signOutButton");
const googleSignInButton = document.querySelector("#googleSignInButton");

let currentFilter = "all";
let currentQuery = "";
let supabaseClient = null;

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

const buildGoogleNewsUrl = (keyword) => {
  const query = encodeURIComponent(keyword || "");
  return `https://news.google.com/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
};

const setAuthMessage = (message, type = "info") => {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = message;
  authMessage.dataset.type = type;
};

const setAuthBusy = (isBusy) => {
  [signInButton, signUpButton, signOutButton, googleSignInButton].forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });
};

const isSupabaseConfigured = (config) => {
  return Boolean(
    config &&
      config.url &&
      config.publishableKey &&
      !config.url.includes("YOUR_PROJECT_REF") &&
      !config.publishableKey.includes("YOUR_SUPABASE_PUBLISHABLE_KEY")
  );
};

const renderAuthSession = (session) => {
  const email = session?.user?.email || "";

  if (authSession) {
    authSession.hidden = !email;
  }

  if (authUserEmail) {
    authUserEmail.textContent = email;
  }

  if (authForm) {
    authForm.classList.toggle("is-signed-in", Boolean(email));
  }
};

const initAuth = async () => {
  if (!authForm) {
    return;
  }

  const config = window.IDKWELL_SUPABASE;

  if (!isSupabaseConfigured(config)) {
    setAuthMessage("Supabase 프로젝트 URL과 publishable key를 먼저 설정하세요.", "error");
    setAuthBusy(true);
    return;
  }

  if (!window.supabase?.createClient) {
    setAuthMessage("Supabase 클라이언트를 불러오지 못했습니다.", "error");
    setAuthBusy(true);
    return;
  }

  supabaseClient = window.supabase.createClient(config.url, config.publishableKey);

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setAuthMessage(error.message, "error");
  } else {
    renderAuthSession(data.session);
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    renderAuthSession(session);
  });
};

const readAuthCredentials = () => {
  return {
    email: authEmail?.value.trim() || "",
    password: authPassword?.value || ""
  };
};

const signIn = async () => {
  if (!supabaseClient) {
    return;
  }

  const { email, password } = readAuthCredentials();
  setAuthBusy(true);
  setAuthMessage("로그인 중입니다.");

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  setAuthBusy(false);
  setAuthMessage(error ? error.message : "로그인되었습니다.", error ? "error" : "success");
};

const signUp = async () => {
  if (!supabaseClient) {
    return;
  }

  const { email, password } = readAuthCredentials();
  setAuthBusy(true);
  setAuthMessage("회원 가입을 처리 중입니다.");

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  setAuthBusy(false);
  setAuthMessage(
    error ? error.message : "가입 요청이 완료되었습니다. 인증 메일이 오면 확인하세요.",
    error ? "error" : "success"
  );
};

const signInWithGoogle = async () => {
  if (!supabaseClient) {
    return;
  }

  setAuthBusy(true);
  setAuthMessage("Google 로그인 화면으로 이동합니다.");

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    setAuthBusy(false);
    setAuthMessage(error.message, "error");
  }
};

const signOut = async () => {
  if (!supabaseClient) {
    return;
  }

  setAuthBusy(true);
  const { error } = await supabaseClient.auth.signOut();
  setAuthBusy(false);

  setAuthMessage(error ? error.message : "로그아웃되었습니다.", error ? "error" : "success");
};

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
      const linkEl = card.querySelector(".topic-news-link");

      if (titleEl && topic.title) {
        titleEl.textContent = topic.title;
      }

      if (descEl && topic.summary) {
        descEl.textContent = topic.summary;
      }

      if (linkEl) {
        const newsUrl = topic.news_url || buildGoogleNewsUrl(topic.title || "뉴스");
        linkEl.href = newsUrl;
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

if (authForm) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    signIn();
  });
}

if (signUpButton) {
  signUpButton.addEventListener("click", signUp);
}

if (signOutButton) {
  signOutButton.addEventListener("click", signOut);
}

if (googleSignInButton) {
  googleSignInButton.addEventListener("click", signInWithGoogle);
}

renderCards();
loadDailyTopics();
initAuth();
