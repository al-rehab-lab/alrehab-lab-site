/* ==========================================================================
   AL Rehab Medical Lab — App core
   ========================================================================== */
(function () {
  'use strict';

  const LAB = window.LAB;
  const CFG = LAB.config;
  const I18N = LAB.i18n;

  const LS = {
    lang: 'rehab_lang',
    theme: 'rehab_theme',
    feedback: 'rehab_feedback_v2'
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let lang = localStorage.getItem(LS.lang) || 'ar';

  /* ------------------------------------------------------------------ *
   * i18n
   * ------------------------------------------------------------------ */
  function t(key, fallback) {
    const entry = I18N[key];
    if (!entry) return fallback || key;
    return entry[lang] || entry.ar || fallback || key;
  }

  /** يقرأ قيمة ثنائية اللغة من كائن {ar, en} */
  function pick(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.ar || obj.en || '';
  }

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    $$('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n, el.textContent);
    });
    $$('[data-i18n-ph]').forEach(el => {
      el.setAttribute('placeholder', t(el.dataset.i18nPh));
    });
    $$('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', t(el.dataset.i18nTitle));
      el.setAttribute('aria-label', t(el.dataset.i18nTitle));
    });
    $$('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });

    // label اللغة في الزر
    $$('[data-lang-label]').forEach(el => {
      el.textContent = lang === 'ar' ? 'English' : 'العربية';
    });

    // meta description ديناميكي إن وُجد
    const md = $('meta[name="description"]');
    if (md && md.dataset.i18nAlt) {
      md.setAttribute('content', md.dataset.i18nAlt);
    }

    document.dispatchEvent(new CustomEvent('lang:changed', { detail: { lang } }));
  }

  function setLanguage(next) {
    lang = next === 'en' ? 'en' : 'ar';
    localStorage.setItem(LS.lang, lang);
    applyLanguage();
  }

  /* ------------------------------------------------------------------ *
   * Theme
   * ------------------------------------------------------------------ */
  function initTheme() {
    const saved = localStorage.getItem(LS.theme);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    syncThemeIcon();
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(LS.theme, next);
    syncThemeIcon();
  }
  function syncThemeIcon() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    $$('[data-theme-icon]').forEach(el => {
      el.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/></svg>';
    });
  }

  /* ------------------------------------------------------------------ *
   * روابط واتساب / الهاتف
   * ------------------------------------------------------------------ */
  function waUrl(message) {
    const base = 'https://wa.me/' + String(CFG.phone).replace(/\D/g, '');
    return message ? base + '?text=' + encodeURIComponent(message) : base;
  }
  function telUrl() { return 'tel:+' + String(CFG.phone).replace(/\D/g, ''); }

  function hydrateLinks() {
    $$('[data-wa]').forEach(el => {
      const key = el.dataset.wa;
      const custom = el.dataset.waMsg ? t(el.dataset.waMsg) : pick({
        ar: 'السلام عليكم، عايز أستفسر عن التحاليل والحجز في معامل الرحاب.',
        en: 'Hello, I would like to ask about tests and booking at AL Rehab Lab.'
      });
      el.href = waUrl(custom);
      el.target = '_blank';
      el.rel = 'noopener';
      if (key && key !== 'default') el.dataset.waKind = key;
    });
    $$('[data-tel]').forEach(el => {
      el.href = telUrl();
      const span = el.querySelector('[data-phone-label]');
      if (span) span.textContent = CFG.phoneDisplay;
    });
    $$('[data-mail]').forEach(el => {
      el.href = 'mailto:' + CFG.email;
      const span = el.querySelector('[data-email-label]');
      if (span) span.textContent = CFG.email;
    });
    // قسم سندنهور: واتساب برقم خاص بالفرع + خريطة الفرع + الهاتف الأرضي
    $$('[data-wa-sandanhour]').forEach(el => {
      const num = String(CFG.sandanhourPhone || CFG.phone || '').replace(/\D/g, '');
      const msg = t('sandanhour.waMsg', '');
      el.href = 'https://wa.me/' + num + (msg ? '?text=' + encodeURIComponent(msg) : '');
      el.target = '_blank';
      el.rel = 'noopener';
    });
    $$('[data-sandanhour-map]').forEach(el => {
      const br = (CFG.branches || []).find(b => b.id === 'sandanhour');
      if (br && br.map) el.href = br.map;
      el.target = '_blank';
      el.rel = 'noopener';
    });
    $$('[data-landline]').forEach(el => {
      const digits = String(CFG.landline || '').replace(/\D/g, '');
      if (!digits) { el.style.display = 'none'; return; }
      el.href = 'tel:' + digits;
      const span = el.querySelector('[data-landline-label]');
      if (span) span.textContent = digits.replace(/(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
    });
  }

  /* ------------------------------------------------------------------ *
   * أنيميشن الهيدر: شبكة ذرات/روابط كيميائية متحركة + قطرات دم لامعة عائمة
   * (كانفس خفيف خلف محتوى الهيدر — يُنشأ تلقائياً في كل الصفحات)
   * ------------------------------------------------------------------ */
  function initHeaderFx() {
    const header = $('.site-header');
    if (!header || header.querySelector('.header-fx')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'header-fx';
    canvas.setAttribute('aria-hidden', 'true');
    header.insertBefore(canvas, header.firstChild);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const LINK = 96;

    let W = 0, H = 0, atoms = [], drops = [], raf = null, last = 0, t = 0;

    function palette() {
      return document.documentElement.dataset.theme === 'dark'
        ? { atom: 'rgba(127,208,245,', link: 'rgba(127,208,245,', drop: ['#FF5B74', '#C8102E'] }
        : { atom: 'rgba(11,87,160,', link: 'rgba(11,87,160,', drop: ['#E63950', '#B00D26'] };
    }

    function build() {
      const rect = header.getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const n = Math.round(Math.min(46, Math.max(18, (W * H) / 16000)));
      atoms = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.16,
        r: 1.1 + Math.random() * 1.9,
        ph: Math.random() * Math.PI * 2
      }));

      const nd = Math.round(Math.min(7, Math.max(3, W / 260)));
      drops = Array.from({ length: nd }, (_, i) => ({
        x: (i + 0.5) * (W / nd) + (Math.random() - 0.5) * 60,
        y: H * (0.25 + Math.random() * 0.5),
        s: 3.4 + Math.random() * 3.2,
        drift: (Math.random() - 0.5) * 0.12,
        bobAmp: 3 + Math.random() * 5,
        bobSpd: 0.35 + Math.random() * 0.45,
        ph: Math.random() * Math.PI * 2,
        a: 0.35 + Math.random() * 0.4
      }));
    }

    function drawDrop(d, pal) {
      const y = d.y + Math.sin(t * d.bobSpd + d.ph) * d.bobAmp;
      const s = d.s;
      ctx.save();
      ctx.translate(d.x, y);
      const g = ctx.createLinearGradient(0, -s * 1.7, 0, s);
      g.addColorStop(0, pal.drop[0]);
      g.addColorStop(1, pal.drop[1]);
      ctx.globalAlpha = d.a;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.7);
      ctx.bezierCurveTo(s * 0.95, -s * 0.25, s * 0.85, s * 0.35, 0, s);
      ctx.bezierCurveTo(-s * 0.85, s * 0.35, -s * 0.95, -s * 0.25, 0, -s * 1.7);
      ctx.fill();
      // لمعة القطرة
      ctx.globalAlpha = d.a * 0.85;
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath();
      ctx.ellipse(-s * 0.28, -s * 0.05, s * 0.16, s * 0.3, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function step(ts) {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
      last = ts;
      t += dt;
      const pal = palette();
      ctx.clearRect(0, 0, W, H);

      // حركة الذرات + الروابط بينها
      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i];
        a.x += (a.vx + Math.sin(t * 0.5 + a.ph) * 0.05) * dt * 60;
        a.y += (a.vy + Math.cos(t * 0.4 + a.ph) * 0.04) * dt * 60;
        if (a.x < -8) a.x = W + 8; if (a.x > W + 8) a.x = -8;
        if (a.y < -8) a.y = H + 8; if (a.y > H + 8) a.y = -8;
        for (let j = i + 1; j < atoms.length; j++) {
          const b = atoms[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = pal.link + ((1 - Math.sqrt(d2) / LINK) * 0.35).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // رسم الذرات مع نبض خفيف
      atoms.forEach(a => {
        const tw = 0.55 + 0.45 * Math.sin(t * 1.4 + a.ph);
        ctx.fillStyle = pal.atom + (0.5 * tw).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        if (a.r > 2.2) {
          ctx.fillStyle = 'rgba(255,255,255,.55)';
          ctx.beginPath(); ctx.arc(a.x - a.r * 0.3, a.y - a.r * 0.3, a.r * 0.35, 0, Math.PI * 2); ctx.fill();
        }
      });
      // قطرات الدم العائمة
      drops.forEach(d => {
        d.x += d.drift * dt * 60;
        if (d.x < -16) d.x = W + 16; if (d.x > W + 16) d.x = -16;
        drawDrop(d, pal);
      });
    }

    function start() { if (!raf && !reduced) { last = 0; raf = requestAnimationFrame(step); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

    build();
    if (reduced) {
      t = 1;
      const pal = palette();
      ctx.clearRect(0, 0, W, H);
      atoms.forEach(a => { ctx.fillStyle = pal.atom + '0.4)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill(); });
      drops.forEach(d => drawDrop(d, pal));
      return;
    }
    start();

    let rz;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 180); }, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop())).observe(header);
    }
  }

  /* ------------------------------------------------------------------ *
   * Header / drawer / scroll
   * ------------------------------------------------------------------ */
  function initChrome() {
    const header = $('.site-header');
    const onScroll = () => {
      if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
      const top = $('.fab--top');
      if (top) top.classList.toggle('is-visible', window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const drawer = $('#drawer');
    const openBtn = $('#navToggle');
    const closeEls = $$('[data-drawer-close]');
    function openDrawer() {
      if (!drawer) return;
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      const first = drawer.querySelector('a, button');
      if (first) first.focus();
    }
    function closeDrawer() {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if (openBtn) openBtn.addEventListener('click', openDrawer);
    closeEls.forEach(el => el.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeDrawer();
        closeLightbox();
      }
    });

    // active nav
    const page = document.body.dataset.page;
    if (page) {
      $$('[data-nav]').forEach(a => {
        if (a.dataset.nav === page) a.classList.add('is-active');
      });
    }

    // back to top
    const top = $('.fab--top');
    if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // year
    $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  }

  /* ------------------------------------------------------------------ *
   * Reveal on scroll
   * ------------------------------------------------------------------ */
  function initReveal() {
    const els = $$('[data-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * دليل التحاليل
   * ------------------------------------------------------------------ */
  const testsState = { q: '', cat: 'all' };

  function fastingBadge(test) {
    const needs = test.category === 'fasting';
    const label = needs ? t('tests.fastingYes') : t('tests.fastingNo');
    return `<span class="badge-soft" style="color:${needs ? 'var(--warn)' : 'var(--ok)'};border-color:${needs ? 'rgba(178,107,0,.25)' : 'rgba(18,132,90,.25)'}">${needs ? '⏳' : '✓'} ${label}</span>`;
  }

  function testCard(test) {
    return `
      <article class="card card--hover test-card" data-reveal>
        <div class="test-card__top">
          <div class="test-card__emoji" aria-hidden="true">${test.icon}</div>
          <span class="test-card__cat">${pick(LAB.testCategories.find(c => c.id === test.category) || { ar: 'عام', en: 'General' })}</span>
        </div>
        <h3>${pick({ ar: test.ar, en: test.en })}</h3>
        <div class="test-card__rule">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>
          <span>${pick({ ar: test.ruleAr, en: test.ruleEn })}</span>
        </div>
        <div class="test-card__foot">
          ${fastingBadge(test)}
          <span class="test-card__price">${t('common.priceFrom')} ${test.price} <small>${t('common.egp')}</small></span>
        </div>
      </article>`;
  }

  function matches(test, q) {
    if (!q) return true;
    const hay = [test.ar, test.en, test.category, test.ruleAr, test.ruleEn].join(' ').toLowerCase();
    return q.split(/\s+/).filter(Boolean).every(w => hay.includes(w.toLowerCase()));
  }

  function renderTests() {
    const grids = $$('[data-tests-grid]');
    if (!grids.length) return;
    const list = LAB.tests.filter(x => (testsState.cat === 'all' || x.category === testsState.cat) && matches(x, testsState.q));
    grids.forEach(grid => {
      const limit = Number(grid.dataset.limit || 0);
      const shown = limit ? list.slice(0, limit) : list;
      grid.innerHTML = shown.length
        ? shown.map(testCard).join('')
        : `<div class="empty-state">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>
             <p>${t('tests.empty')}</p>
             <a class="btn btn--ghost btn--sm mt-16" href="${waUrl(t('tests.empty'))}" target="_blank" rel="noopener">${t('common.whatsapp')}</a>
           </div>`;
      const counter = $('[data-tests-count]');
      if (counter) counter.textContent = `${list.length} ${t('common.results')}`;
    });
    initReveal();
  }

  function initTests() {
    if (!$('[data-tests-grid]')) return;

    const catWrap = $('[data-tests-cats]');
    if (catWrap) {
      catWrap.innerHTML = LAB.testCategories.map(c => `
        <button class="filter-btn${c.id === testsState.cat ? ' is-active' : ''}" data-cat="${c.id}" type="button">${pick(c)}</button>
      `).join('');
      catWrap.addEventListener('click', e => {
        const btn = e.target.closest('[data-cat]');
        if (!btn) return;
        testsState.cat = btn.dataset.cat;
        $$('.filter-btn', catWrap).forEach(b => b.classList.toggle('is-active', b === btn));
        renderTests();
      });
    }

    $$('[data-tests-search]').forEach(input => {
      input.addEventListener('input', () => {
        testsState.q = input.value.trim();
        $$('[data-tests-search]').forEach(i => { if (i !== input) i.value = input.value; });
        renderTests();
      });
    });

    renderTests();
  }

  /* ------------------------------------------------------------------ *
   * معرض التوعية + Lightbox
   * ------------------------------------------------------------------ */
  const galleryState = { cat: 'all' };
  const CAT_LABEL = {
    services: 'gallery.catServices', guide: 'gallery.catGuide', tips: 'gallery.catTips',
    chronic: 'gallery.catChronic', women: 'gallery.catWomen', vitamins: 'gallery.catVitamins',
    fasting: 'gallery.catFasting'
  };

  function catLabel(id) {
    if (CAT_LABEL[id]) return t(CAT_LABEL[id]);
    const design = LAB.designs.find(d => d.category === id);
    return design ? pick({ ar: design.catAr, en: design.catEn }) : id;
  }

  function posterCard(d, limit) {
    const title = pick({ ar: d.ar, en: d.en });
    const desc = pick({ ar: d.descAr, en: d.descEn });
    return `
      <button class="poster" type="button" data-design="${d.id}" aria-label="${title}">
        <div class="poster__img">
          <img src="${d.image}" alt="${title}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
          <span class="poster__tag">${catLabel(d.category)}</span>
        </div>
        <div class="poster__body">
          <h3>${title}</h3>
          <p>${desc}</p>
        </div>
        <span class="poster__zoom" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6M11 8v6M8 11h6"/></svg>
        </span>
      </button>`;
  }

  function renderGallery() {
    $$('[data-gallery-grid]').forEach(grid => {
      const limit = Number(grid.dataset.limit || 0);
      let list = LAB.designs.filter(d => galleryState.cat === 'all' || d.category === galleryState.cat);
      if (limit) list = list.slice(0, limit);
      grid.innerHTML = list.map(d => posterCard(d)).join('');
    });
    initReveal();
    bindPosters();
  }

  function bindPosters() {
    $$('[data-design]').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => openLightbox(Number(btn.dataset.design)));
    });
  }

  function openLightbox(id) {
    const box = $('#lightbox');
    const d = LAB.designs.find(x => x.id === id);
    if (!box || !d) return;
    const title = pick({ ar: d.ar, en: d.en });
    const desc = pick({ ar: d.descAr, en: d.descEn });
    box.querySelector('[data-lb-img]').src = d.image;
    box.querySelector('[data-lb-img]').alt = title;
    box.querySelector('[data-lb-tag]').textContent = catLabel(d.category);
    box.querySelector('[data-lb-title]').textContent = title;
    box.querySelector('[data-lb-desc]').textContent = desc;
    const wa = box.querySelector('[data-lb-wa]');
    if (wa) wa.href = waUrl(title + ' — ' + CFG.fullAr);
    const copy = box.querySelector('[data-lb-copy]');
    if (copy) {
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(title + '\n' + desc + '\n' + CFG.fullAr);
          copy.textContent = t('gallery.copied');
          setTimeout(() => copy.textContent = t('gallery.copy'), 1800);
        } catch (_) { /* ignore */ }
      };
    }
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const box = $('#lightbox');
    if (!box) return;
    box.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initGallery() {
    if (!$('[data-gallery-grid]')) return;
    const wrap = $('[data-gallery-cats]');
    if (wrap) {
      const cats = [{ id: 'all', ar: 'كل التصاميم', en: 'All posts' }].concat(
        Array.from(new Set(LAB.designs.map(d => d.category))).map(id => {
          const d = LAB.designs.find(x => x.category === id);
          return { id, ar: d.catAr, en: d.catEn };
        })
      );
      wrap.innerHTML = cats.map(c => `<button class="filter-btn${c.id === 'all' ? ' is-active' : ''}" data-gcat="${c.id}" type="button">${pick(c)}</button>`).join('');
      wrap.addEventListener('click', e => {
        const btn = e.target.closest('[data-gcat]');
        if (!btn) return;
        galleryState.cat = btn.dataset.gcat;
        $$('.filter-btn', wrap).forEach(b => b.classList.toggle('is-active', b === btn));
        renderGallery();
      });
    }
    const box = $('#lightbox');
    if (box) {
      $$('[data-lb-close]', box).forEach(el => el.addEventListener('click', closeLightbox));
    }
    renderGallery();
    document.addEventListener('lang:changed', renderGallery);
  }

  /* ------------------------------------------------------------------ *
   * النصائح
   * ------------------------------------------------------------------ */
  const tipsState = { cat: 'all' };

  function tipCard(tip) {
    const data = tip[lang] || tip.ar;
    return `
      <article class="card card--hover tip-card" data-reveal>
        <div class="tip-card__head">
          <span class="tip-card__emoji" aria-hidden="true">${tip.icon}</span>
          <span class="badge-soft">${pick(LAB.tipCategories.find(c => c.id === tip.category) || { ar: 'نصيحة', en: 'Tip' })}</span>
        </div>
        <h3>${data.title}</h3>
        <p>${data.text}</p>
        <div class="tip-note"><span aria-hidden="true">💡</span><span>${data.note}</span></div>
      </article>`;
  }

  function renderTips() {
    $$('[data-tips-grid]').forEach(grid => {
      const limit = Number(grid.dataset.limit || 0);
      let list = LAB.tips.filter(x => tipsState.cat === 'all' || x.category === tipsState.cat);
      if (limit) list = list.slice(0, limit);
      grid.innerHTML = list.map(tipCard).join('');
    });
    initReveal();
  }

  function initTips() {
    if (!$('[data-tips-grid]')) return;
    const wrap = $('[data-tips-cats]');
    if (wrap) {
      wrap.innerHTML = LAB.tipCategories.map(c => `<button class="filter-btn${c.id === 'all' ? ' is-active' : ''}" data-tcat="${c.id}" type="button">${pick(c)}</button>`).join('');
      wrap.addEventListener('click', e => {
        const btn = e.target.closest('[data-tcat]');
        if (!btn) return;
        tipsState.cat = btn.dataset.tcat;
        $$('.filter-btn', wrap).forEach(b => b.classList.toggle('is-active', b === btn));
        renderTips();
      });
    }
    renderTips();
    document.addEventListener('lang:changed', renderTips);
  }

  /* ------------------------------------------------------------------ *
   * التعاقدات
   * ------------------------------------------------------------------ */
  const contractsState = { group: 'all' };
  function contractCard(c) {
    const markClass = c.group === 'government' ? '' : c.group === 'corporate' ? 'logo-chip__mark--blue' : 'logo-chip__mark--red';
    const markInner = c.logo
      ? `<img src="${c.logo}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:9px;background:#fff">`
      : c.mark;
    return `
      <article class="card card--hover" data-reveal>
        <div class="flex items-center gap-12 mb-16">
          <div class="logo-chip__mark ${markClass}" aria-hidden="true">${markInner}</div>
          <div>
            <h3 style="font-size:15px">${pick({ ar: c.ar, en: c.en })}</h3>
            <small class="text-muted text-xs">${pick(LAB.contractGroups.find(g => g.id === c.group) || { ar: '', en: '' })}</small>
          </div>
        </div>
        <p class="mb-16">${pick({ ar: c.detailAr, en: c.detailEn })}</p>
        <div class="flex items-center justify-between gap-12 wrap">
          <span class="discount">${c.discount} <small>${t('contracts.discount')}</small></span>
          <span class="text-xs text-muted">${t('contracts.staffOnly')}</span>
        </div>
      </article>`;
  }
  function renderContracts() {
    $$('[data-contracts-grid]').forEach(grid => {
      const list = LAB.contracts.filter(c => contractsState.group === 'all' || c.group === contractsState.group);
      grid.innerHTML = list.map(contractCard).join('');
    });
    initReveal();
  }
  function initContracts() {
    if (!$('[data-contracts-grid]')) return;
    const wrap = $('[data-contracts-cats]');
    if (wrap) {
      wrap.innerHTML = LAB.contractGroups.map(g => `<button class="filter-btn${g.id === 'all' ? ' is-active' : ''}" data-cgroup="${g.id}" type="button">${pick(g)}</button>`).join('');
      wrap.addEventListener('click', e => {
        const btn = e.target.closest('[data-cgroup]');
        if (!btn) return;
        contractsState.group = btn.dataset.cgroup;
        $$('.filter-btn', wrap).forEach(b => b.classList.toggle('is-active', b === btn));
        renderContracts();
      });
    }
    renderContracts();
    document.addEventListener('lang:changed', renderContracts);
  }

  /* ------------------------------------------------------------------ *
   * الأسئلة الشائعة
   * ------------------------------------------------------------------ */
  function initFaq() {
    const wrap = $('[data-faq]');
    if (!wrap) return;
    wrap.addEventListener('click', e => {
      const btn = e.target.closest('.faq__btn');
      if (!btn) return;
      const item = btn.closest('.faq__item');
      const panel = item.querySelector('.faq__panel');
      const open = item.classList.toggle('is-open');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('lang:changed', () => {
      $$('.faq__item.is-open .faq__panel').forEach(p => { p.style.maxHeight = p.scrollHeight + 'px'; });
    });
  }

  /* ------------------------------------------------------------------ *
   * الأرقام في البانر (تُقرأ من المحتوى)
   * ------------------------------------------------------------------ */
  function renderHeroStats() {
    const wrap = $('[data-hero-stats]');
    if (!wrap) return;
    const list = (CFG.stats && CFG.stats.length) ? CFG.stats : [];
    wrap.innerHTML = list.map(s => {
      const raw = String(s.value || '0');
      const digits = raw.replace(/[^\d]/g, '');
      const prefix = raw.trim().startsWith('+') ? '+' : '';
      return `<div class="hero__stat">
        <b data-count-to="${prefix}${digits}">${pick({ ar: s.value, en: s.value })}</b>
        <span>${pick({ ar: s.ar, en: s.en })}</span>
      </div>`;
    }).join('');
  }

  /* ------------------------------------------------------------------ *
   * الفروع
   * ------------------------------------------------------------------ */
  function renderBranches() {
    $$('[data-branches]').forEach(grid => {
      grid.innerHTML = CFG.branches.map(b => `
        <article class="card branch" data-reveal>
          <div class="branch__map">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>
          </div>
          <h3>${pick({ ar: b.ar, en: b.en })}</h3>
          <div class="branch__row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>
            <span>${pick({ ar: b.addressAr, en: b.addressEn })}</span>
          </div>
          <div class="branch__row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>
            <span>${t('common.hours')}</span>
          </div>
          <div class="flex gap-8 wrap mt-16">
            <a class="btn btn--ghost btn--sm" href="${b.map}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 20l-6 1V6l6-1m0 15l6 1m-6-1V5m6 16l6 1V7l-6-1m0 14V6m0 0l-6-1"/></svg>
              ${t('common.openMap')}
            </a>
            <a class="btn btn--wa btn--sm" href="${waUrl()}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.05-.52-.099-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              ${t('common.bookVisit')}
            </a>
          </div>
        </article>`).join('');
      initReveal();
    });
  }

  /* ------------------------------------------------------------------ *
   * نموذج الآراء والشكاوى
   * ------------------------------------------------------------------ */
  function feedbackStore() {
    try { return JSON.parse(localStorage.getItem(LS.feedback) || '[]'); } catch (_) { return []; }
  }
  function saveFeedback(entry) {
    const list = feedbackStore();
    list.unshift(entry);
    localStorage.setItem(LS.feedback, JSON.stringify(list.slice(0, 60)));
  }

  function buildFeedbackMessage(f) {
    const typeMap = { opinion: { ar: 'رأي وتجربة', en: 'Opinion' }, suggestion: { ar: 'اقتراح تطوير', en: 'Suggestion' }, complaint: { ar: 'شكوى', en: 'Complaint' } };
    const lines = [
      '📋 رسالة من موقع معامل الرحاب',
      'النوع: ' + pick(typeMap[f.type] || typeMap.opinion),
      'الفرع: ' + (f.branch || pick({ ar: 'عام', en: 'General' })),
      f.rating ? 'التقييم: ' + f.rating + '/5 ⭐' : '',
      '',
      'الرسالة:',
      f.text,
      '',
      'الاسم: ' + (f.name || pick({ ar: 'مجهول', en: 'Anonymous' })),
      'الهاتف: ' + (f.phone || pick({ ar: 'غير مذكور', en: 'Not provided' }))
    ].filter(Boolean);
    return lines.join('\n');
  }

  function initFeedbackForm() {
    const form = $('#feedbackForm');
    if (!form) return;

    // channel availability — يظهر «الإرسال المباشر» فقط لو فيه Formspree ID
    const directOpt = form.querySelector('[data-channel-opt="direct"]');
    if (directOpt && !CFG.formspreeId) {
      directOpt.remove();
      const first = form.querySelector('input[name="channel"]');
      if (first) first.checked = true;
    } else if (directOpt && CFG.formspreeId) {
      const directInput = directOpt.querySelector('input[name="channel"]');
      if (directInput) directInput.checked = true;
    }

    const anon = form.querySelector('[data-anon]');
    const nameWrap = form.querySelector('[data-contact-fields]');
    if (anon && nameWrap) {
      anon.addEventListener('change', () => {
        nameWrap.style.display = anon.checked ? 'none' : '';
        if (anon.checked) {
          const n = form.querySelector('[name="name"]');
          const p = form.querySelector('[name="phone"]');
          if (n) n.value = '';
          if (p) p.value = '';
        }
      });
    }

    // star rating
    const ratingWrap = form.querySelector('[data-rating]');
    let rating = 0;
    if (ratingWrap) {
      ratingWrap.addEventListener('change', e => {
        if (e.target.name === 'rating') rating = Number(e.target.value);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('[data-status]');
      const setStatus = (html, kind) => {
        if (!status) return;
        status.className = 'form-status is-visible notice notice--' + (kind || 'info');
        status.innerHTML = html;
      };

      const text = (form.querySelector('[name="message"]') || {}).value || '';
      if (!text.trim()) { setStatus(t('fb.mustWrite'), 'warn'); return; }

      const type = (form.querySelector('input[name="type"]:checked') || {}).value || 'opinion';
      const branchSel = form.querySelector('[name="branch"]');
      const branch = branchSel ? branchSel.options[branchSel.selectedIndex].textContent : '';
      const isAnon = anon ? anon.checked : false;
      const name = isAnon ? '' : ((form.querySelector('[name="name"]') || {}).value || '').trim();
      const phone = isAnon ? '' : ((form.querySelector('[name="phone"]') || {}).value || '').trim();
      const channel = (form.querySelector('input[name="channel"]:checked') || {}).value || CFG.feedbackPrefChannel;

      const entry = {
        type, branch, text: text.trim(), name, phone, rating,
        date: new Date().toISOString(), channel
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        if (channel === 'whatsapp') {
          saveFeedback(entry);
          window.open(waUrl(buildFeedbackMessage(entry)), '_blank', 'noopener');
          setStatus('✅ ' + t('fb.okWa'), 'ok');
          form.reset();
          if (anon) anon.dispatchEvent(new Event('change'));
        } else if (channel === 'email') {
          saveFeedback(entry);
          const subject = encodeURIComponent('رسالة من موقع معامل الرحاب — ' + type);
          const body = encodeURIComponent(buildFeedbackMessage(entry));
          window.location.href = `mailto:${CFG.feedbackEmail}?subject=${subject}&body=${body}`;
          setStatus('✅ ' + t('fb.okMail'), 'ok');
        } else if (channel === 'direct' && CFG.formspreeId) {
          setStatus(t('fb.sending'), 'info');
          const res = await fetch('https://formspree.io/f/' + CFG.formspreeId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              _subject: 'رسالة جديدة من موقع المعمل',
              ...entry,
              message: entry.text
            })
          });
          if (!res.ok) throw new Error('formspree');
          saveFeedback(entry);
          setStatus('✅ ' + t('fb.okFormspree'), 'ok');
          form.reset();
        } else {
          setStatus(t('fb.mustChoose'), 'warn');
        }
      } catch (err) {
        const wa = waUrl(buildFeedbackMessage(entry));
        setStatus('⚠️ ' + t('fb.err') + ' <a href="' + wa + '" target="_blank" rel="noopener" style="text-decoration:underline;font-weight:900">' + t('fb.errWa') + '</a>', 'warn');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        renderRecentFeedback();
      }
    });

    renderRecentFeedback();
  }

  function renderRecentFeedback() {
    const wrap = $('[data-recent-feedback]');
    if (!wrap) return;
    const list = feedbackStore().slice(0, 5);
    if (!list.length) { wrap.innerHTML = ''; return; }
    const typeLabel = { opinion: t('fb.typeOpinion'), suggestion: t('fb.typeSuggestion'), complaint: t('fb.typeComplaint') };
    wrap.innerHTML = `
      <div class="divider"></div>
      <h4 style="font-size:13px;margin-bottom:10px">${t('fb.recentTitle')}</h4>
      <div class="stack" style="--gap:8px">
        ${list.map(f => `
          <div class="card" style="padding:12px 14px">
            <div class="flex justify-between items-center gap-8 wrap text-xs" style="margin-bottom:6px">
              <span class="badge-soft">${typeLabel[f.type] || f.type}</span>
              <span class="text-muted">${new Date(f.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</span>
            </div>
            <p style="font-size:12.5px;color:var(--body)">${escapeHtml(f.text).slice(0, 160)}</p>
          </div>`).join('')}
      </div>`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
  }

  /* ------------------------------------------------------------------ *
   * نموذج حجز الزيارة المنزلية
   * ------------------------------------------------------------------ */
  function initVisitForm() {
    const form = $('#visitForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const get = n => (form.querySelector(`[name="${n}"]`) || {}).value || '';
      const name = get('vname').trim();
      const phone = get('vphone').trim();
      const area = get('varea').trim();
      const date = get('vdate');
      const slotSel = form.querySelector('[name="vslot"]');
      const slot = slotSel ? slotSel.options[slotSel.selectedIndex].textContent : '';
      const tests = get('vtests').trim();
      const notes = get('vnotes').trim();

      if (!name || !phone) {
        form.reportValidity();
        return;
      }

      const msg = [
        '🏠 طلب زيارة منزلية — معامل الرحاب',
        'الاسم: ' + name,
        'الهاتف: ' + phone,
        'المنطقة/العنوان: ' + area,
        date ? 'التاريخ المطلوب: ' + date : '',
        slot ? 'الوقت المفضل: ' + slot : '',
        tests ? 'التحاليل المطلوبة: ' + tests : '',
        notes ? 'ملاحظات: ' + notes : ''
      ].filter(Boolean).join('\n');

      window.open(waUrl(msg), '_blank', 'noopener');
      const status = form.querySelector('[data-status]');
      if (status) {
        status.className = 'form-status is-visible notice notice--ok';
        status.textContent = '✅ ' + t('visit.ok');
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * أدوات صفحة التواصل: نسخ رقم الهاتف
   * ------------------------------------------------------------------ */
  function initMisc() {
    $$('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = btn.dataset.copy === 'phone' ? CFG.phoneDisplay : btn.dataset.copy === 'email' ? CFG.email : btn.dataset.copy;
        try {
          await navigator.clipboard.writeText(val);
          const old = btn.dataset.label || btn.textContent;
          btn.dataset.label = old;
          btn.textContent = t('gallery.copied');
          setTimeout(() => { btn.textContent = old; }, 1600);
        } catch (_) { /* ignore */ }
      });
    });

    // عدادات الأرقام في الهيرو
    $$('[data-count-to]').forEach(el => {
      const raw = el.dataset.countTo;
      const target = parseInt(raw.replace(/[^\d]/g, ''), 10);
      if (!target || !('IntersectionObserver' in window)) return;
      const prefix = raw.startsWith('+') ? '+' : '';
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          let start = 0;
          const step = Math.max(1, Math.round(target / 40));
          const tick = () => {
            start += step;
            if (start >= target) { el.textContent = prefix + target; return; }
            el.textContent = prefix + start;
            requestAnimationFrame(tick);
          };
          tick();
          io.unobserve(el);
        });
      }, { threshold: .5 });
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */
  function boot() {
    initTheme();
    applyLanguage();
    hydrateLinks();
    initChrome();
    initHeaderFx();
    initReveal();
    initTests();
    initGallery();
    initTips();
    initContracts();
    initFaq();
    renderBranches();
    renderHeroStats();
    initFeedbackForm();
    initVisitForm();
    initMisc();

    // تصحيح موضع روابط الأقسام (#...) بعد بناء المحتوى الديناميكي،
    // حتى تهبط الصفحة على القسم المطلوب بدقة (روابط المشاركة المباشرة)
    const fixHashLanding = () => {
      if (!location.hash) return;
      let target = null;
      try { target = document.querySelector(location.hash); } catch (e) { /* تجاهل */ }
      if (target) target.scrollIntoView();
    };
    fixHashLanding();
    window.addEventListener('load', () => setTimeout(fixHashLanding, 60));

    // language & theme buttons
    $$('[data-lang-toggle]').forEach(b => b.addEventListener('click', () => {
      setLanguage(lang === 'ar' ? 'en' : 'ar');
      hydrateLinks();
    }));
    $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggleTheme));

    // إعادة ربط الروابط عند تغيير اللغة
    document.addEventListener('lang:changed', () => {
      hydrateLinks();
      renderBranches();
      renderHeroStats();
      renderRecentFeedback();
    });
  }

  function start() {
    // نحاول تحميل المحتوى المعدّل من لوحة التحكم، وبعدها نشغّل الموقع
    Promise.resolve(LAB.loadContent ? LAB.loadContent() : false).then(() => boot());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // expose
  LAB.app = { t, pick, waUrl, telUrl, setLanguage, get lang() { return lang; } };
})();
