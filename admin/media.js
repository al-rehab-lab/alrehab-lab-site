/* ==========================================================================
   AL Rehab Admin — Media picker
   اختيار صورة من مكتبة الريبو، أو رفع صورة جديدة (يتم ضغطها وتحويلها WebP)
   ========================================================================== */
(function () {
  'use strict';

  const gh = window.GH;

  const media = window.Media = {
    picker: null,
    target: null,
    recentUploads: [],

    /** يفتح منتقي الصور. callback(path) */
    open(callback) {
      this.target = callback;
      const el = this.ensure();
      el.classList.add('is-open');
      this.refreshList();
      document.body.style.overflow = 'hidden';
    },

    close() {
      const el = this.ensure();
      el.classList.remove('is-open');
      document.body.style.overflow = '';
      this.target = null;
    },

    ensure() {
      if (this.picker) return this.picker;
      const el = document.createElement('div');
      el.className = 'media-modal';
      el.innerHTML = `
        <div class="media-modal__scrim" data-media-close></div>
        <div class="media-modal__panel">
          <div class="media-modal__head">
            <h3>مكتبة الصور</h3>
            <button type="button" class="icon-btn-a" data-media-close aria-label="إغلاق">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
          </div>
          <div class="media-modal__upload">
            <label class="btn-a btn-a--blue btn-a--sm" style="cursor:pointer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 16V4M7 9l5-5 5 5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
              رفع صورة جديدة
              <input type="file" accept="image/*" multiple hidden data-media-upload>
            </label>
            <span class="media-modal__hint" data-media-status>يتم ضغط الصور تلقائياً (WebP) لتسريع الموقع</span>
          </div>
          <div class="media-modal__grid" data-media-grid></div>
          <div class="media-modal__foot">
            <input class="in" type="text" placeholder="أو أدخل مسار صورة مباشرة: assets/posters/new.jpg" data-media-manual>
            <button class="btn-a btn-a--ghost btn-a--sm" type="button" data-media-apply>استخدام المسار</button>
          </div>
        </div>`;
      document.body.appendChild(el);
      this.picker = el;

      el.addEventListener('click', e => {
        if (e.target.closest('[data-media-close]')) this.close();
        const cell = e.target.closest('[data-media-pick]');
        if (cell) {
          const path = cell.dataset.mediaPick;
          const cb = this.target;
          this.close();
          if (cb) cb(path);
        }
        if (e.target.closest('[data-media-apply]')) {
          const val = el.querySelector('[data-media-manual]').value.trim();
          if (val) {
            const cb = this.target;
            this.close();
            if (cb) cb(val);
          }
        }
      });

      el.querySelector('[data-media-upload]').addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        for (const file of files) {
          try {
            await this.upload(file);
          } catch (err) {
            this.status('فشل رفع الصورة: ' + err.message, true);
          }
        }
        e.target.value = '';
        this.refreshList();
      });

      return el;
    },

    status(msg, isErr) {
      const s = this.ensure().querySelector('[data-media-status]');
      if (!s) return;
      s.textContent = msg;
      s.style.color = isErr ? 'var(--red)' : '';
    },

    async refreshList() {
      const grid = this.ensure().querySelector('[data-media-grid]');
      grid.innerHTML = '<p class="media-empty">جارٍ تحميل الصور…</p>';
      try {
        const dirs = ['assets/posters', 'assets/uploads', 'assets', 'assets/contracts'];
        const found = [];
        for (const dir of dirs) {
          try {
            const items = await gh.listDir(dir);
            items
              .filter(i => i.type === 'file' && /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(i.name))
              .forEach(i => found.push({ path: i.path, name: i.name }));
          } catch (_) { /* المجلد غير موجود */ }
        }
        const merged = new Map(found.map(f => [f.path, f]));
        this.recentUploads.forEach(f => merged.set(f.path, f));
        const images = Array.from(merged.values());
        if (!images.length) {
          grid.innerHTML = '<p class="media-empty">لا توجد صور. ارفع صورة جديدة من الزر أعلى.</p>';
          return;
        }
        const safe = value => String(value).replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
        grid.innerHTML = images.map(f => {
          const src = f.path.split('/').map(encodeURIComponent).join('/');
          return `
          <button type="button" class="media-cell" data-media-pick="${safe(f.path)}" title="${safe(f.path)}">
            <img src="${src}" alt="${safe(f.name)}" loading="lazy" onerror="this.style.opacity=.25">
            <span>${safe(f.name)}</span>
          </button>`;
        }).join('');
      } catch (err) {
        grid.innerHTML = `<p class="media-empty">تعذّر تحميل المكتبة (${err.message}).<br>تأكد من إعدادات GitHub ثم أعد المحاولة.</p>`;
      }
    },

    /** ضغط الصورة إلى WebP بحجم أقصى 1600px ثم رفعها */
    async upload(file) {
      this.status('جارٍ تجهيز الصورة…');
      const { base64, ext } = await compressImage(file);
      const safe = file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[^\w\u0621-\u064A-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
        .slice(0, 40) || 'image';
      const path = `assets/uploads/${Date.now()}-${safe}.${ext}`;
      this.status('جارٍ رفع ' + file.name + '…');
      await gh.putBinary(path, base64, 'رفع صورة: ' + file.name);
      this.recentUploads = this.recentUploads.filter(item => item.path !== path);
      this.recentUploads.unshift({ path, name: path.split('/').pop() });
      this.status('تم رفع الصورة ✓ — هتظهر ضمن الصور المتاحة للاختيار');
      return path;
    }
  };

  /** ضغط الصورة عبر canvas */
  function compressImage(file, maxSize = 1600, quality = 0.86) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) { reject(new Error('الملف ليس صورة')); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const ratio = Math.min(1, maxSize / Math.max(width, height));
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const isPng = /png$/i.test(file.type) && file.size < 300 * 1024;
          const mime = isPng ? 'image/png' : 'image/jpeg';
          const ext = isPng ? 'png' : 'jpg';
          const dataUrl = canvas.toDataURL(mime, quality);
          URL.revokeObjectURL(url);
          resolve({ base64: dataUrl.split(',')[1], ext });
        } catch (err) { reject(err); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تعذّر قراءة الصورة')); };
      img.src = url;
    });
  }

  window.compressImage = compressImage;
})();
