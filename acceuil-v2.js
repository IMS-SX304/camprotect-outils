/* CamProtect — Acceuil V2 : sliders, onglets, icônes outils, apparition au scroll */
(function () {
  function init() {
    var hasSwiper = (typeof Swiper !== 'undefined');
    if (!hasSwiper) { console.error('[acceuil-v2] Swiper non chargé'); }

    /* ---- A) Slider "Notre sélection" (3 colonnes x 2 rangées) ---- */
    if (hasSwiper) try {
      document.querySelectorAll('.prod-swiper').forEach(function (el) {
        var outer = el.closest('.prod-swiper-outer') || el.parentElement;
        new Swiper(el, {
          slidesPerView: 1,
          grid: { rows: 2, fill: 'row' },
          spaceBetween: 16,
          rewind: true,
          autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
          navigation: {
            nextEl: outer.querySelector('.swiper-button-next'),
            prevEl: outer.querySelector('.swiper-button-prev')
          },
          pagination: { el: outer.querySelector('.swiper-pagination'), clickable: true },
          breakpoints: {
            768: { slidesPerView: 2, grid: { rows: 2, fill: 'row' }, spaceBetween: 16 },
            992: { slidesPerView: 3, grid: { rows: 2, fill: 'row' }, spaceBetween: 20 }
          }
        });
      });

      /* ---- B) Sliders des onglets (1 ligne, 4 par vue) ---- */
      var pvSliders = [];
      document.querySelectorAll('.pv-swiper').forEach(function (el) {
        var outer = el.closest('.prod-swiper-outer') || el.parentElement;
        pvSliders.push(new Swiper(el, {
          slidesPerView: 1.2,
          slidesPerGroup: 1,
          spaceBetween: 16,
          rewind: true,
          autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
          observer: true,
          observeParents: true,
          navigation: {
            nextEl: outer.querySelector('.swiper-button-next'),
            prevEl: outer.querySelector('.swiper-button-prev')
          },
          pagination: { el: outer.querySelector('.swiper-pagination'), clickable: true },
          breakpoints: {
            480: { slidesPerView: 2, slidesPerGroup: 2 },
            768: { slidesPerView: 3, slidesPerGroup: 3 },
            992: { slidesPerView: 4, slidesPerGroup: 4 }
          }
        }));
      });

      /* ---- C) Rotation automatique des onglets + "Voir tout" ---- */
      var urls = [
        'https://www.camprotect.fr/cameras-surveillance',
        'https://www.camprotect.fr/accessoires-enregistreurs-nvr-dvr',
        'https://www.camprotect.fr/alarme-ajax',
        'https://www.camprotect.fr/accessoires-videosurveillance'
      ];
      var viewall  = document.querySelector('.pv-viewall');
      var tabLinks = document.querySelectorAll('.pv-tablink');
      var pvSection = document.querySelector('.pv-section');
      var idx = 0, timer = null, autoClick = false;

      if (viewall && urls[0]) viewall.href = urls[0];

      function goTab(i) { autoClick = true; tabLinks[i].click(); autoClick = false; }
      function nextTab() { idx = (idx + 1) % tabLinks.length; goTab(idx); }
      function start() { if (!timer && tabLinks.length > 1) timer = setInterval(nextTab, 9000); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }

      tabLinks.forEach(function (link, i) {
        link.addEventListener('click', function () {
          idx = i;
          if (viewall && urls[i]) viewall.href = urls[i];
          setTimeout(function () { pvSliders.forEach(function (s) { s.update(); }); }, 60);
          if (!autoClick) { stop(); start(); }
        });
      });

      if (pvSection) {
        pvSection.addEventListener('mouseenter', stop);
        pvSection.addEventListener('mouseleave', start);
      }
      start();
    } catch (err) { console.error('[acceuil-v2] erreur slider :', err); }

    /* ---- D) Icônes du bloc outils gratuits ---- */
    var icons = [
      '<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="4" y="4" width="18" height="18" rx="2" stroke="#E85D04" stroke-width="2.5"/><rect x="26" y="4" width="18" height="18" rx="2" stroke="#E85D04" stroke-width="2.5"/><rect x="4" y="26" width="18" height="18" rx="2" stroke="#E85D04" stroke-width="2.5"/><rect x="26" y="26" width="18" height="18" rx="2" stroke="#E85D04" stroke-width="2.5"/><circle cx="13" cy="13" r="3" fill="#E85D04"/><line x1="26" y1="35" x2="44" y2="35" stroke="#E85D04" stroke-width="2.5" stroke-linecap="round"/><line x1="35" y1="26" x2="35" y2="44" stroke="#E85D04" stroke-width="2.5" stroke-linecap="round"/></svg>',
      '<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M24 4L8 10V24C8 33.4 15.2 42 24 44C32.8 42 40 33.4 40 24V10Z" stroke="#E85D04" stroke-width="2.5" stroke-linejoin="round"/><path d="M17 24L22 29L31 19" stroke="#E85D04" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      '<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="12" rx="3" stroke="#E85D04" stroke-width="2.5"/><rect x="8" y="22" width="32" height="12" rx="3" stroke="#E85D04" stroke-width="2.5"/><rect x="8" y="38" width="32" height="4" rx="2" fill="#E85D04"/><circle cx="36" cy="12" r="2.5" fill="#E85D04"/><circle cx="36" cy="28" r="2.5" fill="#E85D04"/></svg>'
    ];
    var byId = ['ti1', 'ti2', 'ti3'].map(function (id) { return document.getElementById(id); });
    if (byId.every(Boolean)) {
      byId.forEach(function (el, i) { el.innerHTML = icons[i]; });
    } else {
      document.querySelectorAll('.tools-icon-wrap').forEach(function (el, i) {
        if (icons[i]) el.innerHTML = icons[i];
      });
    }

    /* ---- E) Apparition au scroll (cascade) ---- */
    var groups = [
      { sel: '.cta-card',   items: '.cta-eyebrow, .cta-h2, .cta-sub, .cta-btn' },
      { sel: '.tools-grid', items: '.tools-card' }
    ];
    groups.forEach(function (g) {
      var sec = document.querySelector(g.sel);
      if (!sec) return;
      var items = sec.querySelectorAll(g.items);
      if (!items.length) return;
      items.forEach(function (el, i) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-40px)';
        el.style.transition = 'opacity .8s ease, transform .8s ease';
        el.style.transitionDelay = (i * 0.15) + 's';
      });
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            items.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
            setTimeout(function () { items.forEach(function (el) { el.style.transform = ''; }); }, 1400);
            obs.disconnect();
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
      obs.observe(sec);
    });

    /* ---- F) Bandeau marques : duplication pour boucle sans couture ---- */
    var mqTrack = document.querySelector('.mq-track');
    if (mqTrack && !mqTrack.dataset.mq) {
      mqTrack.dataset.mq = '1';
      var mqCount = mqTrack.children.length;
      if (mqCount) {
        mqTrack.innerHTML += mqTrack.innerHTML;
        var mqSetup = function () {
          var kids = mqTrack.children;
          var shift = kids[mqCount].offsetLeft - kids[0].offsetLeft; // largeur exacte d'un jeu
          if (shift > 0) {
            mqTrack.style.setProperty('--mq-shift', shift + 'px');
            // Vitesse constante (~70 px/s) quel que soit l'ecran
            mqTrack.style.animationDuration = Math.max(12, shift / 70) + 's';
          }
        };
        mqSetup();
        var mqTimer;
        window.addEventListener('resize', function () {
          clearTimeout(mqTimer);
          mqTimer = setTimeout(mqSetup, 200);
        });
      }
    }
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
