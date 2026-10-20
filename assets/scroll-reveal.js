// Reveal each piece of content once as it enters the viewport.
(() => {
  if (!document.documentElement.classList.contains('js-reveal')) return;

  const showcase = document.querySelector('.featureShowcasePost');
  showcase?.classList.remove('reveal');
  document.querySelector('.showcaseTop')?.classList.add('reveal');
  document.querySelector('.themeFilters')?.classList.add('reveal');
  document.querySelector('.footerBrand')?.classList.add('reveal');
  document.querySelector('.neo')?.classList.add('reveal');

  const stagger = (selector, columns, step) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add('reveal');
      element.style.setProperty('--reveal-delay', `${(index % columns) * step}ms`);
    });
  };
  document.querySelector('.heroVisual')?.style.setProperty('--reveal-delay', '140ms');
  stagger('.featureCard', 3, 100);
  stagger('.showcaseShot', 2, 110);
  stagger('.themeCard', 4, 75);

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('on');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
})();
