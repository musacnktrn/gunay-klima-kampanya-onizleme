// ureten: claude-gunay. Kampanya sayfasının başvuru, ölçüm, KVKK paneli ve açılış ekranı bağlantıları.
(function () {
  'use strict';
  var A = window.GK_AYAR || {};
  var hafiza = {};

  function erisim(id) {
    var k = 'gk_e_' + id, t = hafiza[k];
    try { t = t || sessionStorage.getItem(k); } catch (_) {}
    if (!t) {
      var b = new Uint8Array(24);
      crypto.getRandomValues(b);
      t = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    }
    hafiza[k] = t;
    try { sessionStorage.setItem(k, t); } catch (_) {}
    return t;
  }

  function cagir(fn, govde) {
    if (!A.SUPABASE_URL || !A.SUPABASE_ANON_KEY) return Promise.reject(new Error('bagli_degil'));
    var h = { 'Content-Type': 'application/json', apikey: A.SUPABASE_ANON_KEY };
    if (A.SUPABASE_ANON_KEY.indexOf('eyJ') === 0) h.Authorization = 'Bearer ' + A.SUPABASE_ANON_KEY;
    var ctrl = window.AbortController ? new AbortController() : null;
    var sure = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : 0;
    return fetch(A.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
      method: 'POST', headers: h, body: JSON.stringify({ p: govde }), keepalive: true, signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      clearTimeout(sure);
      if (!r.ok) { var e = new Error('sunucu_' + r.status); e.durum = r.status; throw e; }
      return r.json();
    });
  }

  window.gkBasvuru = {
    gonder: function (veri) {
      var g = Object.assign({}, veri, { erisim: erisim(veri.basvuru_id) });
      return cagir('kampanya_basvuru_kaydet', g).catch(function (e) {
        // Geçersiz veri ya da hız sınırı tekrar denemeyle düzelmez; yalnız bağlantı hatası bir kez daha denenir.
        if (e.durum && e.durum < 500) throw e;
        return new Promise(function (ok) { setTimeout(ok, 1200); }).then(function () { return cagir('kampanya_basvuru_kaydet', g); });
      }).then(function () { return { id: veri.basvuru_id }; });
    },
    etkilesim: function (id, tip) {
      if (id) cagir('kampanya_etkilesim_ekle', { basvuru_id: id, erisim: erisim(id), tip: tip }).catch(function () {});
    }
  };

  // Ölçüm: yalnız kimlik girilmişse yüklenir.
  var meta = { form_gonder: 'Lead', form_tamamla: 'CompleteRegistration', whatsapp_tikla: 'Contact', arama_tikla: 'Contact' };
  window.gkOlcum = function (ad) {
    if (window.fbq && meta[ad]) window.fbq('track', meta[ad]);
  };
  function dis(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }
  if (A.GTM_ID) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    dis('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(A.GTM_ID));
  }
  if (A.META_PIXEL_ID) {
    var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    dis('https://connect.facebook.net/en_US/fbevents.js');
    f('init', A.META_PIXEL_ID); f('track', 'PageView');
  }

  // KVKK okuma paneli: formdan çıkmadan açılır, kapanınca form aynı yerde kalır.
  function doldur(s) {
    return s.replace(/\{\{UNVAN\}\}/g, A.UNVAN || 'Günay Klima').replace(/\{\{EPOSTA\}\}/g, A.KVKK_EPOSTA || '').replace(/\{\{ADRES\}\}/g, A.ADRES || '');
  }
  function panelAc(tur) {
    var m = (window.GK_METIN || {})[tur];
    if (!m) return;
    var d = document.createElement('div');
    d.id = 'gk-metin';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.setAttribute('aria-label', m.baslik);
    d.innerHTML = '<div class="gk-m-kutu"><div class="gk-m-bas"><strong></strong><button type="button" aria-label="Kapat">×</button></div><div class="gk-m-ic"></div></div>';
    d.querySelector('strong').textContent = m.baslik;
    d.querySelector('.gk-m-ic').innerHTML = doldur(m.html);
    function kapat() { d.remove(); document.removeEventListener('keydown', tus); }
    function tus(e) { if (e.key === 'Escape') kapat(); }
    d.querySelector('button').addEventListener('click', kapat);
    d.addEventListener('click', function (e) { if (e.target === d) kapat(); });
    document.addEventListener('keydown', tus);
    document.body.appendChild(d);
    d.querySelector('button').focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#kvkk"],a[href="#aydinlatma-metni"]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    panelAc(a.getAttribute('href') === '#kvkk' ? 'kvkk' : 'aydinlatma');
  }, true);

  // Açılış ekranı: sayfa çizilince kalkar, en geç 8 saniyede kalkar.
  var bas = Date.now();
  var t = setInterval(function () {
    var ekran = document.getElementById('gk-acilis');
    if (!ekran) return clearInterval(t);
    if (document.querySelector('[data-rv]') || Date.now() - bas > 8000) {
      clearInterval(t);
      ekran.style.opacity = '0';
      setTimeout(function () { ekran.remove(); }, 320);
    }
  }, 60);
})();
