// tts-mimo.js · Wonder 朗读替换为 MiMo 音频（逐句连播 + 句级 CSS Highlight）
// 依赖：页面先加载 wu-data/uNN.js（window.WU_DATA）
(function(){
  var WU = window.WU_DATA;
  if (!WU) return;
  var bar = document.getElementById('tts-bar');
  var stateEl = document.getElementById('tts-state');
  var selSpeed = document.getElementById('tts-speed');
  if (!bar) return;

  var a = document.createElement('audio');
  a.style.display = 'none';
  document.body.appendChild(a);

  // ---- 展开句子（unit 内全局句序）----
  var flat = [];
  WU.segs.forEach(function(seg, si){
    seg.paras.forEach(function(p, pi){
      p.sents.forEach(function(s){
        flat.push({ si: si, pi: pi, s: s.s, e: s.e, t: s.t, n: flat.length + 1 });
      });
    });
  });
  function fileOf(n){
    return 'audio/wonder/u' + ('0' + WU.u).slice(-2) + '/s' + ('0000' + n).slice(-4) + '.mp3';
  }
  function paraEl(si, pi){
    var segs = document.querySelectorAll('.segment');
    var seg = segs[si]; if (!seg) return null;
    var ps = seg.querySelectorAll('.body p');
    return ps[pi] || null;
  }

  // ---- 状态 ----
  var playing = false, mode = null;   // mode: 'seg' | 'para'
  var curIdx = -1, endIdx = -1, lastCounted = false;
  var rate = 1;
  try { var sv = parseFloat(localStorage.getItem('wonder_speed')); if ([0.75,1,1.25,1.5,2].indexOf(sv) >= 0) rate = sv; } catch(e){}
  if (selSpeed) selSpeed.value = String(rate);
  a.playbackRate = rate;

  var karaoke = ('CSS' in window) && window.CSS.highlights && ('Highlight' in window);
  var curPara = null, curMap = null;

  function buildMap(p){
    var nodes = [], text = '';
    var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = walker.nextNode())) {
      nodes.push({ node: n, start: text.length });
      text += n.textContent;
      nodes[nodes.length - 1].end = text.length;
    }
    return { text: text, nodes: nodes };
  }
  function highlightRange(p, s, e){
    if (!karaoke || !p) return;
    var map = buildMap(p);
    var ranges = [];
    for (var i = 0; i < map.nodes.length; i++) {
      var seg = map.nodes[i];
      if (seg.end <= s || seg.start >= e) continue;
      var rs = Math.max(seg.start, s) - seg.start;
      var re = Math.min(seg.end, e) - seg.start;
      var r = document.createRange();
      r.setStart(seg.node, rs);
      r.setEnd(seg.node, re);
      ranges.push(r);
    }
    try { window.CSS.highlights.set('tts-karaoke', new Highlight(...ranges)); } catch(err){}
  }
  function clearHighlights(){
    var as = document.querySelectorAll('.body p.reading');
    for (var i = 0; i < as.length; i++) as[i].classList.remove('reading');
    if (karaoke) { try { window.CSS.highlights.delete('tts-karaoke'); } catch(e){} }
  }
  function showBar(t){ stateEl.textContent = t || '朗读中…'; bar.classList.add('show'); updateBar(); }
  function hideBar(){ bar.classList.remove('show'); }
  function updateBar(){ var b = document.getElementById('tts-play'); if (b) b.textContent = playing ? '⏸' : '▶'; }

  function playAt(idx, mode_, endIdx_){
    if (idx < 0 || idx >= flat.length) return;
    mode = mode_; endIdx = (endIdx_ == null ? flat.length - 1 : endIdx_);
    curIdx = idx;
    playing = true;
    showBar('朗读中…');
    next();
  }
  function next(){
    if (!playing) return;
    if (curIdx > endIdx) { finish(); return; }
    var it = flat[curIdx];
    var p = paraEl(it.si, it.pi);
    if (!p) { curIdx++; next(); return; }
    clearHighlights();
    p.classList.add('reading');
    try { p.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch(e){}
    a.src = fileOf(it.n);
    a.playbackRate = rate;
    a.play();
    highlightRange(p, it.s, it.e);
    stateEl.textContent = '第 ' + (curIdx + 1) + ' / ' + flat.length + ' 句';
  }
  a.addEventListener('ended', function(){ curIdx++; next(); });
  a.addEventListener('error', function(){ curIdx++; next(); });

  // ---- 入口：朗读整个 segment / 朗读某段 ----
  window.__readSeg = function(btn){
    var seg = btn.closest('.segment');
    var si = 0, found = -1;
    var segs = document.querySelectorAll('.segment');
    for (var i = 0; i < segs.length; i++) if (segs[i] === seg) { si = i; break; }
    // 该 segment 句范围
    for (var j = 0; j < flat.length; j++) {
      if (flat[j].si === si) { if (found < 0) found = j; }
      else if (found >= 0) { break; }
    }
    if (found < 0) return;
    var last = found;
    for (var k = found; k < flat.length; k++) if (flat[k].si === si) last = k;
    playAt(found, 'seg', last);
  };
  // 点击段落正文 → 从该段第一句读到段末
  document.addEventListener('click', function(e){
    var t = e.target;
    if (t && t.nodeType === 3) t = t.parentNode;
    if (!t || !t.closest) return;
    var p = t.closest('.body p');
    if (!p) return;
    if (t !== p) return;
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    var segs = document.querySelectorAll('.segment');
    var si = -1;
    for (var i = 0; i < segs.length; i++) if (segs[i].contains(p)) { si = i; break; }
    if (si < 0) return;
    var ps = segs[si].querySelectorAll('.body p');
    var pi = -1;
    for (var j = 0; j < ps.length; j++) if (ps[j] === p) { pi = j; break; }
    if (pi < 0) return;
    var first = -1, last = -1;
    for (var k = 0; k < flat.length; k++) {
      if (flat[k].si === si && flat[k].pi === pi) { if (first < 0) first = k; last = k; }
    }
    if (first >= 0) playAt(first, 'para', last);
  });

  // ---- tts-bar 控制 ----
  window.__ttsStop = function(){
    playing = false; a.pause();
    try { a.removeAttribute('src'); } catch(e){}
    clearHighlights();
    hideBar();
    curIdx = -1;
  };
  window.__ttsPlay = function(){
    if (!playing) {
      if (curIdx < 0) return;
      playing = true; updateBar(); a.play();
    } else {
      if (!a.paused) { a.pause(); playing = false; updateBar(); }
      else { playing = true; updateBar(); a.play(); }
    }
  };
  if (selSpeed) selSpeed.addEventListener('change', function(){
    rate = parseFloat(selSpeed.value);
    a.playbackRate = rate;
    try { localStorage.setItem('wonder_speed', String(rate)); } catch(e){}
  });
  window.addEventListener('beforeunload', function(){ try { a.pause(); } catch(e){} });
})();
