// Apply before first paint; storage restrictions must never block the app.
(() => {
  const key = 'assa-review-reply-theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  let chosen = saved === 'light' || saved === 'dark' ? saved : null;
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#181818' : '#f3f3f3';
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
  }
  apply(chosen || (system.matches ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.addEventListener('click', () => {
        chosen = button.dataset.themeChoice;
        apply(chosen);
        try { localStorage.setItem(key, chosen); } catch {}
      });
    });
  });
  system.addEventListener('change', () => { if (!chosen) apply(system.matches ? 'dark' : 'light'); });
})();
