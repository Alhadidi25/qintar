(function () {
  'use strict';

  function isEnglish() {
    if (document.documentElement.lang === 'en') return true;
    try {
      const saved = JSON.parse(localStorage.getItem('mhfzti_v4') || '{}');
      return !!(saved.settings && saved.settings.lang === 'en');
    } catch (_) {
      return false;
    }
  }

  function showToast(message, duration) {
    if (typeof window.showToast === 'function') {
      window.showToast(message);
      return;
    }

    let toast = document.getElementById('qintar-offline-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'qintar-offline-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(100px);max-width:calc(100vw - 32px);padding:12px 24px;border:1px solid #e8650a;border-radius:30px;background:#1a1a1a;color:#fff;font:700 14px/1.5 Tahoma,Arial,sans-serif;text-align:center;box-shadow:0 8px 32px #0009;z-index:2147483000;opacity:0;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .2s;pointer-events:none;';
      document.body.appendChild(toast);
    }
    clearTimeout(toast._hideTimer);
    toast.textContent = message;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
    toast._hideTimer = setTimeout(function () {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      toast.style.opacity = '0';
    }, duration || 2800);
  }

  function showConnectionNotice(isOnline) {
    const en = isEnglish();
    showToast(isOnline
      ? (en ? 'Internet connection restored.' : 'عاد اتصال الإنترنت.')
      : (en ? 'You’re offline.' : 'أنت غير متصل بالإنترنت.'), isOnline ? 4500 : 3500);
  }

  window.addEventListener('offline', function () { showConnectionNotice(false); });
  window.addEventListener('online', function () { showConnectionNotice(true); });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(async function () {
        await navigator.serviceWorker.ready;
        if (!navigator.onLine) return;
        try {
          if (sessionStorage.getItem('qintar_offline_ready_toast_v2') !== '1') {
            showToast(isEnglish()
              ? 'Qintar is ready offline.'
              : 'قِنطار جاهز للعمل دون إنترنت.');
            sessionStorage.setItem('qintar_offline_ready_toast_v2', '1');
          }
        } catch (_) {
          // Storage can be unavailable in restricted browser modes; core app behavior is unchanged.
        }
      }).catch(function () {
        // The website continues to work online when service worker registration is unavailable.
      });
    }, { once: true });
  }
}());
