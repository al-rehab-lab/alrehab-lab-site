/* ==========================================================================
   AL Rehab Medical Lab — Content loader
   يقرأ content.json (المعدّل من لوحة التحكم) ويدمجه فوق البيانات الافتراضية
   لو الملف مش موجود (فتح محلي بدون سيرفر) يشتغل بالبيانات الافتراضية عادي.
   ========================================================================== */
(function () {
  'use strict';
  const LAB = window.LAB = window.LAB || {};

  const ARRAY_KEYS = ['tests', 'testCategories', 'tips', 'tipCategories', 'designs', 'contracts', 'contractGroups', 'faq', 'stats'];

  LAB.applyContent = function (c) {
    if (!c || typeof c !== 'object') return;
    if (c.config && typeof c.config === 'object') {
      Object.keys(c.config).forEach(k => {
        if (c.config[k] !== null && c.config[k] !== undefined) LAB.config[k] = c.config[k];
      });
      if (Array.isArray(c.config.stats)) LAB.config.stats = c.config.stats;
    }
    ARRAY_KEYS.forEach(k => {
      if (Array.isArray(c[k])) LAB[k] = c[k];
    });
    if (c.i18n && typeof c.i18n === 'object') {
      Object.keys(c.i18n).forEach(k => {
        const v = c.i18n[k];
        if (!v || typeof v !== 'object') return;
        const base = LAB.i18n[k] || {};
        LAB.i18n[k] = {
          ar: v.ar !== undefined && v.ar !== null ? v.ar : base.ar,
          en: v.en !== undefined && v.en !== null ? v.en : base.en
        };
      });
    }
    LAB._content = c;
  };

  LAB.contentUrl = 'content.json';

  LAB.loadContent = async function (url) {
    try {
      const res = await fetch(url || LAB.contentUrl, { cache: 'no-store' });
      if (!res.ok) return false;
      const data = await res.json();
      LAB.applyContent(data);
      return true;
    } catch (err) {
      return false;
    }
  };

  /* بناء كائن المحتوى من الحالة الحالية (مستخدم في اللوحة للتصدير) */
  LAB.snapshotContent = function () {
    const out = {
      config: JSON.parse(JSON.stringify(LAB.config)),
      i18n: JSON.parse(JSON.stringify(LAB.i18n))
    };
    ARRAY_KEYS.forEach(k => {
      if (Array.isArray(LAB[k]) && LAB[k].length) out[k] = JSON.parse(JSON.stringify(LAB[k]));
    });
    return out;
  };
})();
