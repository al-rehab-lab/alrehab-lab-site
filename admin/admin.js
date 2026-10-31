/* ==========================================================================
   AL Rehab Admin — App
   لوحة تحكم كاملة: تعديل كل المحتوى ثم حفظه في الريبو (GitHub) مباشرة
   ========================================================================== */
(function () {
  'use strict';
  const gh = window.GH;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const ARRAY_KEYS = ['tests', 'testCategories', 'tips', 'tipCategories', 'designs', 'contracts', 'contractGroups', 'faq'];
  const CONTENT_FILE = 'content.json';
  const SESSION_KEY = 'rehab_admin_session';

  let content = null;      // المحتوى الحالي (كائن كامل)
  let original = null;     // نسخة للمقارنة (كشف التعديلات)
  let dirty = false;
  let currentPanel = 'dashboard';

  /* ------------------------------------------------------------------ *
   * أدوات عامة
   * ------------------------------------------------------------------ */
  function toast(msg, kind) {
    let box = $('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.innerHTML = (kind === 'ok' ? '✅ ' : kind === 'err' ? '⚠️ ' : 'ℹ️ ') + msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
  }

  function setSaveUI(state) {
    const dots = state === 'dirty'
      ? '<span class="dot dot--dirty"></span> تعديلات غير محفوظة'
      : '<span class="dot"></span> كل التعديلات محفوظة';
    ['#saveState', '#saveStateBottom'].forEach(sel => {
      const st = $(sel);
      if (st) st.innerHTML = dots;
    });
    ['#saveAll', '#saveAllBottom'].forEach(sel => {
      const btn = $(sel);
      if (btn) btn.disabled = state !== 'dirty';
    });
  }

  function markDirty() { dirty = true; setSaveUI('dirty'); }
  function markClean() { dirty = false; setSaveUI('clean'); }

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ------------------------------------------------------------------ *
   * الدخول
   * ------------------------------------------------------------------ */
  function initLogin() {
    const cfg = gh.config();
    $('#ghOwner').value = cfg.owner || '';
    $('#ghRepo').value = cfg.repo || '';
    $('#ghBranch').value = cfg.branch || 'main';
    $('#ghToken').value = cfg.token || '';

    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#loginBtn');
      btn.disabled = true;
      btn.textContent = 'جارٍ التحقق…';
      gh.save({
        owner: $('#ghOwner').value,
        repo: $('#ghRepo').value,
        branch: $('#ghBranch').value,
        token: $('#ghToken').value
      });
      try {
        const info = await gh.verify();
        sessionStorage.setItem(SESSION_KEY, '1');
        toast('تم الاتصال بالريبو: ' + info.repo.full_name, 'ok');
        await enterApp();
      } catch (err) {
        toast(describeError(err), 'err');
        btn.disabled = false;
        btn.textContent = 'دخول لوحة التحكم';
      }
    });
  }

  function describeError(err) {
    const m = err && err.message;
    switch (m) {
      case 'BAD_TOKEN': return 'التوكن غير صحيح أو منتهي. اعمل توكن جديد وحدّثه.';
      case 'NOT_FOUND': return 'الريبو أو الفرع غير موجود. راجع اسم المستخدم والريبو والفرع.';
      case 'NO_TOKEN': return 'أدخل الـ Token أولاً.';
      case 'IS_DIR': return 'المسار المطلوب مجلد وليس ملفاً.';
      case 'FORBIDDEN': return 'التوكن لا يملك صلاحية الكتابة على هذا الريبو. لازم Fine-grained token بصلاحية Contents: Read and write.';
      default: return 'خطأ: ' + (m || 'غير معروف');
    }
  }

  /* ------------------------------------------------------------------ *
   * التحميل والحفظ
   * ------------------------------------------------------------------ */
  async function loadContent() {
    try {
      const file = await gh.getFile(CONTENT_FILE);
      content = JSON.parse(file.text);
      original = deepClone(content);
      markClean();
      return true;
    } catch (err) {
      if (err.message === 'NOT_FOUND') {
        toast('ملف content.json غير موجود في الريبو. ارفعه من تبويب "النسخ الاحتياطي" أولاً.', 'warn');
        content = window.LAB.snapshotContent ? window.LAB.snapshotContent() : null;
        if (!content) {
          // احتياطي: ابنِ من بيانات الموقع المحمّلة
          content = { config: deepClone(window.LAB.config), i18n: deepClone(window.LAB.i18n) };
          ARRAY_KEYS.forEach(k => { if (Array.isArray(window.LAB[k])) content[k] = deepClone(window.LAB[k]); });
        }
        original = deepClone(content);
        return false;
      }
      throw err;
    }
  }

  async function saveAll() {
    const btn = $('#saveAll');
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ…';
    try {
      content.updatedAt = new Date().toISOString();
      const text = JSON.stringify(content, null, 2);
      await gh.putFile(CONTENT_FILE, text, 'تحديث محتوى الموقع من لوحة التحكم');
      original = deepClone(content);
      markClean();
      toast('تم الحفظ ونشره على الموقع ✓ (يظهر خلال دقيقة)', 'ok');
    } catch (err) {
      toast('فشل الحفظ: ' + describeError(err), 'err');
      btn.disabled = false;
    } finally {
      btn.textContent = 'حفظ ونشر التعديلات';
      btn.disabled = !dirty;
    }
  }

  /* ------------------------------------------------------------------ *
   * التنقل
   * ------------------------------------------------------------------ */
  const PANELS = [
    { id: 'dashboard', title: 'نظرة عامة', sub: 'ملخص المحتوى وحالة الموقع', icon: 'grid' },
    { id: 'general', title: 'بيانات المعمل', sub: 'الاسم، الهاتف، الإيميل، المواعيد، الفروع', icon: 'settings' },
    { id: 'texts', title: 'نصوص الموقع', sub: 'تعديل أي عنوان أو جملة في كل الصفحات', icon: 'type' },
    { id: 'stats', title: 'أرقام وإحصائيات', sub: 'الأرقام الظاهرة في البانر', icon: 'bar' },
    { id: 'tests', title: 'دليل التحاليل', sub: 'إضافة/تعديل التحاليل والأسعار وشروط الصيام', icon: 'flask' },
    { id: 'tips', title: 'النصائح الطبية', sub: 'المقالات التوعوية', icon: 'bulb' },
    { id: 'designs', title: 'معرض التوعية', sub: 'بوسترات وصور التوعية', icon: 'image' },
    { id: 'contracts', title: 'التعاقدات', sub: 'الجهات والشركات ونسب الخصم واللوجوهات', icon: 'building' },
    { id: 'faq', title: 'الأسئلة الشائعة', sub: 'أسئلة وإجابات', icon: 'help' },
    { id: 'media', title: 'مكتبة الصور', sub: 'رفع وإدارة صور الموقع واللوجوهات', icon: 'folder' },
    { id: 'backup', title: 'نسخ احتياطي', sub: 'تصدير/استيراد المحتوى', icon: 'download' },
    { id: 'settings', title: 'إعدادات الاتصال', sub: 'GitHub والريبو والتوكن', icon: 'key' }
  ];

  const ICONS = {
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 7 2.6h.1A1.7 1.7 0 0 0 9 1.1V1a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 2.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    type: '<path d="M4 6h16M4 12h10M4 18h14"/>',
    bar: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    flask: '<path d="M9 3h6M10 3v7l-4.5 9A2 2 0 0 0 7.3 22h9.4a2 2 0 0 0 1.8-3L14 10V3"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-2 4 3"/>',
    building: '<path d="M4 21V6l8-3 8 3v15"/><path d="M9 21v-5h6v5M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3V13M12 17h.01"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',
    key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v4M21 12v3"/>'
  };

  function ic(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  function go(panel) {
    currentPanel = panel;
    $$('.side__link').forEach(a => a.classList.toggle('is-active', a.dataset.panel === panel));
    $$('.panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === panel));
    const meta = PANELS.find(p => p.id === panel);
    if (meta) {
      $('#panelTitle').textContent = meta.title;
      $('#panelSub').textContent = meta.sub;
    }
    location.hash = panel;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------ *
   * لوحة: نظرة عامة
   * ------------------------------------------------------------------ */
  function renderDashboard() {
    const c = content || {};
    const cfg = c.config || {};
    const stats = [
      { k: 'التحاليل', v: (c.tests || []).length, icon: 'flask' },
      { k: 'النصائح', v: (c.tips || []).length, icon: 'bulb' },
      { k: 'تصاميم التوعية', v: (c.designs || []).length, icon: 'image' },
      { k: 'التعاقدات', v: (c.contracts || []).length, icon: 'building' },
      { k: 'النصوص القابلة للتعديل', v: Object.keys(c.i18n || {}).length, icon: 'type' },
      { k: 'الفروع', v: (cfg.branches || []).length, icon: 'grid' },
      { k: 'الأسئلة الشائعة', v: (c.faq || []).length, icon: 'help' },
      { k: 'آخر تحديث', v: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ar-EG') : '—', icon: 'download' }
    ];
    $('#dashStats').innerHTML = stats.map(s => `
      <div class="stat"><div class="stat__ico">${ic(s.icon)}</div><b>${s.v}</b><span>${s.k}</span></div>`).join('');

    const site = location.origin + location.pathname.replace(/admin\/?.*$/, '');
    $('#dashInfo').innerHTML = `
      <div class="hintbox">
        <b>الموقع الحالي:</b> <a href="${site}" target="_blank" rel="noopener" style="text-decoration:underline">${site}</a><br>
        <b>الريبو:</b> ${esc(gh.config().owner)}/${esc(gh.config().repo)} — الفرع <code>${esc(gh.config().branch)}</code><br>
        <b>الهاتف:</b> ${esc(cfg.phoneDisplay || '')} · <b>الإيميل:</b> ${esc(cfg.email || '')}<br>
        <b>مواعيد العمل:</b> ${esc(cfg.hours || '')}
      </div>`;
  }

  /* ------------------------------------------------------------------ *
   * لوحة: بيانات المعمل
   * ------------------------------------------------------------------ */
  function renderGeneral() {
    const cfg = content.config;
    const textFields = [
      ['nameAr', 'اسم المعمل (عربي)'], ['nameEn', 'اسم المعمل (إنجليزي)'],
      ['fullAr', 'الاسم الكامل (عربي)'], ['fullEn', 'الاسم الكامل (إنجليزي)'],
      ['phone', 'رقم واتساب/الهاتف (صيغة دولية بدون +)'], ['phoneDisplay', 'شكل الرقم الظاهر'],
      ['landline', 'رقم الأرضي (اختياري)'], ['email', 'البريد الإلكتروني'],
      ['replyTime', 'وقت الرد على الرسائل'], ['hours', 'مواعيد العمل']
    ];
    const socials = cfg.socials || {};
    $('#generalForm').innerHTML = `
      <div class="row2">
        ${textFields.map(([k, label]) => `
          <label class="f"><span class="lbl">${label}</span>
            <input class="in" data-cfg="${k}" value="${esc(cfg[k] || '')}">
          </label>`).join('')}
      </div>
      <h4 style="margin:18px 0 10px;font-size:13px">السوشيال ميديا</h4>
      <div class="row3">
        <label class="f"><span class="lbl">فيسبوك</span><input class="in" data-social="facebook" value="${esc(socials.facebook || '')}"></label>
        <label class="f"><span class="lbl">إنستجرام</span><input class="in" data-social="instagram" value="${esc(socials.instagram || '')}"></label>
        <label class="f"><span class="lbl">يوتيوب</span><input class="in" data-social="youtube" value="${esc(socials.youtube || '')}"></label>
      </div>
      <label class="f"><span class="lbl">قناة واتساب</span><input class="in" data-cfg="whatsappChannel" value="${esc(cfg.whatsappChannel || '')}"></label>

      <h4 style="margin:18px 0 10px;font-size:13px">رسائل جاهزة (تظهر عند فتح واتساب)</h4>
      <div class="row2">
        <label class="f"><span class="lbl">رسالة الحجز العامة</span>
          <textarea class="ta" data-i18n-key="fb.waMsg" style="min-height:70px">${esc((content.i18n['fb.waMsg'] || {}).ar || '')}</textarea></label>
        <label class="f"><span class="lbl">رسالة طلب زيارة منزلية</span>
          <textarea class="ta" data-i18n-key="visit.waMsg" style="min-height:70px">${esc((content.i18n['visit.waMsg'] || {}).ar || '')}</textarea></label>
      </div>

      <h4 style="margin:18px 0 10px;font-size:13px">الفروع</h4>
      <div class="list" id="branchesList"></div>
      <button class="btn-a btn-a--ghost btn-a--sm" type="button" id="addBranch" style="margin-top:10px">+ إضافة فرع</button>

      <h4 style="margin:18px 0 10px;font-size:13px">الفيدباك (Formspree)</h4>
      <label class="f"><span class="lbl">Formspree Form ID</span>
        <input class="in" data-cfg="formspreeId" value="${esc(cfg.formspreeId || '')}">
        <small>تجدها في رابط النموذج: https://formspree.io/f/<b>هذا-الجزء</b></small></label>`;

    renderBranches();
    $('#addBranch').addEventListener('click', () => {
      content.config.branches = content.config.branches || [];
      content.config.branches.push({ id: 'branch-' + Date.now(), ar: 'فرع جديد', en: 'New branch', addressAr: '', addressEn: '', map: '', phone: '' });
      renderBranches(); markDirty();
    });
  }

  function renderBranches() {
    const list = content.config.branches || [];
    $('#branchesList').innerHTML = list.map((b, i) => `
      <div class="li">
        <div class="li__thumb">📍</div>
        <div class="li__body">
          <b>${esc(b.ar)}</b>
          <span>${esc(b.addressAr || 'بدون عنوان')}</span>
        </div>
        <div class="li__actions">
          <button class="btn-a btn-a--ghost btn-a--sm" data-edit-branch="${i}">تعديل</button>
          <button class="btn-a btn-a--ghost btn-a--sm" data-del-branch="${i}" style="color:var(--a-red)">حذف</button>
        </div>
      </div>`).join('') || '<p class="media-empty">لا توجد فروع.</p>';

    $$('[data-edit-branch]').forEach(btn => btn.addEventListener('click', () => editBranch(Number(btn.dataset.editBranch))));
    $$('[data-del-branch]').forEach(btn => btn.addEventListener('click', () => {
      if (!confirm('حذف الفرع؟')) return;
      content.config.branches.splice(Number(btn.dataset.delBranch), 1);
      renderBranches(); markDirty();
    }));
  }

  function editBranch(i) {
    const b = content.config.branches[i];
    openModal('تعديل الفرع', `
      <div class="row2">
        <label class="f"><span class="lbl">الاسم (عربي)</span><input class="in" data-b="ar" value="${esc(b.ar)}"></label>
        <label class="f"><span class="lbl">الاسم (إنجليزي)</span><input class="in" data-b="en" value="${esc(b.en)}"></label>
      </div>
      <div class="row2">
        <label class="f"><span class="lbl">العنوان (عربي)</span><input class="in" data-b="addressAr" value="${esc(b.addressAr || '')}"></label>
        <label class="f"><span class="lbl">العنوان (إنجليزي)</span><input class="in" data-b="addressEn" value="${esc(b.addressEn || '')}"></label>
      </div>
      <div class="row2">
        <label class="f"><span class="lbl">رابط الخريطة</span><input class="in" data-b="map" value="${esc(b.map || '')}"></label>
        <label class="f"><span class="lbl">رقم الفرع</span><input class="in" data-b="phone" value="${esc(b.phone || '')}"></label>
      </div>`, () => {
      ['ar', 'en', 'addressAr', 'addressEn', 'map', 'phone'].forEach(k => {
        b[k] = $(`[data-b="${k}"]`).value;
      });
      renderBranches(); markDirty();
    });
  }

  /* ------------------------------------------------------------------ *
   * لوحة: النصوص
   * ------------------------------------------------------------------ */
  let textFilter = '';
  function renderTexts() {
    const keys = Object.keys(content.i18n).sort();
    const groups = {
      'الهيدر والفوتر': keys.filter(k => /^(nav|top|brand|footer)\./.test(k)),
      'الرئيسية': keys.filter(k => /^home\.|^trust\.|^cta\./.test(k)),
      'دليل التحاليل': keys.filter(k => /^tests\./.test(k)),
      'السحب المنزلي': keys.filter(k => /^visit\./.test(k)),
      'التوعية': keys.filter(k => /^gallery\./.test(k)),
      'النصائح': keys.filter(k => /^tips\./.test(k)),
      'التعاقدات': keys.filter(k => /^contracts\./.test(k)),
      'التواصل': keys.filter(k => /^(contact|fb)\./.test(k)),
      'أخرى': keys.filter(k => !/^(nav|top|brand|footer|home|trust|cta|tests|visit|gallery|tips|contracts|contact|fb)\./.test(k))
    };
    const q = textFilter.trim().toLowerCase();
    const render = (list) => list.filter(k => {
      if (!q) return true;
      const v = content.i18n[k] || {};
      return (k + ' ' + (v.ar || '') + ' ' + (v.en || '')).toLowerCase().includes(q);
    }).map(k => {
      const v = content.i18n[k] || {};
      return `<div class="card-a" style="padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
          <code style="font-size:10.5px;color:var(--a-muted)">${esc(k)}</code>
        </div>
        <div class="f-lang">
          <div><span class="tag">عربي</span>
            <textarea class="ta" data-i18n-ar="${k}" style="min-height:64px">${esc(v.ar || '')}</textarea></div>
          <div><span class="tag">EN</span>
            <textarea class="ta" data-i18n-en="${k}" style="min-height:64px;direction:ltr">${esc(v.en || '')}</textarea></div>
        </div>
      </div>`;
    }).join('');

    $('#textsBody').innerHTML = Object.entries(groups).map(([name, list]) => {
      const body = render(list);
      if (!body) return '';
      return `<details ${q ? 'open' : ''} style="margin-bottom:12px">
        <summary style="cursor:pointer;font-weight:800;color:var(--a-ink);font-size:13.5px;padding:8px 0">
          ${name} <span class="chip">${list.length}</span></summary>
        <div class="list" style="margin-top:8px">${body}</div>
      </details>`;
    }).join('') || '<p class="media-empty">لا توجد نتائج مطابقة.</p>';
  }

  /* ------------------------------------------------------------------ *
   * لوحة: الإحصائيات
   * ------------------------------------------------------------------ */
  function renderStatsPanel() {
    const stats = content.config.stats || [];
    $('#statsBody').innerHTML = stats.map((s, i) => `
      <div class="li" style="grid-template-columns:1fr 1fr 1fr auto">
        <label class="f" style="margin:0"><span class="lbl">الرقم الظاهر</span>
          <input class="in" data-stat="${i}" data-k="value" value="${esc(s.value)}"></label>
        <label class="f" style="margin:0"><span class="lbl">الوصف (عربي)</span>
          <input class="in" data-stat="${i}" data-k="ar" value="${esc(s.ar)}"></label>
        <label class="f" style="margin:0"><span class="lbl">Description (EN)</span>
          <input class="in" data-stat="${i}" data-k="en" value="${esc(s.en)}"></label>
        <button class="btn-a btn-a--ghost btn-a--sm" data-del-stat="${i}" style="color:var(--a-red)">حذف</button>
      </div>`).join('') || '<p class="media-empty">لا توجد أرقام.</p>';
    $('#statsBody').insertAdjacentHTML('beforeend',
      '<button class="btn-a btn-a--ghost btn-a--sm" type="button" id="addStat">+ إضافة رقم</button>');
    $('#addStat').addEventListener('click', () => {
      content.config.stats.push({ value: '+0', ar: 'وصف', en: 'Description' });
      renderStatsPanel(); markDirty();
    });
    $$('[data-del-stat]').forEach(b => b.addEventListener('click', () => {
      content.config.stats.splice(Number(b.dataset.delStat), 1);
      renderStatsPanel(); markDirty();
    }));
  }

  /* ------------------------------------------------------------------ *
   * محرّك القوائم العامة (تحاليل / نصائح / تصاميم / تعاقدات / أسئلة)
   * ------------------------------------------------------------------ */
  function renderCollection(key, mountId, opts) {
    const list = content[key] || [];
    const el = $('#' + mountId);
    el.innerHTML = list.map((item, i) => {
      const title = opts.title(item);
      const sub = opts.sub ? opts.sub(item) : '';
      const thumb = opts.thumb ? opts.thumb(item) : (opts.thumbText || '•');
      return `<div class="li">
        <div class="li__thumb" ${opts.thumb && opts.thumb(item) ? `style="background-image:url('../${esc(opts.thumb(item))}')"` : ''}>${opts.thumb && opts.thumb(item) ? '' : thumb}</div>
        <div class="li__body"><b>${esc(title)}</b><span>${sub}</span></div>
        <div class="li__actions">
          <button class="btn-a btn-a--ghost btn-a--sm" data-edit="${key}:${i}">تعديل</button>
          <button class="btn-a btn-a--ghost btn-a--sm" data-move="${key}:${i}:-1" title="لأعلى">↑</button>
          <button class="btn-a btn-a--ghost btn-a--sm" data-move="${key}:${i}:1" title="لأسفل">↓</button>
          <button class="btn-a btn-a--ghost btn-a--sm" data-del="${key}:${i}" style="color:var(--a-red)">حذف</button>
        </div>
      </div>`;
    }).join('') || `<p class="media-empty">لا توجد عناصر بعد.</p>`;

    $$('[data-edit]', el).forEach(b => b.addEventListener('click', () => {
      const [k, i] = b.dataset.edit.split(':');
      openEditor(k, Number(i));
    }));
    $$('[data-del]', el).forEach(b => b.addEventListener('click', () => {
      const [k, i] = b.dataset.del.split(':');
      if (!confirm('تأكيد الحذف؟')) return;
      content[k].splice(Number(i), 1);
      renderCollection(key, mountId, opts); markDirty();
    }));
    $$('[data-move]', el).forEach(b => b.addEventListener('click', () => {
      const [k, i, dir] = b.dataset.move.split(':');
      const idx = Number(i), d = Number(dir);
      const arr = content[k];
      const ni = idx + d;
      if (ni < 0 || ni >= arr.length) return;
      [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
      renderCollection(key, mountId, opts); markDirty();
    }));
  }

  const COLLECTIONS = {
    tests: {
      mount: 'testsBody', label: 'تحليل',
      title: t => t.ar, sub: t => `${t.price} ج.م · ${t.category}`,
      thumbText: '🧪',
      fields: [
        { k: 'ar', label: 'اسم التحليل (عربي)', type: 'text' },
        { k: 'en', label: 'Test name (English)', type: 'text' },
        { k: 'price', label: 'السعر (ج.م)', type: 'text' },
        { k: 'category', label: 'التصنيف', type: 'select', options: () => (content.testCategories || []).filter(c => c.id !== 'all').map(c => ({ v: c.id, l: c.ar })) },
        { k: 'icon', label: 'أيقونة (إيموجي)', type: 'text' },
        { k: 'ruleAr', label: 'شرط الصيام/التحضير (عربي)', type: 'textarea' },
        { k: 'ruleEn', label: 'Preparation (English)', type: 'textarea' }
      ]
    },
    tips: {
      mount: 'tipsBody', label: 'نصيحة',
      title: t => (t.ar || {}).title, sub: t => t.category, thumbText: '💡',
      fields: [
        { k: 'ar.title', label: 'العنوان (عربي)', type: 'text' },
        { k: 'ar.text', label: 'النص (عربي)', type: 'textarea' },
        { k: 'ar.note', label: 'المعلومة/الملاحظة (عربي)', type: 'textarea' },
        { k: 'en.title', label: 'Title (English)', type: 'text' },
        { k: 'en.text', label: 'Text (English)', type: 'textarea' },
        { k: 'en.note', label: 'Note (English)', type: 'textarea' },
        { k: 'category', label: 'التصنيف', type: 'select', options: () => (content.tipCategories || []).filter(c => c.id !== 'all').map(c => ({ v: c.id, l: c.ar })) },
        { k: 'icon', label: 'أيقونة (إيموجي)', type: 'text' }
      ]
    },
    designs: {
      mount: 'designsBody', label: 'تصميم',
      title: d => d.ar, sub: d => d.category,
      thumb: d => d.image,
      fields: [
        { k: 'ar', label: 'العنوان (عربي)', type: 'text' },
        { k: 'en', label: 'Title (English)', type: 'text' },
        { k: 'descAr', label: 'الوصف (عربي)', type: 'textarea' },
        { k: 'descEn', label: 'Description (English)', type: 'textarea' },
        { k: 'image', label: 'الصورة', type: 'image' },
        { k: 'catAr', label: 'اسم التصنيف (عربي)', type: 'text' },
        { k: 'catEn', label: 'Category name (English)', type: 'text' },
        { k: 'category', label: 'مفتاح التصنيف', type: 'text' }
      ]
    },
    contracts: {
      mount: 'contractsBody', label: 'جهة',
      title: c => c.ar, sub: c => `خصم ${c.discount} · ${c.group}`,
      thumb: c => c.logo || '',
      fields: [
        { k: 'ar', label: 'اسم الجهة (عربي)', type: 'text' },
        { k: 'en', label: 'Name (English)', type: 'text' },
        { k: 'detailAr', label: 'التفاصيل (عربي)', type: 'textarea' },
        { k: 'detailEn', label: 'Details (English)', type: 'textarea' },
        { k: 'discount', label: 'نسبة الخصم (مثال: 20%)', type: 'text' },
        { k: 'group', label: 'المجموعة', type: 'select', options: () => (content.contractGroups || []).filter(c => c.id !== 'all').map(c => ({ v: c.id, l: c.ar })) },
        { k: 'logo', label: 'لوجو الجهة', type: 'image' },
        { k: 'mark', label: 'أيقونة/إيموجي بديل', type: 'text' }
      ]
    },
    faq: {
      mount: 'faqBody', label: 'سؤال',
      title: f => (f.ar || {}).q, sub: f => '', thumbText: '❓',
      fields: [
        { k: 'ar.q', label: 'السؤال (عربي)', type: 'text' },
        { k: 'ar.a', label: 'الإجابة (عربي)', type: 'textarea' },
        { k: 'en.q', label: 'Question (English)', type: 'text' },
        { k: 'en.a', label: 'Answer (English)', type: 'textarea' }
      ]
    }
  };

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, val) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }

  function openEditor(key, index) {
    const conf = COLLECTIONS[key];
    if (!conf) return;
    const item = index >= 0 ? content[key][index] : blankItem(key);
    const html = conf.fields.map(f => {
      const val = getPath(item, f.k);
      if (f.type === 'textarea') {
        return `<label class="f"><span class="lbl">${f.label}</span>
          <textarea class="ta" data-f="${f.k}">${esc(val || '')}</textarea></label>`;
      }
      if (f.type === 'select') {
        const opts = f.options().map(o => `<option value="${esc(o.v)}" ${o.v === val ? 'selected' : ''}>${esc(o.l)}</option>`).join('');
        return `<label class="f"><span class="lbl">${f.label}</span><select class="sel" data-f="${f.k}">${opts}</select></label>`;
      }
      if (f.type === 'image') {
        return `<div class="f"><span class="lbl">${f.label}</span>
          <div class="imgfield">
            <div class="imgfield__preview" data-preview="${f.k}" style="background-image:url('${val ? '../' + esc(val) : ''}')"></div>
            <input class="in" data-f="${f.k}" value="${esc(val || '')}" placeholder="assets/posters/example.jpg">
            <button class="btn-a btn-a--blue btn-a--sm" type="button" data-pick="${f.k}">اختيار/رفع</button>
          </div></div>`;
      }
      return `<label class="f"><span class="lbl">${f.label}</span>
        <input class="in" data-f="${f.k}" value="${esc(val || '')}"></label>`;
    }).join('');

    openModal((index >= 0 ? 'تعديل ' : 'إضافة ') + conf.label, html, () => {
      const obj = index >= 0 ? item : item;
      conf.fields.forEach(f => {
        const input = $(`[data-f="${f.k}"]`);
        if (input) setPath(obj, f.k, input.value);
      });
      if (index < 0) {
        obj.id = Date.now();
        if (key === 'tests') obj.icon = obj.icon || '🧪';
        content[key].push(obj);
      }
      refreshCollection(key);
      markDirty();
    });

    $$('[data-pick]').forEach(btn => btn.addEventListener('click', () => {
      window.Media.open(path => {
        const input = $(`[data-f="${btn.dataset.pick}"]`);
        input.value = path;
        $(`[data-preview="${btn.dataset.pick}"]`).style.backgroundImage = `url('../${path}')`;
      });
    }));
  }

  function blankItem(key) {
    if (key === 'tests') return { ar: '', en: '', price: '0', category: 'routine', icon: '🧪', ruleAr: '', ruleEn: '' };
    if (key === 'tips') return { ar: { title: '', text: '', note: '' }, en: { title: '', text: '', note: '' }, category: 'fasting', icon: '💡' };
    if (key === 'designs') return { ar: '', en: '', descAr: '', descEn: '', image: '', category: 'tips', catAr: '', catEn: '' };
    if (key === 'contracts') return { ar: '', en: '', detailAr: '', detailEn: '', discount: '', group: 'corporate', logo: '', mark: '🏢' };
    if (key === 'faq') return { ar: { q: '', a: '' }, en: { q: '', a: '' } };
    return {};
  }

  function refreshCollection(key) {
    const conf = COLLECTIONS[key];
    renderCollection(key, conf.mount, conf);
  }

  /* ------------------------------------------------------------------ *
   * Modal
   * ------------------------------------------------------------------ */
  let modalOnSave = null;
  function openModal(title, bodyHtml, onSave) {
    const m = $('#editModal');
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = bodyHtml;
    modalOnSave = onSave;
    m.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    $('#editModal').classList.remove('is-open');
    document.body.style.overflow = '';
    modalOnSave = null;
  }

  /* ------------------------------------------------------------------ *
   * المكتبة والنسخ الاحتياطي
   * ------------------------------------------------------------------ */
  function renderMediaPanel() {
    $('#openMedia').addEventListener('click', () => {
      window.Media.open(path => toast('المسار: ' + path, 'ok'));
    });
  }

  function renderBackup() {
    $('#exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'content-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('تم تصدير الملف', 'ok');
    });

    $('#importInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const txt = await file.text();
        const data = JSON.parse(txt);
        if (!data.config || !data.i18n) throw new Error('ملف غير صالح');
        content = data;
        renderAll();
        markDirty();
        toast('تم استيراد المحتوى — اضغط "حفظ ونشر" لتطبيقه', 'ok');
      } catch (err) {
        toast('ملف غير صالح: ' + err.message, 'err');
      }
      e.target.value = '';
    });

    $('#uploadContentBtn').addEventListener('click', async () => {
      try {
        await gh.putFile(CONTENT_FILE, JSON.stringify(content, null, 2), 'إضافة ملف المحتوى');
        toast('تم رفع content.json إلى الريبو', 'ok');
      } catch (err) {
        toast('فشل: ' + describeError(err), 'err');
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * الإعدادات
   * ------------------------------------------------------------------ */
  function renderSettings() {
    const cfg = gh.config();
    $('#settingsForm').innerHTML = `
      <div class="row3">
        <label class="f"><span class="lbl">اسم المستخدم / الجهة</span><input class="in" data-s="owner" value="${esc(cfg.owner)}"></label>
        <label class="f"><span class="lbl">اسم الريبو</span><input class="in" data-s="repo" value="${esc(cfg.repo)}"></label>
        <label class="f"><span class="lbl">الفرع</span><input class="in" data-s="branch" value="${esc(cfg.branch)}"></label>
      </div>
      <label class="f"><span class="lbl">مسار الموقع داخل الريبو (اتركه فارغاً لو في الجذر)</span>
        <input class="in" data-s="basePath" value="${esc(cfg.basePath || '')}"></label>
      <label class="f"><span class="lbl">GitHub Token</span>
        <input class="in" data-s="token" value="${esc(cfg.token || '')}" dir="ltr">
        <small>يُحفظ على جهازك فقط ولا يُرفع أي مكان.</small></label>
      <button class="btn-a btn-a--blue" type="button" id="saveSettings">حفظ الإعدادات</button>
      <button class="btn-a btn-a--ghost" type="button" id="testConn" style="margin-inline-start:8px">اختبار الاتصال</button>
      <button class="btn-a btn-a--ghost" type="button" id="logoutBtn" style="margin-inline-start:8px;color:var(--a-red)">تسجيل الخروج</button>`;

    $('#saveSettings').addEventListener('click', () => {
      const cfgNew = {};
      $$('[data-s]').forEach(i => cfgNew[i.dataset.s] = i.value);
      gh.save(cfgNew);
      toast('تم حفظ الإعدادات', 'ok');
    });
    $('#testConn').addEventListener('click', async () => {
      try {
        const info = await gh.verify();
        toast('الاتصال ناجح: ' + info.repo.full_name, 'ok');
      } catch (err) { toast(describeError(err), 'err'); }
    });
    $('#logoutBtn').addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    });
  }

  /* ------------------------------------------------------------------ *
   * تشغيل
   * ------------------------------------------------------------------ */
  async function enterApp() {
    $('#loginView').hidden = true;
    $('#appView').hidden = false;

    // شريط التنقل
    $('#sideNav').innerHTML = PANELS.map(p =>
      `<a href="#${p.id}" class="side__link" data-panel="${p.id}">${ic(p.icon)}<span>${p.title}</span></a>`).join('');
    $$('.side__link').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); go(a.dataset.panel); }));

    await loadContent();

    renderDashboard(); renderGeneral(); renderTexts(); renderStatsPanel();
    Object.keys(COLLECTIONS).forEach(k => refreshCollection(k));
    renderMediaPanel(); renderBackup(); renderSettings();

    go(location.hash.replace('#', '') || 'dashboard');

    // ربط عام للأحداث (delegation)
    document.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.cfg) { content.config[t.dataset.cfg] = t.value; markDirty(); }
      if (t.dataset.social) { content.config.socials = content.config.socials || {}; content.config.socials[t.dataset.social] = t.value; markDirty(); }
      if (t.dataset.i18nKey) {
        content.i18n[t.dataset.i18nKey] = content.i18n[t.dataset.i18nKey] || {};
        content.i18n[t.dataset.i18nKey].ar = t.value; markDirty();
      }
      if (t.dataset.i18nAr) {
        content.i18n[t.dataset.i18nAr] = content.i18n[t.dataset.i18nAr] || {};
        content.i18n[t.dataset.i18nAr].ar = t.value; markDirty();
      }
      if (t.dataset.i18nEn) {
        content.i18n[t.dataset.i18nEn] = content.i18n[t.dataset.i18nEn] || {};
        content.i18n[t.dataset.i18nEn].en = t.value; markDirty();
      }
      if (t.dataset.stat !== undefined) {
        const i = Number(t.dataset.stat);
        content.config.stats[i][t.dataset.k] = t.value; markDirty();
      }
    });
    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.cfg) { content.config[t.dataset.cfg] = t.value; markDirty(); }
    });

    $('#saveAll').addEventListener('click', saveAll);
    $('#saveAllBottom').addEventListener('click', saveAll);
    $('#modalSave').addEventListener('click', () => { if (modalOnSave) modalOnSave(); closeModal(); });
    $$('[data-modal-close]').forEach(b => b.addEventListener('click', closeModal));
    $('#textSearch').addEventListener('input', (e) => { textFilter = e.target.value; renderTexts(); });

    // أزرار الإضافة
    $$('[data-add]').forEach(b => b.addEventListener('click', () => openEditor(b.dataset.add, -1)));

    markClean();
    window.addEventListener('beforeunload', (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  function renderAll() {
    renderDashboard(); renderGeneral(); renderTexts(); renderStatsPanel();
    Object.keys(COLLECTIONS).forEach(k => refreshCollection(k));
  }

  /* بدء */
  document.addEventListener('DOMContentLoaded', () => {
    // الثيم
    const savedTheme = localStorage.getItem('rehab_admin_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    $('#themeToggleA').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      localStorage.setItem('rehab_admin_theme', cur);
    });

    initLogin();
    if (sessionStorage.getItem(SESSION_KEY) && gh.isReady()) {
      enterApp().catch(err => toast(describeError(err), 'err'));
    }
  });

  // تحميل بيانات الموقع الافتراضية (للنسخ الاحتياطي عند غياب content.json)
  window.ADMIN = { get content() { return content; }, toast };
})();
