const revealElements = document.querySelectorAll("[data-reveal]");
const counter = document.querySelector("[data-count]");

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
  { threshold: 0.18 }
);

revealElements.forEach((element, index) => {
  element.style.transitionDelay = `${index * 70}ms`;
  revealObserver.observe(element);
});

if (counter) {
  const target = Number(counter.dataset.count) || 0;
  let current = 0;

  const tick = window.setInterval(() => {
    current += 1;
    counter.textContent = String(current);

    if (current >= target) {
      window.clearInterval(tick);
    }
  }, 140);
}
