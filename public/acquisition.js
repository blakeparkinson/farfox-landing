// Session-scoped campaign context. Never store names, cities, emails, or order data.
(() => {
  const key = 'farfox_acquisition_v1';
  const params = new URLSearchParams(location.search);
  const fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  let context = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || '{}');
    for (const field of fields) {
      if (typeof saved?.[field] === 'string') context[field] = saved[field].slice(0, 200);
    }
  } catch { /* Storage may be unavailable or malformed. */ }
  // Internal promotions should not replace the external campaign that brought
  // the visitor here. A new external campaign replaces the complete old set.
  if (params.get('utm_source') && params.get('utm_medium') !== 'onsite') {
    context = {};
    for (const field of fields) {
      const value = params.get(field);
      if (value) context[field] = value.slice(0, 200);
    }
    try { sessionStorage.setItem(key, JSON.stringify(context)); } catch { /* Best effort. */ }
  }
  window.farfoxAcquisition = Object.freeze(context);
})();
