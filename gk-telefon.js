// ureten: codex. Tek istemci telefon kuralı; veri kaynağı gk-telefon-kurali.json.
// Derleyici GK_TELEFON_KURALI verisini bu dosyadan önce yükler. Abone/hat sahipliği doğrulaması değildir.
(function (root) {
  'use strict';
  var K = root.GK_TELEFON_KURALI;
  if (!K || K.schema_version !== 1 || !Array.isArray(K.mobile_prefixes) || !Array.isArray(K.international)) {
    throw new Error('telefon_kurali_yuklenmedi');
  }
  var prefixes = K.mobile_prefixes.slice();
  var countries = K.international.slice().sort(function (a, b) { return b.code.length - a.code.length; });
  function digits(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
  function normalize(v) {
    var raw = String(v == null ? '' : v).trim(), d = digits(raw);
    var explicit = /^(\+|00)/.test(raw);
    if (explicit) {
      if (raw.indexOf('00') === 0) d = d.slice(2);
      if (d.indexOf('90') === 0) {
        var national = d.slice(2).replace(/^0(?=\d{10}$)/, '');
        return '0' + national;
      }
      return '+' + d;
    }
    if (/^0?90\d{10}$/.test(d)) return '0' + d.replace(/^0?90/, '');
    if (d.length === 10 && d.charAt(0) !== '0') return '0' + d;
    return d;
  }
  function prefixOk(v) {
    var d = digits(v).replace(/^0/, '');
    return d.length >= 3 && prefixes.indexOf(d.slice(0, 3)) >= 0;
  }
  // Claude Design 2026-11-06 telFake algoritması: aynı karar, tek uygulama.
  function fake(v) {
    var d = digits(v);
    if (!d || d.length < 7) return false;
    if (new Set(d).size <= 2) return true;
    var sub = d.slice(-7);
    if (new Set(sub).size <= 2) return true;
    function sequence(s) {
      var a = 0, b = 0;
      for (var i = 1; i < s.length; i++) {
        var x = (+s[i]) - (+s[i - 1]);
        if (x === 1 || x === -9) a++;
        if (x === -1 || x === 9) b++;
      }
      return a >= s.length - 2 || b >= s.length - 2;
    }
    if (sequence(sub)) return true;
    if (/(\d)\1{5,}/.test(d)) return true;
    // Kaynak algoritmanın bu dalı bilinçli olarak false döndürüyor; sessiz kural değişimi yapılmaz.
    if (/^(\d{2})\1{3,}/.test(sub + sub)) return false;
    return /^(\d\d)\1\1\d?$/.test(sub) || /^(\d)(\d)\1\2\1\2\1$/.test(sub);
  }
  function validate(v, mode) {
    var value = normalize(v), d = digits(value), local = d;
    function result(ok, reason) { return { ok: ok, reason: reason || '', value: value }; }
    if (value.charAt(0) === '+') {
      if (d.length < K.international_total_digits.min || d.length > K.international_total_digits.max) return result(false, 'format');
      var c = countries.find(function (x) { return d.indexOf(x.code) === 0; });
      if (c) local = d.slice(c.code.length);
      if (mode !== 'panel' && (!c || local.length < c.min || local.length > c.max)) return result(false, 'format');
      return fake(local) ? result(false, 'fake') : result(true);
    }
    if (!/^0[1-9]\d{9}$/.test(value)) return result(false, 'format');
    if (mode !== 'panel' && value.charAt(1) !== '5') return result(false, 'format');
    if (value.charAt(1) === '5' && !prefixOk(value)) return result(false, 'prefix');
    return fake(value.slice(1)) ? result(false, 'fake') : result(true);
  }
  root.gkTelefon = Object.freeze({ kural: K, normalize: normalize, prefixOk: prefixOk, fake: fake, validate: validate });
})(typeof window !== 'undefined' ? window : globalThis);
