// ureten: claude-gunay. Kampanya sayfasının başvuru, ölçüm, KVKK paneli ve açılış ekranı bağlantıları.
(function () {
  'use strict';
  var A = window.GK_AYAR || {};
  // [codex] Açık demo, gerçek kayıt hatasını başarıya dönüştüren bir geri dönüş değildir.
  var DEMO = A.ONIZLEME_DEMO === true;
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
      if (!r.ok) { var e = new Error('sunucu_' + r.status); e.durum = r.status; throw e; }
      return r.json();
    }).finally(function () { clearTimeout(sure); });
  }

  window.gkBasvuru = {
    gonder: function (veri) {
      if (DEMO) return Promise.resolve({ id: veri.basvuru_id, demo: true, kaydedildi: false });
      var g = Object.assign({}, veri, { telefon: window.gkTelefon.normalize(veri.telefon), erisim: erisim(veri.basvuru_id) });
      return cagir('kampanya_basvuru_kaydet', g).catch(function (e) {
        // Geçersiz veri ya da hız sınırı tekrar denemeyle düzelmez; yalnız bağlantı hatası bir kez daha denenir.
        if (e.durum && e.durum < 500) throw e;
        return new Promise(function (ok) { setTimeout(ok, 1200); }).then(function () { return cagir('kampanya_basvuru_kaydet', g); });
      }).then(function () { return { id: veri.basvuru_id }; });
    },
    etkilesim: function (id, tip) {
      if (DEMO) return;
      if (id) cagir('kampanya_etkilesim_ekle', { basvuru_id: id, erisim: erisim(id), tip: tip }).catch(function () {});
    }
  };

  // Ölçüm: yalnız kimlik girilmişse yüklenir.
  var meta = { form_gonder: 'Lead', form_tamamla: 'CompleteRegistration', whatsapp_tikla: 'Contact', arama_tikla: 'Contact' };
  window.gkOlcum = function (ad) {
    if (DEMO) return;
    if (window.fbq && meta[ad]) window.fbq('track', meta[ad]);
  };
  function dis(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }
  if (!DEMO && A.GTM_ID) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    dis('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(A.GTM_ID));
  }
  if (!DEMO && A.META_PIXEL_ID) {
    var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    dis('https://connect.facebook.net/en_US/fbevents.js');
    f('init', A.META_PIXEL_ID); f('track', 'PageView');
  }

  // KVKK okuma paneli: formdan çıkmadan açılır, kapanınca form aynı yerde kalır.
  function doldur(s) {
    return s.replace(/\{\{UNVAN\}\}/g, A.UNVAN || 'Günay Klima').replace(/\{\{EPOSTA\}\}/g, A.KVKK_EPOSTA || '').replace(/\{\{ADRES\}\}/g, A.ADRES || '');
  }
  // Telefonun geri tuşu önce metni kapatır, formu ya da siteyi kapatmaz.
  var metinKaldir = null, metinGeri = false;
  window.addEventListener('popstate', function (e) {
    if (metinGeri) { metinGeri = false; e.stopImmediatePropagation(); return; }
    if (metinKaldir) { e.stopImmediatePropagation(); metinKaldir(); return; }
    if (e.state && e.state.gkMetin) { e.stopImmediatePropagation(); metinGeri = true; history.back(); }
  });
  function panelAc(tur) {
    var m = (window.GK_METIN || {})[DEMO ? 'demoBilgi' : tur];
    if (!m || metinKaldir) return;
    var d = document.createElement('div');
    d.id = 'gk-metin';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.setAttribute('aria-label', m.baslik);
    d.innerHTML = '<div class="gk-m-kutu"><div class="gk-m-bas"><strong></strong><button type="button" aria-label="Kapat">×</button></div><div class="gk-m-ic"></div></div>';
    d.querySelector('strong').textContent = m.baslik;
    d.querySelector('.gk-m-ic').innerHTML = doldur(m.html);
    metinKaldir = function () { d.remove(); document.removeEventListener('keydown', tus); metinKaldir = null; };
    var gecmiste = false;
    function kapat() { metinKaldir(); if (gecmiste) { metinGeri = true; history.back(); } }
    function tus(e) { if (e.key === 'Escape') kapat(); }
    d.querySelector('button').addEventListener('click', kapat);
    d.addEventListener('click', function (e) { if (e.target === d) kapat(); });
    document.addEventListener('keydown', tus);
    document.body.appendChild(d);
    try { history.pushState(Object.assign({}, history.state, { gkMetin: 1 }), ''); gecmiste = true; } catch (_) {}
    d.querySelector('button').focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#kvkk"],a[href="#aydinlatma-metni"]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    panelAc(a.getAttribute('href') === '#kvkk' ? 'kvkk' : 'aydinlatma');
  }, true);

  // Açılış ekranı sayfa çizilince kalkar. 8 saniyede gelmezse boş ekran bırakmaz: telefon ve yeniden deneme gösterir.
  var bas = Date.now(), uyarildi = false;
  var t = setInterval(function () {
    var ekran = document.getElementById('gk-acilis');
    if (!ekran) {
      // Head'deki yavaş support.js sürerken body ve açılış ekranı henüz oluşmamış olabilir.
      if (document.readyState === 'loading') return;
      return clearInterval(t);
    }
    if (document.querySelector('[data-rv]')) {
      clearInterval(t);
      ekran.style.opacity = '0';
      setTimeout(function () { ekran.remove(); }, 320);
      return;
    }
    if (!uyarildi && Date.now() - bas > 8000) {
      uyarildi = true;
      // [codex] Kaynak SVG'ye işaret eklemeden spinner ve hazır yazısını hata durumunda kapat.
      var halka = ekran.querySelector('svg > g[transform="translate(200 262)"]');
      if (halka) halka.style.display = 'none';
      var yazi = ekran.querySelector('svg > text:last-of-type');
      if (yazi) yazi.style.display = 'none';
      var hata = document.createElement('div');
      hata.className = 'gk-a-hata';
      var mesaj = document.createElement('p');
      mesaj.className = 'gk-a-yazi';
      mesaj.textContent = 'Sayfa açılamadı. Bağlantınızı kontrol edip yeniden deneyin.';
      hata.appendChild(mesaj);
      var eylem = document.createElement('div');
      eylem.className = 'gk-a-eylem';
      eylem.innerHTML = '<button type="button">Yeniden dene</button><a></a>';
      eylem.querySelector('button').addEventListener('click', function () { location.reload(); });
      var ara = eylem.querySelector('a');
      ara.href = 'tel:+' + (A.TELEFON || '902324617425');
      ara.textContent = '0232 461 74 25';
      hata.appendChild(eylem);
      ekran.appendChild(hata);
    }
  }, 60);
})();
