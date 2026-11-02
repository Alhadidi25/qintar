/* Reads only Qintar's existing browser-local data; never sends personal amounts over the network. */
(function () {
  'use strict';
  const STORAGE_KEY = 'mhfzti_v4';
  const CURRENCY_CODES = {
    '⃁': 'SAR',
    '$': 'USD',
    '€': 'EUR',
    'د.إ': 'AED',
    'ج.م': 'EGP',
    'د.ك': 'KWD',
    SAR: 'SAR',
    USD: 'USD',
    EUR: 'EUR',
    AED: 'AED',
    EGP: 'EGP',
    KWD: 'KWD'
  };

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const txs = Array.isArray(saved.txs) ? saved.txs : [];
      let balance = 0;
      for (const tx of txs) {
        const amount = Number(tx && tx.amount);
        if (!Number.isFinite(amount)) continue;
        if (tx.type === 'deposit') balance += amount;
        if (tx.type === 'withdraw') balance += -amount + (Number(tx.cb) || 0);
      }
      const currency = saved.settings && saved.settings.currency || '⃁';
      return {
        balance,
        currency,
        currencyCode: CURRENCY_CODES[currency] || 'SAR',
        hasData: txs.length > 0
      };
    } catch (_) {
      return { balance: 0, currency: '⃁', currencyCode: 'SAR', hasData: false };
    }
  }

  function format(value, language) {
    const locale = language === 'en' ? 'en-US' : 'ar-SA-u-nu-latn';
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  window.QintarWallet = Object.freeze({ read, format });
}());
