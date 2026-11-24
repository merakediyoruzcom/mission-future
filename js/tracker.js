/* Mission: Future — Gölge Veri (Shadow Data) Toplayıcı
 * Tıklama Isı Haritası, Tereddüt Süresi, Hata Sonrası Tepki (Yılmazlık) ve Ses tercihi dahil
 * tüm davranışsal metadata burada toplanır.
 */
window.MF = window.MF || {};

MF.Tracker = (function () {
  const KEY = 'mf_sessions';
  let s = null;
  let saveTimer = null;
  let sessionStartedAt = 0;
  const pending = {};

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  }
  function saveAll(all) {
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { console.warn('Depolama hatası', e); }
  }
  function persist() {
    if (!s) return;
    if (sessionStartedAt) {
      s.playTimeSec = (s.playTimeSec || 0) + Math.round((performance.now() - sessionStartedAt) / 1000);
      sessionStartedAt = performance.now();
    }
    const all = loadAll();
    s.updatedAt = new Date().toISOString();
    all[s.code] = s;
    saveAll(all);
  }
  function dirty() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 250);
  }

  function begin(code, studentName = '') {
    const all = loadAll();
    s = all[code] || {
      code,
      studentName: studentName || '',
      createdAt: new Date().toISOString(),
      status: 'active',
      dayReached: 1,
      sessions: 0,
      playTimeSec: 0,
      audioMuted: false,
      counters: {},
      pkys: { strategist: 0, systemist: 0, maker: 0, explorer: 0, connector: 0, designer: 0 },
      decisions: [],
      events: [],
      daily: [],
      heatmap: [], // { x: 0..100, y: 0..100, zone: 'visual'|'text'|'ui' }
      flagData: null, // { dataUrl, message, durationMs, strokes, colorsUsed, symmetryUsed }
      result: null,
    };
    if (studentName) s.studentName = studentName;
    s.pkys = s.pkys || { strategist: 0, systemist: 0, maker: 0, explorer: 0, connector: 0, designer: 0 };
    s.heatmap = s.heatmap || [];
    s.sessions += 1;
    sessionStartedAt = performance.now();
    event('session_start', { session: s.sessions });
    persist();
  }

  function addPkys(scores = {}) {
    if (!s) return;
    s.pkys = s.pkys || { strategist: 0, systemist: 0, maker: 0, explorer: 0, connector: 0, designer: 0 };
    Object.entries(scores).forEach(([k, v]) => {
      if (s.pkys[k] != null) s.pkys[k] += v;
    });
    dirty();
  }

  function event(type, data = {}) {
    if (!s) return;
    s.events.push({ ts: Date.now(), type, ...data });
    if (s.events.length > 3000) s.events.shift();
    dirty();
  }

  function count(key, n = 1) {
    if (!s) return;
    s.counters[key] = (s.counters[key] || 0) + n;
    dirty();
  }

  /** Tıklama Isı Haritası: Ekranda nereye tıklıyor? (Görsel odaklı mı, metin odaklı mı?) */
  function recordClick(e) {
    if (!s) return;
    const x = Math.round((e.clientX / Math.max(1, innerWidth)) * 100);
    const y = Math.round((e.clientY / Math.max(1, innerHeight)) * 100);
    const t = e.target;
    let zone = 'ui';
    if (t.closest('#scene, .map-visual, .flag-canvas-wrap, .td-grid, .rhythm-pads, .avatar')) {
      zone = 'visual';
      count('visualClicks');
    } else if (t.closest('.brief, .manual, .sensor-card, .code-editor, .bubble, p')) {
      zone = 'text';
      count('textClicks');
    } else {
      count('uiClicks');
    }
    s.heatmap = s.heatmap || [];
    s.heatmap.push({ x, y, zone });
    if (s.heatmap.length > 400) s.heatmap.shift();
    dirty();
  }

  addEventListener('pointerdown', recordClick, { passive: true });

  /** Bir karar anını başlatır: süre ve seçenekler arası gezinmeyi ölçer. */
  function startDecision(id, root) {
    const p = { start: performance.now(), visits: 0, last: null };
    pending[id] = p;
    if (root) {
      const onVisit = (e) => {
        const opt = e.target.closest('[data-opt]');
        if (opt && opt.dataset.opt !== p.last) { p.visits += 1; p.last = opt.dataset.opt; }
      };
      root.addEventListener('pointerover', onVisit);
      root.addEventListener('focusin', onVisit);
    }
  }

  function endDecision(id, choice, extra = {}) {
    const p = pending[id];
    const rec = {
      id,
      day: extra.day,
      choice,
      label: extra.label || choice,
      latencyMs: p ? Math.round(performance.now() - p.start) : (extra.latencyMs ?? null),
      hoverSwitches: p ? Math.max(0, p.visits - 1) : 0,
      tags: extra.tags || {},
      pkys: extra.pkys || {},
      meta: extra.meta || {},
      passive: !!extra.passive,
    };
    delete pending[id];
    if (s) {
      s.decisions.push(rec);
      if (extra.pkys) addPkys(extra.pkys);
      dirty();
    }
    return rec;
  }

  function daily(snap) {
    if (!s) return;
    s.daily.push(snap);
    s.dayReached = Math.max(s.dayReached, snap.day);
    dirty();
  }

  function set(key, value) { if (s) { s[key] = value; dirty(); } }
  function get() { return s; }
  function flush() { clearTimeout(saveTimer); persist(); }

  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (!s) return;
    event(document.hidden ? 'tab_hidden' : 'tab_visible');
    if (document.hidden) flush();
  });

  return { begin, addPkys, event, count, startDecision, endDecision, daily, set, get, flush, loadAll, saveAll, KEY };
})();
