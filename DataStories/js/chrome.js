(function () {
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.nav-comp-wrap, #langDropdown').forEach(function (w) {
      if (!w.contains(e.target)) w.classList.remove('open');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.nav-comp-wrap.open, #langDropdown.open').forEach(function (w) {
      w.classList.remove('open');
    });
    var nt = document.getElementById('navToggle');
    if (nt && nt.classList.contains('open')) {
      nt.classList.remove('open');
      document.getElementById('navLinks').classList.remove('open');
    }
  });
  document.querySelectorAll('.nav-comp-wrap').forEach(function (w) {
    var t = w.querySelector('.nav-comp-trigger');
    if (!t) return;
    new MutationObserver(function () {
      t.setAttribute('aria-expanded', w.classList.contains('open') ? 'true' : 'false');
    }).observe(w, { attributes: true, attributeFilter: ['class'] });
  });

  var KEY = 'sm_cookie_consent';
  var GA_ID = 'G-6FPWJM34X1';
  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded || typeof gtag !== 'function') return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID);
  }
  function clearGaCookies() {
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n.indexOf('_ga') !== 0) return;
      var h = location.hostname;
      ['', '; domain=' + h, '; domain=.' + h].forEach(function (d) {
        document.cookie = n + '=; Max-Age=0; path=/' + d;
      });
    });
  }
  function apply(granted) {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: granted ? 'granted' : 'denied',
        ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
      });
    }
    if (granted) loadGA(); else clearGaCookies();
  }
  var banner = document.getElementById('sm-cookie-banner');
  var prefs = document.getElementById('sm-cookie-prefs');
  var manage = document.getElementById('sm-cookie-manage');
  var toggle = document.getElementById('sm-pref-analytics');
  if (!banner) return;
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function openPrefs(open) {
    prefs.hidden = !open;
    manage.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function save(granted) {
    try { localStorage.setItem(KEY, granted ? 'granted' : 'denied'); } catch (e) {}
    apply(granted);
    openPrefs(false);
    banner.style.display = 'none';
  }
  var stored = read();
  if (stored === 'granted') { toggle.checked = true; apply(true); }
  else if (stored === 'denied') apply(false);
  else banner.style.display = 'block';
  manage.addEventListener('click', function () { openPrefs(prefs.hidden); });
  document.getElementById('sm-cookie-accept').addEventListener('click', function () { toggle.checked = true; save(true); });
  document.getElementById('sm-cookie-reject').addEventListener('click', function () { toggle.checked = false; save(false); });
  document.getElementById('sm-cookie-save').addEventListener('click', function () { save(toggle.checked); });
  window.smOpenCookieSettings = function () {
    toggle.checked = (read() === 'granted');
    banner.style.display = 'block';
    openPrefs(true);
  };

  window.setLang = function (lang) {
    document.documentElement.lang = lang === 'ar' || lang === 'it' || lang === 'el' ? lang : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.id === 'btn-' + lang);
    });
    try { localStorage.setItem('smLang', lang); } catch (e) {}
  };
  try {
    var saved = localStorage.getItem('smLang');
    if (saved) window.setLang(saved);
  } catch (e) {}
})();
