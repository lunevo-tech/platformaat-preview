/* 14 Veld: het veld van punten in de hero (rauwe WebGL, terugval canvas 2D) en de rustige onthullingen. Gewone JavaScript, geen bibliotheek,
   geen externe verzoeken, geen cookies. Alles draait alleen als <html> de class «fx» heeft (zie de kop van de pagina); anders staat het woord
   als gewone tekst en beweegt er niets. De lus staat stil buiten beeld en bij een verborgen tabblad. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var sm = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  if (!root.classList.contains('fx')) return;
  window.__fx = 1;

  var mqSmall = window.matchMedia ? matchMedia('(max-width: 760px)') : { matches: false };

  // 1. Onthullen bij scrollen. Wie tegelijk in beeld komt, volgt elkaar op.
  var els = $('[data-r]');
  var reveal = function (list) {
    list.sort(function (a, b) { var x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return (x.top - y.top) || (x.left - y.left); })
      .forEach(function (el, k) {
        el.style.setProperty('--i', k);
        el.classList.add('in');
        setTimeout(function () { el.classList.add('done'); }, 2200);
      });
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      vis.forEach(function (e) { io.unobserve(e.target); });
      reveal(vis.map(function (e) { return e.target; }));
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { reveal(els); }

  // 2. De draad door de werkwijze.
  var thread = document.querySelector('.thread'), steps = $('.step');
  var drawThread = function () {
    if (!thread) return;
    var r = thread.getBoundingClientRect(), read = window.innerHeight * 0.62, p;
    if (mqSmall.matches) {
      p = r.height ? clamp((read - r.top) / r.height, 0, 1) : 0;
      steps.forEach(function (s) { s.classList.toggle('on', s.getBoundingClientRect().top + 8 <= read); });
    } else {
      p = clamp((read - r.top) / (window.innerHeight * 0.34), 0, 1);
      steps.forEach(function (s, k) { s.classList.toggle('on', p >= (k + 0.15) / steps.length); });
    }
    thread.style.setProperty('--p', p.toFixed(4));
  };

  // 3. Het veld.
  var scene = document.querySelector('.scene');
  var stage = scene && scene.querySelector('.stage');
  var canvas = stage && stage.querySelector('.field');
  var copy = stage && stage.querySelector('.hero-copy');
  var cue = stage && stage.querySelector('.cue');
  var capI = stage && stage.querySelector('.cap-i b'), capT = stage && stage.querySelector('.cap-t');
  var CAPS = ['PlatforMaat, punt voor punt', 'Hetzelfde veld, nu een rooster', 'Een landschap van lijnen', 'En weer tekst: bouwt'];

  var W = 0, H = 0, dpr = 1, N = 0, T = null, rowsN = 0, perRow = 0;
  var gl = null, ctx = null, prog = null, progL = null, bufs = null, idxBuf = null, idxCount = 0, loc = null, locL = null;
  var tgt = 0, cur = 0, mx = -9999, my = -9999, tmx = -9999, tmy = -9999, mOn = 0, tOn = 0;
  var raf = 0, running = false, inView = true, ready = false, capIdx = -1, lastDraw = 0;
  var INK = [0.067, 0.075, 0.082], SIG = [1, 0.29, 0.11];
  var force2d = /[?&]render=2d/.test(location.search);

  var seed = 12345;
  var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // punten uit tekst: de tekst op een verborgen canvas tekenen en de gevulde pixels bemonsteren
  function textPoints(text, font, widthFrac, cx, cy, maxH, cnt) {
    cnt = cnt || N;
    var c = document.createElement('canvas'), x = c.getContext('2d');
    x.font = font.replace('{s}', '100px');
    var w100 = x.measureText(text).width;
    var size = Math.min(widthFrac * W / w100 * 100, maxH / 0.8);
    x.font = font.replace('{s}', size.toFixed(1) + 'px');
    var w = Math.ceil(x.measureText(text).width) + 24, h = Math.ceil(size * 1.5);
    c.width = w; c.height = h;
    x.font = font.replace('{s}', size.toFixed(1) + 'px');
    x.fillStyle = '#000'; x.textBaseline = 'alphabetic'; x.fillText(text, 12, size * 1.05);
    var d = x.getImageData(0, 0, w, h).data, pts = [], st = 3, used = 3, i, j;
    for (; st >= 1; st--) {
      pts = []; used = st;
      for (j = 0; j < h; j += st) for (i = 0; i < w; i += st) if (d[(j * w + i) * 4 + 3] > 140) pts.push(i, j);
      if (pts.length / 2 >= cnt) break;
    }
    var n = pts.length / 2, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, k;
    for (k = 0; k < n; k++) { minx = Math.min(minx, pts[2 * k]); maxx = Math.max(maxx, pts[2 * k]); miny = Math.min(miny, pts[2 * k + 1]); maxy = Math.max(maxy, pts[2 * k + 1]); }
    var ox = cx - (minx + maxx) / 2, oy = cy - (miny + maxy) / 2;
    var idx = new Array(n); for (k = 0; k < n; k++) idx[k] = k;
    for (k = 0; k < Math.min(cnt, n); k++) { var r = k + Math.floor(rnd() * (n - k)), t = idx[k]; idx[k] = idx[r]; idx[r] = t; }
    var out = new Float32Array(cnt * 2), jit = used * 0.5;
    for (k = 0; k < cnt; k++) {
      var s = idx[k % n];
      out[2 * k] = pts[2 * s] + ox + (k >= n ? (rnd() - 0.5) * jit * 2 : 0);
      out[2 * k + 1] = pts[2 * s + 1] + oy + (k >= n ? (rnd() - 0.5) * jit * 2 : 0);
    }
    return out;
  }
  function gridPoints() {
    var out = new Float32Array(N * 2), cols = Math.ceil(Math.sqrt(N * W / H)), rows = Math.ceil(N / cols), sx = W / cols, sy = H / rows;
    for (var k = 0; k < N; k++) { out[2 * k] = sx * ((k % cols) + 0.5); out[2 * k + 1] = sy * (Math.floor(k / cols) + 0.5); }
    return out;
  }
  function landscapePoints() {
    rowsN = mqSmall.matches ? 20 : 32; perRow = Math.ceil(N / rowsN);
    var out = new Float32Array(N * 2);
    for (var k = 0; k < N; k++) {
      var r = Math.floor(k / perRow), q = k % perRow, t = r / (rowsN - 1), u = q / (perRow - 1);
      var base = H * (0.2 + 0.7 * Math.pow(t, 1.4)), amp = H * (0.03 + 0.12 * t);
      var hill = Math.exp(-Math.pow((u - 0.64) / 0.17, 2)) * 1.5 * (1 - 0.35 * t) + Math.exp(-Math.pow((u - 0.18) / 0.12, 2)) * 0.8;
      var h = Math.sin(u * 8 + r * 0.33) * 0.4 + Math.sin(u * 19 - r * 0.55) * 0.18 + Math.sin(u * 3.1 + r * 0.1) * 0.5 + hill;
      out[2 * k] = W * (-0.02 + 1.04 * u);
      out[2 * k + 1] = base - amp * h;
    }
    return out;
  }
  // rangschikken: elk punt krijgt in elke stand de plek met dezelfde rang in x, zodat de overgang rustig stroomt
  function matchTo(order, arr) {
    var idx = new Array(N), k, out = new Float32Array(N * 2);
    for (k = 0; k < N; k++) idx[k] = k;
    idx.sort(function (a, b) { return (arr[2 * a] - arr[2 * b]) || (arr[2 * a + 1] - arr[2 * b + 1]); });
    for (k = 0; k < N; k++) { var s = idx[order[k]]; out[2 * k] = arr[2 * s]; out[2 * k + 1] = arr[2 * s + 1]; }
    return out;
  }

  function targets() {
    var small = mqSmall.matches;
    seed = 12345;
    var FA = '600 {s} Newsreader, Georgia, serif', A;
    if (small) {
      // op een smal scherm in twee regels, zodat het woord groot genoeg blijft
      var n1 = Math.round(N * 0.56), a1 = textPoints('Platfor', FA, 0.9, W / 2, H * 0.14, H * 0.13, n1), a2 = textPoints('Maat', FA, 0.7, W / 2, H * 0.29, H * 0.13, N - n1);
      A = new Float32Array(N * 2); A.set(a1, 0); A.set(a2, n1 * 2);
    } else A = textPoints('PlatforMaat', FA, 0.88, W / 2, H * 0.33, H * 0.4);
    var B = gridPoints();
    var C = landscapePoints();
    var D = textPoints('bouwt', 'italic 500 {s} Newsreader, Georgia, serif', small ? 0.86 : 0.64, W / 2, H * (small ? 0.4 : 0.46), H * 0.6);
    // volgorde van C (rij na rij) is de basis; de rang in x van C bepaalt welke plek de andere standen krijgen
    var order = new Array(N), k;
    for (k = 0; k < N; k++) order[k] = k;
    var cs = new Array(N); for (k = 0; k < N; k++) cs[k] = k;
    cs.sort(function (a, b) { return (C[2 * a] - C[2 * b]) || (C[2 * a + 1] - C[2 * b + 1]); });
    var rank = new Int32Array(N); for (k = 0; k < N; k++) rank[cs[k]] = k;
    T = [matchTo(rank, A), matchTo(rank, B), C, matchTo(rank, D)];
  }

  // ---------- WebGL ----------
  var POS = [
    'attribute vec2 a0; attribute vec2 a1; attribute vec2 a2; attribute vec2 a3; attribute float aS;',
    'uniform vec2 uR; uniform float uT; uniform float uTime; uniform float uDpr; uniform vec2 uM; uniform float uMr; uniform float uMo; uniform vec4 uSz;',
    'varying float vC;',
    'float ez(float x) { return x * x * (3. - 2. * x); }',
    'vec2 place(out float sz) {',
    '  float t = uT; vec2 p; float f;',
    '  if (t < 1.) { f = ez(clamp((t - aS * .35) / .65, 0., 1.)); p = mix(a0, a1, f); sz = mix(uSz.x, uSz.y, f); }',
    '  else if (t < 2.) { f = ez(clamp((t - 1. - aS * .35) / .65, 0., 1.)); p = mix(a1, a2, f); sz = mix(uSz.y, uSz.z, f); }',
    '  else { f = ez(clamp((t - 2. - aS * .35) / .65, 0., 1.)); p = mix(a2, a3, f); sz = mix(uSz.z, uSz.w, f); }',
    '  p += vec2(sin(uTime * .7 + aS * 40.), cos(uTime * .6 + aS * 27.)) * .8;',
    '  vec2 d = p - uM; float dist = length(d); float k = smoothstep(uMr, 0., dist);',
    '  p += d / (dist + .001) * k * k * uMr * .55 * uMo;',
    '  return p;',
    '}'
  ].join('\n');
  var VS_P = POS + '\nvoid main() { float sz; vec2 p = place(sz); gl_Position = vec4(p.x / uR.x * 2. - 1., 1. - p.y / uR.y * 2., 0., 1.); gl_PointSize = sz * uDpr; vC = step(aS, .07); }';
  var VS_L = POS + '\nvoid main() { float sz; vec2 p = place(sz); gl_Position = vec4(p.x / uR.x * 2. - 1., 1. - p.y / uR.y * 2., 0., 1.); vC = 0.; }';
  var FS_P = 'precision mediump float; varying float vC; uniform vec3 uInk; uniform vec3 uSig;\nvoid main() { float d = length(gl_PointCoord - .5); float a = 1. - smoothstep(.4, .5, d); if (a < .01) discard; vec3 c = mix(uInk, uSig, vC); gl_FragColor = vec4(c * a, a); }';
  var FS_L = 'precision mediump float; varying float vC; uniform vec3 uInk; uniform float uA;\nvoid main() { gl_FragColor = vec4(uInk * uA, uA); }';

  function program(vs, fs) {
    var mk = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    var v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  }
  function locs(p, names) { var o = {}; names.forEach(function (n) { o[n] = n.charAt(0) === 'a' ? gl.getAttribLocation(p, n) : gl.getUniformLocation(p, n); }); return o; }
  var NAMES = ['a0', 'a1', 'a2', 'a3', 'aS', 'uR', 'uT', 'uTime', 'uDpr', 'uM', 'uMr', 'uMo', 'uSz', 'uInk', 'uSig', 'uA'];

  function initGL() {
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' }) || canvas.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) return false;
    prog = program(VS_P, FS_P); progL = program(VS_L, FS_L);
    if (!prog || !progL) { gl = null; return false; }
    loc = locs(prog, NAMES); locL = locs(progL, NAMES);
    bufs = [gl.createBuffer(), gl.createBuffer(), gl.createBuffer(), gl.createBuffer(), gl.createBuffer()];
    idxBuf = gl.createBuffer();
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    canvas.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); useFallback(); });
    return true;
  }
  function uploadGL() {
    var k, seeds = new Float32Array(N);
    for (k = 0; k < N; k++) seeds[k] = (k * 0.6180339887) % 1;
    for (k = 0; k < 4; k++) { gl.bindBuffer(gl.ARRAY_BUFFER, bufs[k]); gl.bufferData(gl.ARRAY_BUFFER, T[k], gl.STATIC_DRAW); }
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs[4]); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    var idx = [], r, q;
    for (r = 0; r < rowsN; r++) for (q = 0; q < perRow - 1; q++) { var a = r * perRow + q; if (a + 1 < N) idx.push(a, a + 1); }
    idxCount = idx.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  }
  function bindAttribs(L) {
    ['a0', 'a1', 'a2', 'a3'].forEach(function (n, k) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufs[k]); gl.enableVertexAttribArray(L[n]); gl.vertexAttribPointer(L[n], 2, gl.FLOAT, false, 0, 0);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs[4]); gl.enableVertexAttribArray(L.aS); gl.vertexAttribPointer(L.aS, 1, gl.FLOAT, false, 0, 0);
  }
  function setUniforms(L, time, sizes) {
    gl.uniform2f(L.uR, W, H); gl.uniform1f(L.uT, cur); gl.uniform1f(L.uTime, time); gl.uniform1f(L.uDpr, dpr);
    gl.uniform2f(L.uM, mx, my); gl.uniform1f(L.uMr, mqSmall.matches ? 80 : 130); gl.uniform1f(L.uMo, mOn);
    gl.uniform4f(L.uSz, sizes[0], sizes[1], sizes[2], sizes[3]);
    gl.uniform3f(L.uInk, INK[0], INK[1], INK[2]);
  }
  function drawGL(time) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    var sizes = mqSmall.matches ? [1.9, 1.7, 1.1, 2.1] : [2.5, 2, 1.3, 2.7];
    var la = 1 - clamp(Math.abs(cur - 2) / 0.45, 0, 1);
    if (la > 0.01) {
      gl.useProgram(progL); bindAttribs(locL); setUniforms(locL, time, sizes); gl.uniform1f(locL.uA, 0.55 * la);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf); gl.drawElements(gl.LINES, idxCount, gl.UNSIGNED_SHORT, 0);
    }
    gl.useProgram(prog); bindAttribs(loc); setUniforms(loc, time, sizes); gl.uniform3f(loc.uSig, SIG[0], SIG[1], SIG[2]);
    gl.drawArrays(gl.POINTS, 0, N);
  }

  // ---------- canvas 2D (terugval) ----------
  function draw2d(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var t = cur, s0 = t < 1 ? 0 : t < 2 ? 1 : 2, a = T[s0], b = T[s0 + 1], ft = t - s0, k, x, y, f, p, sz;
    var S = mqSmall.matches ? [1.9, 1.7, 1.1, 2.1] : [2.5, 2, 1.3, 2.7], r = mqSmall.matches ? 80 : 130;
    var pts = new Float32Array(N * 2);
    ctx.fillStyle = 'rgb(17,19,21)';
    var sig = [];
    for (k = 0; k < N; k++) {
      var sd = (k * 0.6180339887) % 1;
      f = clamp((ft - sd * 0.35) / 0.65, 0, 1); f = f * f * (3 - 2 * f);
      x = a[2 * k] + (b[2 * k] - a[2 * k]) * f; y = a[2 * k + 1] + (b[2 * k + 1] - a[2 * k + 1]) * f;
      x += Math.sin(time * 0.7 + sd * 40) * 0.8; y += Math.cos(time * 0.6 + sd * 27) * 0.8;
      if (mOn > 0.01) {
        var dx = x - mx, dy = y - my, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r) { p = 1 - dist / r; p = p * p * (3 - 2 * p); x += dx / (dist + 0.001) * p * p * r * 0.55 * mOn; y += dy / (dist + 0.001) * p * p * r * 0.55 * mOn; }
      }
      pts[2 * k] = x; pts[2 * k + 1] = y;
      sz = S[s0] + (S[s0 + 1] - S[s0]) * f;
      if (sd < 0.07) { sig.push(x, y, sz); continue; }
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
    ctx.fillStyle = 'rgb(255,74,28)';
    for (k = 0; k < sig.length; k += 3) { ctx.beginPath(); ctx.arc(sig[k], sig[k + 1], sig[k + 2] / 2 + 0.2, 0, 6.283); ctx.fill(); }
    var la = 1 - clamp(Math.abs(t - 2) / 0.45, 0, 1);
    if (la > 0.01) {
      ctx.strokeStyle = 'rgba(17,19,21,' + (0.55 * la).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath();
      for (var rr = 0; rr < rowsN; rr++) for (var q = 0; q < perRow; q++) {
        var i = rr * perRow + q; if (i >= N) break;
        if (q === 0) ctx.moveTo(pts[2 * i], pts[2 * i + 1]); else ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
      }
      ctx.stroke();
    }
  }
  function useFallback() {
    if (!canvas) return;
    var c = document.createElement('canvas');
    c.className = canvas.className; c.setAttribute('aria-hidden', 'true');
    canvas.parentNode.replaceChild(c, canvas);
    canvas = c; gl = null; ctx = canvas.getContext('2d');
    canvas.setAttribute('data-mode', '2d');
    if (ready) layout();
  }

  // ---------- indeling, stand en lus ----------
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var small = mqSmall.matches;
    N = gl ? (small ? 2400 : 6500) : (small ? 1300 : 2800);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    targets();
    if (gl) uploadGL();
  }
  var hhPx = function () { return parseFloat(getComputedStyle(root).getPropertyValue('--hh')) || 0; };
  var tOf = function (p) {
    if (p < 0.08) return 0;
    if (p < 0.3) return (p - 0.08) / 0.22;
    if (p < 0.42) return 1;
    if (p < 0.66) return 1 + (p - 0.42) / 0.24;
    if (p < 0.76) return 2;
    if (p < 0.94) return 2 + (p - 0.76) / 0.18;
    return 3;
  };
  var prog01 = 0;
  function onScroll() {
    var r = scene.getBoundingClientRect(), range = Math.max(1, scene.offsetHeight - stage.clientHeight);
    prog01 = clamp((hhPx() - r.top) / range, 0, 1);
    tgt = tOf(prog01);
    var hc = 1 - sm(0.03, 0.15, prog01);
    scene.style.setProperty('--hc', hc.toFixed(3));
    scene.style.setProperty('--cp', sm(0.12, 0.2, prog01).toFixed(3));
    scene.style.setProperty('--cb', prog01.toFixed(3));
    copy.classList.toggle('gone', hc < 0.1);
    if (cue) cue.classList.toggle('off', window.scrollY > 40);
    var ci = Math.round(tgt);
    if (ci !== capIdx) { capIdx = ci; capI.textContent = String(ci + 1).padStart(2, '0'); capT.textContent = CAPS[ci]; }
    drawThread();
    kick();
  }

  function loop(now) {
    raf = 0;
    if (!running) return;
    // ongeveer 40 beelden per seconde bij de terugval, volle snelheid met WebGL
    if (!gl && now - lastDraw < 24) { raf = requestAnimationFrame(loop); return; }
    lastDraw = now;
    cur += (tgt - cur) * 0.12; if (Math.abs(tgt - cur) < 0.0008) cur = tgt;
    mx += (tmx - mx) * 0.3; my += (tmy - my) * 0.3; mOn += (tOn - mOn) * 0.12;
    if (gl) drawGL(now / 1000); else if (ctx) draw2d(now / 1000);
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (ready && inView && !document.hidden && !running) { running = true; raf = requestAnimationFrame(loop); } }
  function halt() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function init() {
    if (ready) return;
    if (!force2d && initGL()) canvas.setAttribute('data-mode', 'webgl');
    else { gl = null; ctx = canvas.getContext('2d'); canvas.setAttribute('data-mode', '2d'); }
    layout();
    ready = true;
    cur = tgt = tOf(prog01);
    onScroll();
    cur = tgt;
    kick();
  }

  if (scene && stage && canvas && copy) {
    window.addEventListener('scroll', function () { if (!onScroll.q) { onScroll.q = true; requestAnimationFrame(function () { onScroll.q = false; onScroll(); }); } }, { passive: true });
    var rz = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () { if (ready) { layout(); onScroll(); } }, 160);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) kick(); else halt(); }).observe(scene);
    document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else kick(); });
    if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      stage.addEventListener('pointermove', function (ev) {
        var r = stage.getBoundingClientRect();
        tmx = ev.clientX - r.left; tmy = ev.clientY - r.top; tOn = 1;
        if (mOn < 0.01) { mx = tmx; my = tmy; }
      }, { passive: true });
      stage.addEventListener('pointerleave', function () { tOn = 0; });
    }
    // toetsenbord: wie een link in de hero bereikt terwijl de hero is weggefaded, gaat terug naar het begin
    copy.addEventListener('focusin', function () { if (copy.classList.contains('gone')) window.scrollTo({ top: 0, behavior: 'instant' }); });
    // links naar een onderdeel (#aanbod …): gewone anker-scroll, zacht
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a) return;
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t) return;
      ev.preventDefault();
      var y = a.getAttribute('href') === '#top' ? 0 : t.getBoundingClientRect().top + window.scrollY - hhPx() - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      var h = '#' + a.getAttribute('href').slice(1);
      if (location.hash !== h) { try { history.pushState(null, '', h); } catch (e) { /* bestand zonder geschiedenis: de hash blijft zoals hij was */ } }
    });
    // Terugknop of een gedeelde link met #onderdeel: scroll erheen.
    var toHash = function (instant) {
      if (location.hash.length < 2) return;
      var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!el) return;
      var y = location.hash === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY - hhPx() - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: instant ? 'instant' : 'smooth' });
    };
    window.addEventListener('hashchange', function () { toHash(false); });
    window.addEventListener('load', function () { toHash(true); });
    var go = function () { init(); };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('600 100px Newsreader'), document.fonts.load('italic 500 100px Newsreader')]).then(go, go);
      setTimeout(go, 2500);
    } else { go(); }
  } else {
    window.addEventListener('scroll', drawThread, { passive: true });
    drawThread();
  }
})();
