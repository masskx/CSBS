// Minimal screenshot lightbox. Everything else on the site works without JS.
(function () {
  var links = document.querySelectorAll('[data-lightbox]');
  if (!links.length) return;
  var box = document.createElement('div');
  box.className = 'lb';
  box.innerHTML = '<button type="button" aria-label="Close">&times;</button><img alt="">';
  document.body.appendChild(box);
  var img = box.querySelector('img');
  function close() { box.classList.remove('open'); document.body.style.overflow = ''; }
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      img.src = a.href;
      img.alt = a.querySelector('img').alt;
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  box.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
