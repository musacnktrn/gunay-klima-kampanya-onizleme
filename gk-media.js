// ureten: codex. Tek hero öğesi, kullanıcı hareketi ve ortak oynatma yaşam döngüsü.
(function () {
  'use strict';
  var video = null, bagli = false, bekliyor = false, oynuyor = false;
  var istek = false, formAcik = false, aktifPlay = false, hata = '', sira = 0;
  var mini = null, baslatildi = false, detayAcik = false;
  var autoTimer = 0, autoKuruldu = false, autoBekliyor = false;
  var olaylar = ['playing', 'pause', 'ended', 'volumechange', 'waiting', 'error'];

  function digerleriniDurdur(aktif) {
    document.querySelectorAll('video').forEach(function (v) {
      if (v !== aktif) {
        v.pause();
        if (v === video) v.muted = true;
      }
    });
  }

  function goster() {
    if (!video) return;
    var dugme = document.getElementById('gk-ses-kontrol');
    var yazi = document.getElementById('gk-ses-durum');
    var kapak = document.getElementById('gk-video-kapak');
    // [codex] Kapak görünümü oynatma zamanını/node'u sıfırlamaz.
    if (kapak) kapak.hidden = !video.paused && !video.ended && oynuyor;
    var sesAcik = !video.muted && video.volume > 0;
    var sesli = !video.paused && sesAcik && !video.ended;
    var durum = hata ? 'error' : (bekliyor || (!video.paused && !oynuyor)) ? 'loading' : sesli ? 'audible' : !video.paused ? 'muted' : 'idle';
    var etiket = (sesAcik && (bekliyor || sesli)) ? 'Sesi kapat' : 'Sesi aç';
    [dugme, mini].forEach(function (b) {
      if (!b) return;
      b.disabled = formAcik;
      b.setAttribute('data-media-state', durum);
      b.setAttribute('aria-label', etiket);
      b.setAttribute('aria-pressed', String(sesAcik && (bekliyor || sesli)));
      var ad = b.querySelector('[data-ses-etiket]');
      if (ad) ad.textContent = etiket;
    });
    if (mini) {
      var r = video.getBoundingClientRect ? video.getBoundingClientRect() : { top: 0, bottom: 100 };
      var gorunur = r.bottom > 70 && r.top < (window.innerHeight || 800) - 100;
      mini.hidden = !baslatildi || formAcik || video.ended || (!detayAcik && gorunur);
    }
    if (yazi) yazi.textContent = hata || (durum === 'loading' ? 'Video yükleniyor…' : '');
  }

  function degisti(e) {
    if (e.type === 'playing') {
      if (!istek || formAcik || !aktifPlay) { beklet(); return; }
      oynuyor = true; bekliyor = false; baslatildi = true;
    }
    if (e.type === 'waiting') oynuyor = false;
    if ((e.type === 'pause' && video.paused) || e.type === 'ended') {
      ++sira; bekliyor = false; oynuyor = false; aktifPlay = false; autoBekliyor = false;
    }
    if (e.type === 'error') {
      autoIptal();
      ++sira; bekliyor = false; oynuyor = false; aktifPlay = false; istek = false; autoBekliyor = false;
      video.pause(); video.muted = true;
      hata = 'Video açılamadı. Yeniden deneyebilirsiniz.';
    }
    goster();
  }

  function iletisim(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="tel:"],a[href^="https://wa.me/"],a[href^="https://api.whatsapp.com/"]');
    if (a) durdur();
  }

  function konumGuncelle() { goster(); }

  function autoIptal() {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = 0;
  }

  function gorunurluk() {
    if (!document.hidden) return;
    autoIptal();
    if (autoBekliyor) { istek = false; beklet(); }
  }

  function autoKur() {
    if (autoKuruldu || !video) return;
    autoKuruldu = true;
    if (document.hidden || formAcik) return;
    var v = video;
    autoTimer = setTimeout(function () {
      autoTimer = 0;
      if (!bagli || v !== video || document.hidden || formAcik || istek || baslatildi) return;
      // [codex] Tek best-effort deneme; izin/policy değiştirme veya sahte hareket yok.
      istek = true;
      baslat(v, true);
    }, 2000);
  }

  function oynatma(e) {
    var v = e.target;
    if (!v || v.tagName !== 'VIDEO') return;
    if (formAcik) { v.pause(); v.muted = true; goster(); return; }
    if (v === video && (!istek || formAcik || !aktifPlay)) { beklet(); return; }
    if (v !== video) {
      autoIptal();
      ++sira; bekliyor = false; oynuyor = false; aktifPlay = false; istek = false; baslatildi = false; autoBekliyor = false;
      if (video) { video.pause(); video.muted = true; }
    }
    digerleriniDurdur(v);
    goster();
  }

  function bagla(v) {
    if (!bagli) {
      document.addEventListener('play', oynatma, true);
      document.addEventListener('click', iletisim, true);
      document.addEventListener('scroll', konumGuncelle, true);
      document.addEventListener('visibilitychange', gorunurluk);
      window.addEventListener('pagehide', durdur);
      window.addEventListener('resize', konumGuncelle);
      mini = document.createElement('button');
      mini.type = 'button'; mini.id = 'gk-ses-mini'; mini.hidden = true;
      mini.className = 'gk-ses-kontrol gk-ses-mini';
      mini.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path class="gk-ses-kapali" d="m16 9 6 6m0-6-6 6"></path><path class="gk-ses-acik" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"></path></svg><span data-ses-etiket="">Sesi aç</span>';
      mini.addEventListener('click', degistir);
      document.body.appendChild(mini);
      bagli = true;
    }
    v = v || document.getElementById('gk-tanitim');
    if (v === video) return video;
    if (video) {
      video.pause(); video.muted = true;
      olaylar.forEach(function (ad) { video.removeEventListener(ad, degisti); });
    }
    ++sira; video = v; bekliyor = false; oynuyor = false; hata = ''; istek = false; aktifPlay = false; baslatildi = false;
    if (video) {
      video.muted = true;
      olaylar.forEach(function (ad) { video.addEventListener(ad, degisti); });
    }
    goster();
    autoKur();
    return video;
  }

  function baslat(v, otomatik) {
    if (!v || !istek || formAcik) return false;
    digerleriniDurdur(v);
    hata = '';
    var n = ++sira;
    aktifPlay = true; autoBekliyor = otomatik === true;
    v.muted = false;
    function basarisiz(e) {
      if (n !== sira || v !== video) return;
      bekliyor = false; oynuyor = false; aktifPlay = false; istek = false; autoBekliyor = false;
      v.pause(); v.muted = true;
      hata = otomatik && e && e.name === 'NotAllowedError' ? '' : 'Video başlatılamadı. Yeniden dokunarak deneyin.';
      goster();
    }
    // Elle açma ve form kapatmada bu çağrı doğrudan jestin içindedir; auto ayrı tek timer'dır.
    try {
      if (v.ended) v.currentTime = 0;
      bekliyor = true;
      var sonuc = v.play();
      goster();
      Promise.resolve(sonuc).then(function () {
        if (n !== sira || v !== video || !istek || formAcik) return;
        bekliyor = false; oynuyor = !v.paused; baslatildi = oynuyor; autoBekliyor = false; goster();
      }, basarisiz);
    } catch (e) { basarisiz(e); }
    return true;
  }

  function beklet() {
    ++sira; bekliyor = false; oynuyor = false; aktifPlay = false; autoBekliyor = false;
    if (video) { video.pause(); video.muted = true; }
    goster();
  }

  function degistir() {
    var v = bagla();
    if (!v) return false;
    autoIptal();
    if (istek && v.volume > 0 && (!v.muted || formAcik) && (!v.paused || bekliyor || formAcik)) {
      // [codex] Musa R2: sesi kapat, videoyu da aynı yerde durdurur.
      istek = false; hata = ''; beklet(); return true;
    }
    istek = true; baslatildi = true;
    // [codex] Yalnız açık Sesi aç eylemi sıfır öğe sesini varsayılana döndürür.
    // Pozitif kullanıcı düzeyi, otomatik deneme ve form dönüşünde korunur.
    if (v.volume === 0) v.volume = 1;
    if (formAcik) { goster(); return true; }
    return baslat(v);
  }

  function form(acik) {
    acik = !!acik;
    if (acik === formAcik) return;
    formAcik = acik;
    if (acik) {
      autoIptal();
      beklet();
      document.querySelectorAll('video').forEach(function (v) { v.pause(); v.muted = true; });
    }
    // Hiç oynatılmamışı veya kullanıcının kapattığını form kapanması başlatmaz.
    else if (istek && baslatildi) baslat(video);
    else goster();
  }

  function durdur() {
    autoIptal();
    ++sira; bekliyor = false; oynuyor = false; aktifPlay = false; istek = false; hata = ''; baslatildi = false; autoBekliyor = false;
    document.querySelectorAll('video').forEach(function (v) { v.pause(); v.muted = true; });
    goster();
  }

  function ayir() {
    durdur();
    if (video) olaylar.forEach(function (ad) { video.removeEventListener(ad, degisti); });
    if (bagli) {
      document.removeEventListener('play', oynatma, true);
      document.removeEventListener('click', iletisim, true);
      document.removeEventListener('scroll', konumGuncelle, true);
      document.removeEventListener('visibilitychange', gorunurluk);
      window.removeEventListener('pagehide', durdur);
      window.removeEventListener('resize', konumGuncelle);
    }
    if (mini) { mini.removeEventListener('click', degistir); mini.remove(); mini = null; }
    video = null; bagli = false; detayAcik = false; formAcik = false; autoKuruldu = false;
  }

  window.gkMedia = { bagla: bagla, degistir: degistir, form: form, durdur: durdur, ayir: ayir, yenile: function (acik) { detayAcik = !!acik; goster(); } };
})();
