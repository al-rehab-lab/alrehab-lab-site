/* ==========================================================================
   AL Rehab Admin — GitHub API driver
   يسمح للوحة التحكم بقراءة وكتابة ملفات الريبو مباشرة من المتصفح
   (بدون سيرفر) باستخدام Personal Access Token محفوظ على جهاز الأدمن فقط.
   ========================================================================== */
(function () {
  'use strict';

  const CFG_KEY = 'rehab_admin_gh';
  const API = 'https://api.github.com';

  const store = {
    get() {
      try { return JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (_) { return null; }
    },
    set(v) { localStorage.setItem(CFG_KEY, JSON.stringify(v)); },
    clear() { localStorage.removeItem(CFG_KEY); }
  };

  const gh = window.GH = {
    store,
    /** إعدادات الافتراضية مبنية على رابط الموقع الحالي */
    defaults() {
      const host = location.hostname;
      let owner = 'al-rehab-lab';
      let repo = 'alrehab-lab-site';
      let branch = 'main';
      let basePath = '';
      if (host.endsWith('github.io')) {
        owner = host.split('.')[0];
        const parts = location.pathname.split('/').filter(Boolean);
        if (parts.length) repo = parts[0];
      }
      return { owner, repo, branch, basePath, token: '' };
    },
    config() {
      return Object.assign(this.defaults(), store.get() || {});
    },
    save(cfg) {
      store.set({
        owner: cfg.owner.trim(),
        repo: cfg.repo.trim(),
        branch: (cfg.branch || 'main').trim(),
        basePath: (cfg.basePath || '').replace(/^\/|\/$/g, ''),
        token: (cfg.token || '').trim()
      });
    },
    isReady() {
      const c = this.config();
      return !!(c.owner && c.repo && c.token);
    },
    path(file) {
      const c = this.config();
      return c.basePath ? c.basePath + '/' + file : file;
    },

    async req(path, opts = {}) {
      const c = this.config();
      if (!c.token) throw new Error('NO_TOKEN');
      const res = await fetch(API + path, {
        ...opts,
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': 'Bearer ' + c.token,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(opts.headers || {})
        }
      });
      if (res.status === 401) throw new Error('BAD_TOKEN');
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'FORBIDDEN');
      }
      if (res.status === 404) throw new Error('NOT_FOUND');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || ('HTTP ' + res.status));
      return data;
    },

    /** قراءة ملف نصي: { text, sha } */
    async getFile(file) {
      const c = this.config();
      const data = await this.req(
        `/repos/${c.owner}/${c.repo}/contents/${encodeURI(this.path(file))}?ref=${encodeURIComponent(c.branch)}`
      );
      if (Array.isArray(data)) throw new Error('IS_DIR');
      const text = decodeBase64Utf8(data.content || '');
      return { text, sha: data.sha, size: data.size };
    },

    /** رفع ملف نصي (ينشئه أو يحدّثه) */
    async putFile(file, text, message) {
      const c = this.config();
      let sha;
      try {
        const cur = await this.getFile(file);
        sha = cur.sha;
      } catch (err) {
        if (err.message !== 'NOT_FOUND') throw err;
      }
      const body = {
        message: message || 'تحديث المحتوى من لوحة التحكم',
        content: encodeBase64Utf8(text),
        branch: c.branch
      };
      if (sha) body.sha = sha;
      return this.req(`/repos/${c.owner}/${c.repo}/contents/${encodeURI(this.path(file))}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    },

    /** رفع ملف بايتات (صور) — base64 بدون تعديل */
    async putBinary(file, base64, message) {
      const c = this.config();
      let sha;
      try {
        const data = await this.req(
          `/repos/${c.owner}/${c.repo}/contents/${encodeURI(this.path(file))}?ref=${encodeURIComponent(c.branch)}`
        );
        sha = data.sha;
      } catch (err) {
        if (err.message !== 'NOT_FOUND') throw err;
      }
      const body = {
        message: message || 'رفع صورة من لوحة التحكم',
        content: base64,
        branch: c.branch
      };
      if (sha) body.sha = sha;
      return this.req(`/repos/${c.owner}/${c.repo}/contents/${encodeURI(this.path(file))}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    },

    async listDir(dir) {
      const c = this.config();
      const data = await this.req(
        `/repos/${c.owner}/${c.repo}/contents/${encodeURI(this.path(dir))}?ref=${encodeURIComponent(c.branch)}`
      );
      return Array.isArray(data) ? data : [];
    },

    /** تحقق من صلاحية الإعدادات + قراءة آخر كوميت */
    async verify() {
      const c = this.config();
      const repo = await this.req(`/repos/${c.owner}/${c.repo}`);
      let commit = null;
      try {
        const commits = await this.req(`/repos/${c.owner}/${c.repo}/commits?sha=${encodeURIComponent(c.branch)}&per_page=1`);
        commit = commits && commits[0] ? commits[0] : null;
      } catch (_) { /* المستخدم قد لا يملك صلاحية القراءة على الكوميتس */ }
      return { repo, commit };
    }
  };

  /* ---------- base64 helpers (UTF-8 آمن) ---------- */
  function encodeBase64Utf8(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function decodeBase64Utf8(b64) {
    const clean = String(b64 || '').replace(/\s/g, '');
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  window.GH_B64 = { encode: encodeBase64Utf8, decode: decodeBase64Utf8 };
})();
