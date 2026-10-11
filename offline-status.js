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

  function getNotice() {
    let notice = document.getElementById('qintar-connection-notice');
    if (notice) return notice;
    notice = document.createElement('div');
    notice.id = 'qintar-connection-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.style.cssText = 'position:fixed;z-index:2147483000;top:12px;left:50%;transform:translateX(-50%);width:min(calc(100% - 24px),520px);padding:11px 15px;border:1px solid #e8650a;border-radius:12px;background:#1a1a1a;color:#f0f0f0;box-shadow:0 6px 24px #0009;text-align:center;pointer-events:none;font:700 14px/1.6 Tahoma,Arial,sans-serif;';
    document.body.appendChild(notice);
    return notice;
  }

  function showNotice(message, timeout) {
    const notice = getNotice();
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(notice._hideTimer);
    if (timeout) notice._hideTimer = setTimeout(() => { notice.hidden = true; }, timeout);
  }

  function showConnectionNotice(isOnline) {
    const en = isEnglish();
    showNotice(isOnline
      ? (en ? 'Internet connection restored.' : 'عاد اتصال الإنترنت.')
      : (en
        ? 'You are offline. Saved pages and your on-device data remain available; live rates and external services may not work.'
        : 'أنت غير متصل. الصفحات المحفوظة وبياناتك على الجهاز تبقى متاحة؛ قد تتعطل الأسعار المباشرة والخدمات الخارجية.'),
      isOnline ? 5000 : 0);
  }

  window.addEventListener('offline', () => showConnectionNotice(false));
  window.addEventListener('online', () => showConnectionNotice(true));
  if (!navigator.onLine) showConnectionNotice(false);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.onLine) return;
        try {
          if (sessionStorage.getItem('qintar_offline_ready_v1') !== '1') {
            showNotice(isEnglish()
              ? 'Offline support is ready: saved Qintar pages can now open without internet.'
              : 'أصبح قِنطار جاهزًا دون اتصال؛ يمكنك فتح الصفحات المحفوظة عند انقطاع الإنترنت.', 7000);
            sessionStorage.setItem('qintar_offline_ready_v1', '1');
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
