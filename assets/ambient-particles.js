// A small, non-interactive particle layer inspired by the Moment preview.
(() => {
  const layer = document.querySelector('.ambientParticles');
  if (!layer) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = reducedMotion ? 12 : (window.innerWidth < 640 ? 17 : 28);
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span');
    particle.className = 'ambientParticle ' + (i % 3 === 0 ? 'heart' : 'leaf');
    particle.style.setProperty('--x', ((i * 39.7 + 13) % 100) + '%');
    particle.style.setProperty('--y', ((i * 23.3 + 11) % 90) + '%');
    particle.style.setProperty('--size', (9 + (i * 7) % 12) + 'px');
    particle.style.setProperty('--duration', (14 + (i * 3) % 14) + 's');
    particle.style.setProperty('--delay', (-((i * 5.3) % 28)) + 's');
    particle.style.setProperty('--drift', ((i % 2 ? 1 : -1) * (18 + (i * 13) % 70)) + 'px');
    particle.style.setProperty('--turn', ((i * 71) % 360) + 'deg');
    layer.appendChild(particle);
  }
})();
