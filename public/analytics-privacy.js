// Personal countdown data and game answers live in fragments, not analytics.
(function () {
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(Array.from(arguments));
  };
  window.va('beforeSend', function (event) {
    try {
      var url = new URL(event.url, window.location.origin);
      url.hash = '';
      return Object.assign({}, event, { url: url.href });
    } catch (_) {
      return null; // Fail closed if the analytics URL is malformed.
    }
  });
})();
