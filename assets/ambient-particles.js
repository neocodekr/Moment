// Seasonal, non-interactive particles. Dates follow Korea Standard Time.
(() => {
  const layer = document.querySelector('.ambientParticles');
  if (!layer) return;

  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentSeason;

  function seasonInKorea() {
    const month = new Date(Date.now() + KST_OFFSET_MS).getUTCMonth() + 1;
    return month === 12 || month <= 2 ? 'winter' : 'autumn';
  }

  function renderParticles() {
    const season = seasonInKorea();
    if (season === currentSeason) return;
    currentSeason = season;
    layer.replaceChildren();

    const isSnow = season === 'winter';
    const count = isSnow
      ? (reducedMotion ? 18 : window.innerWidth < 640 ? 28 : 52)
      : (reducedMotion ? 12 : window.innerWidth < 640 ? 17 : 28);
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      const flake = isSnow && i % 5 === 0;
      particle.className = isSnow
        ? 'ambientParticle snow' + (flake ? ' flake' : '')
        : 'ambientParticle ' + (i % 3 === 0 ? 'heart' : 'leaf');
      particle.style.setProperty('--x', ((i * 39.7 + 13) % 100) + '%');
      particle.style.setProperty('--y', ((i * 23.3 + 11) % 90) + '%');
      particle.style.setProperty('--size', (isSnow
        ? (flake ? 10 + (i * 3) % 8 : 4 + (i * 5) % 7)
        : 9 + (i * 7) % 12) + 'px');
      particle.style.setProperty('--duration', (isSnow ? 16 + (i * 3) % 18 : 14 + (i * 3) % 14) + 's');
      particle.style.setProperty('--delay', (-((i * 5.3) % 34)) + 's');
      particle.style.setProperty('--drift', ((i % 2 ? 1 : -1) * (18 + (i * 13) % 70)) + 'px');
      particle.style.setProperty('--sway', ((i % 2 ? -1 : 1) * (10 + (i * 7) % 45)) + 'px');
      particle.style.setProperty('--turn', ((i * 71) % 360) + 'deg');
      layer.appendChild(particle);
    }
  }

  function scheduleNextKoreanMidnight() {
    const msUntilMidnight = DAY_MS - ((Date.now() + KST_OFFSET_MS) % DAY_MS);
    window.setTimeout(() => {
      renderParticles();
      scheduleNextKoreanMidnight();
    }, msUntilMidnight + 1000);
  }

  renderParticles();
  scheduleNextKoreanMidnight();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderParticles();
  });
})();
