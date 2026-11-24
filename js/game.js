/* Mission: Future — Oyun döngüsü, Bükülme (Kazanan/Kaybeden Yok) ve PKYS Sonuç Ekranı */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const T = MF.Tracker;
  const A = MF.Audio;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  let code = null;
  let state = null;
  let checkpoint = null;
  let busy = false;
  let dialogOpen = false;

  /* ---------- Kayıt ---------- */
  const saveKey = (c) => `mf_save_${c}`;
  function save() {
    if (!code || !state) return;
    try { localStorage.setItem(saveKey(code), JSON.stringify({ state, checkpoint })); } catch { /* depolama dolu */ }
  }
  function loadSave(c) {
    try { return JSON.parse(localStorage.getItem(saveKey(c))); } catch { return null; }
  }

  /* ---------- Başlangıç ekranı ---------- */
  const codeInput = $('#code');
  const nameInput = $('#studentName');
  const normalize = (v) => v.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  function genCode() {
    const n = String(Math.floor(1000 + Math.random() * 9000));
    const l = 'ABCDEFGHJKLMNPRSTUVYZ'[Math.floor(Math.random() * 21)];
    return `NX-${n}${l}`;
  }
  function updateContinue() {
    const c = normalize(codeInput.value);
    const sv = c && loadSave(c);
    $('#continueBtn').hidden = !(sv && sv.state);
  }
  codeInput.addEventListener('input', updateContinue);
  $('#genCode').addEventListener('click', () => { codeInput.value = genCode(); updateContinue(); codeInput.focus(); });
  codeInput.value = localStorage.getItem('mf_last_code') || '';
  nameInput.value = localStorage.getItem('mf_last_name') || '';
  updateContinue();

  $('#startForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = normalize(codeInput.value);
    if (!/^[A-Z0-9-]{3,12}$/.test(c)) {
      codeInput.setCustomValidity('e-Okul No veya Kod 3–12 karakter olmalı.');
      codeInput.reportValidity();
      codeInput.setCustomValidity('');
      return;
    }
    beginGame(c, nameInput.value.trim(), false);
  });
  $('#continueBtn').addEventListener('click', () => beginGame(normalize(codeInput.value), nameInput.value.trim(), true));

  function beginGame(c, studentName, resume) {
    code = c;
    localStorage.setItem('mf_last_code', c);
    if (studentName) localStorage.setItem('mf_last_name', studentName);
    T.begin(c, studentName);
    A?.startAmbience();

    const sv = resume ? loadSave(c) : null;
    if (sv && sv.state) {
      state = sv.state; checkpoint = sv.checkpoint;
      T.event('resume', { day: state.day });
    } else {
      state = MF.newState(); checkpoint = null;
      T.set('status', 'active');
      T.event('new_game');
    }
    $('#start').hidden = true;
    $('#game').hidden = false;
    buildUI();
    MF.Scene.init($('#scene'), () => state);
    renderAll();
    log(resume ? `Gün ${state.day}: Kaptan köprüye geri döndü.` : 'Nova-X Proxima B yörüngesinde. Görev başlıyor!', 'good');
    const ev = MF.EVENT_DAYS[state.day];
    if (ev && !state.seenEvents[ev]) openEvent(ev);
  }

  /* ---------- Arayüz kurulum ---------- */
  function buildUI() {
    const resList = $('#resList');
    resList.innerHTML = '';
    [...MF.RESOURCES, { key: 'morale', name: 'Moral', icon: '🙂', max: 100 }].forEach((r) => {
      const li = document.createElement('li');
      li.className = 'res'; li.dataset.k = r.key; li.dataset.max = r.max;
      li.innerHTML = `<span class="res-icon" aria-hidden="true">${r.icon}</span>
        <span class="res-top"><span class="res-name">${r.name}</span><span><span class="res-val">0</span> <span class="res-delta"></span></span></span>
        <span class="res-bar"><i></i></span>`;
      resList.append(li);
    });

    const grid = $('#buildGrid');
    grid.innerHTML = '';
    Object.entries(MF.BUILDINGS).forEach(([k, b]) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'build'; btn.dataset.b = k;
      btn.innerHTML = `<b>${b.icon} ${b.name} <span class="owned"></span></b><span>${b.desc}</span><span class="cost">🧱 ${b.cost}</span>`;
      grid.append(btn);
    });
    grid.onclick = (e) => { const b = e.target.closest('.build'); if (b) build(b.dataset.b); };

    const crew = $('#crewList');
    crew.innerHTML = '';
    MF.CREW.forEach((c) => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="avatar" style="background:${c.color}" aria-hidden="true">${c.icon}</div>
        <div class="who">${c.name}<small>${c.role}</small></div>
        <button type="button" class="btn btn-sm" data-c="${c.key}">Danış</button>`;
      crew.append(li);
    });
    crew.onclick = (e) => { const b = e.target.closest('[data-c]'); if (b) talk(b.dataset.c); };

    $('#rationSeg').onchange = (e) => setRation(e.target.value, true);
    $('#endDay').onclick = () => { if (!busy && !dialogOpen) { A?.click(); T.count('endDays'); stepDay(); } };
    $('#ffBtn').onclick = fastForward;
    $('#saveExit').onclick = saveExit;

    const audioBtn = $('#audioBtn');
    audioBtn.onclick = () => {
      const on = A.toggle();
      audioBtn.setAttribute('aria-pressed', String(on));
      audioBtn.textContent = on ? '🔊 Ses: Açık' : '🔇 Ses: Kapalı';
    };
  }

  /* ---------- Render ---------- */
  function renderAll() {
    $('#dayNum').textContent = `Gün ${state.day}`;
    const pills = $('#chapterPills');
    if (pills) {
      pills.innerHTML = MF.CHAPTERS.map((ch) => {
        const done = !!state.seenEvents[ch.key];
        const cur = state.day >= ch.day && !done;
        return `<span class="ch-pill ${done ? 'done' : cur ? 'cur' : ''}" title="${ch.title} (${ch.sub})">Bölüm ${ch.num} ${done ? '✔' : ''}</span>`;
      }).join('');
    }

    const d = MF.dailyDelta(state);
    document.querySelectorAll('.res').forEach((li) => {
      const k = li.dataset.k;
      const v = k === 'morale' ? state.morale : state.res[k];
      const max = +li.dataset.max;
      li.querySelector('.res-val').textContent = Math.round(v);
      li.querySelector('.res-bar > i').style.width = `${Math.min(100, (v / max) * 100)}%`;
      const dv = d[k];
      const del = li.querySelector('.res-delta');
      if (dv == null) { del.textContent = ''; } else {
        const r = Math.round(dv * 10) / 10;
        del.textContent = r === 0 ? '±0' : `${r > 0 ? '+' : ''}${r}`;
        del.className = `res-delta ${r > 0 ? 'up' : r < 0 ? 'down' : ''}`;
      }
    });
    document.querySelectorAll('.build').forEach((b) => {
      const k = b.dataset.b;
      b.disabled = state.res.materials < MF.BUILDINGS[k].cost || dialogOpen;
      b.querySelector('.owned').textContent = `×${state.buildings[k]}`;
    });
    const r = document.querySelector(`#r-${state.ration}`);
    if (r) r.checked = true;
    MF.Scene.refresh();
  }

  function log(text, cls = '') {
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = `<time>G${state ? state.day : 1}</time>`;
    li.append(document.createTextNode(text));
    const ul = $('#log');
    ul.prepend(li);
    while (ul.children.length > 40) ul.lastChild.remove();
    $('#caption').textContent = text;
  }

  /* ---------- Oyuncu eylemleri ---------- */
  function build(k) {
    const b = MF.BUILDINGS[k];
    if (state.res.materials < b.cost || dialogOpen) return;
    A?.click();
    state.res.materials -= b.cost;
    state.buildings[k] += 1;
    T.count('builds');
    if (b.pkys) T.addPkys(b.pkys);
    T.event('build', { type: k, day: state.day });
    log(`${b.icon} ${b.name} inşa edildi.`, 'good');
    save(); renderAll();
  }

  function setRation(r, byUser) {
    if (state.ration === r) return;
    state.ration = r;
    if (byUser) {
      A?.click();
      T.count('rationChanges');
      if (r === 'low') T.addPkys({ systemist: 2 });
      if (r === 'high') T.addPkys({ connector: 2 });
      T.event('ration', { value: r, day: state.day });
    }
    log(`Rasyon politikası "${MF.RATIONS[r].name}" olarak güncellendi.`);
    save(); renderAll();
  }

  function talk(k) {
    A?.click();
    const c = MF.CREW.find((x) => x.key === k);
    T.count('crewTalks');
    T.addPkys({ connector: 2 });
    T.event('crew_talk', { who: k, day: state.day });
    log(`${c.name}: "${MF.crewLine(k, state)}"`, 'talk');
  }

  /* ---------- Gün döngüsü (Twist: Kazanan veya Kaybeden Yok!) ---------- */
  function applyEffects(fx = {}) {
    const chips = [];
    const names = { o2: 'O₂', water: 'Su', food: 'Gıda', energy: 'Enerji', materials: 'Malzeme', morale: 'Moral' };
    Object.entries(fx).forEach(([k, v]) => {
      if (!v) return;
      if (k === 'morale') state.morale = Math.max(25, Math.min(100, state.morale + v));
      else if (state.res[k] != null) {
        const max = MF.RESOURCES.find((r) => r.key === k).max;
        state.res[k] = Math.max(15, Math.min(max, state.res[k] + v));
      }
      if (names[k]) chips.push({ text: `${v > 0 ? '+' : ''}${v} ${names[k]}`, dir: v > 0 ? 'up' : 'down' });
    });
    renderAll();
    return chips;
  }

  function stepDay() {
    const d = MF.dailyDelta(state);
    MF.RESOURCES.forEach((r) => {
      state.res[r.key] = Math.max(15, Math.min(r.max, state.res[r.key] + d[r.key]));
    });
    state.morale = Math.max(30, Math.min(100, state.morale + d.morale));

    T.daily({
      day: state.day, ration: state.ration, pop: state.pop, morale: Math.round(state.morale),
      o2: Math.round(state.res.o2), water: Math.round(state.res.water), food: Math.round(state.res.food),
      energy: Math.round(state.res.energy), materials: Math.round(state.res.materials),
    });

    if (state.day >= MF.TOTAL_DAYS) {
      renderAll();
      completeMission();
      return true;
    }

    state.day += 1;
    save(); renderAll();
    const ev = MF.EVENT_DAYS[state.day];
    if (ev && !state.seenEvents[ev]) { openEvent(ev); return true; }
    return false;
  }

  async function fastForward() {
    if (busy || dialogOpen) return;
    A?.click();
    busy = true;
    T.count('fastForwards');
    setControls(false);
    try {
      for (;;) {
        if (stepDay()) break;
        await sleep(reduced ? 0 : 75);
      }
    } finally {
      busy = false;
      setControls(true);
    }
  }

  function setControls(on) {
    ['#endDay', '#ffBtn', '#saveExit'].forEach((s) => { $(s).disabled = !on; });
  }

  function saveExit() {
    save();
    T.event('save_exit', { day: state.day });
    T.flush();
    location.reload();
  }

  /* ---------- Olay penceresi ---------- */
  const dlg = $('#dlg');
  dlg.addEventListener('cancel', (e) => e.preventDefault());

  function makeApi() {
    return {
      s: state,
      body: $('#dlgBody'),
      setHead(eyebrow, title) { $('#dlgEyebrow').textContent = eyebrow; $('#dlgTitle').textContent = title; },
      decide(id, choice, opts = {}) { return T.endDecision(id, choice, { ...opts, day: state.day }); },
      apply: applyEffects,
      setRation: (r) => setRation(r, false),
      finish(text, chips = []) {
        const body = $('#dlgBody');
        body.innerHTML = '';
        const out = document.createElement('div');
        out.className = 'outcome';
        out.innerHTML = `<p style="margin:0">${text}</p>${chips.length ? `<div class="effects">${chips.map((c) => `<span class="chip ${c.dir}">${c.text}</span>`).join('')}</div>` : ''}`;
        const actions = document.createElement('div');
        actions.className = 'dlg-actions';
        actions.innerHTML = '<button type="button" class="btn btn-primary">Göreve Devam Et →</button>';
        actions.firstChild.addEventListener('click', () => this.close());
        body.append(out, actions);
        actions.firstChild.focus();
        log(text.replace(/<[^>]+>/g, ''), 'good');
      },
      close() {
        dlg.close();
        dialogOpen = false;
        save(); renderAll();
      },
    };
  }

  function openEvent(key) {
    checkpoint = clone(state);
    state.seenEvents[key] = true;
    T.event('scenario_open', { key, day: state.day });
    dialogOpen = true;
    renderAll();
    dlg.showModal();
    $('#dlgBody').scrollTop = 0;
    MF.Scenarios[key](makeApi());
    save();
  }

  /* ---------- 100. Gün Sonuç & PKYS Karakter/Kariyer Raporu ---------- */
  function completeMission() {
    A?.ok();
    T.event('colony_survived', { pop: state.pop, morale: Math.round(state.morale) });
    T.set('status', 'completed');
    T.set('result', { outcome: 'completed', day: state.day, pop: state.pop, morale: Math.round(state.morale) });
    T.flush();
    localStorage.removeItem(saveKey(code));

    const s = T.get();
    const p = MF.Profile.compute(s);
    const top = p.primary;
    const sec = p.secondary;
    const cb = p.careerBridge;
    const flagImg = s.flagData?.dataUrl ? `<img src="${s.flagData.dataUrl}" alt="Tasarladığın Koloni Bayrağı" class="end-flag-img">` : '';

    dialogOpen = true;
    $('#dlgEyebrow').textContent = '100. Gün Tamamlandı · PKYS Karakter & Kariyer Raporu';
    $('#dlgTitle').textContent = `🏆 Tebrikler Kaptan ${s.studentName || s.code}!`;
    const body = $('#dlgBody');
    body.innerHTML = `
      <p>Proxima B'de ilk 100 günü tamamladın! Bu yolculukta doğru ya da yanlış yoktu; verdiğin her karar senin özgün karakter profilini ortaya çıkardı.</p>
      <div class="career-box">
        <div class="career-head">
          <span class="career-badge">${top.icon} Baskın Karakter: %${top.pct} ${top.name} (${top.sub})</span>
          <span class="career-code">İkincil Güç: ${sec.icon} %${sec.pct} ${sec.name}</span>
        </div>
        <h3 class="career-role">🌌 Nova-X Koloni Ataman: ${cb.colonyTitle}</h3>
        <p class="career-why">${cb.whyCareer}</p>
        ${flagImg ? `<div class="end-flag-row">${flagImg}<div><b>Dünya'ya Mesajın:</b><p class="hint" style="margin:.2rem 0 0">"${s.flagData.message}"</p></div></div>` : ''}
        <div class="career-cols">
          <div class="career-col">
            <h4>🌍 Bugünün Meslek Rotaları</h4>
            <div class="career-chips">${cb.classic.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
          </div>
          <div class="career-col">
            <h4>🚀 2085 & Geleceğin Rotaları</h4>
            <div class="career-chips">${cb.future.map((c) => `<span class="chip up">${c}</span>`).join('')}</div>
          </div>
        </div>
        <h4 class="riasec-title">PKYS 6 Karakter Haritan</h4>
        <div class="riasec-bars">
          ${p.ranked.map((r) => `
            <div class="r-row">
              <div class="r-top"><span>${r.icon} <b>${r.name}</b> · ${r.sub}</span><span class="r-pct">%${r.pct}</span></div>
              <div class="r-bar"><i style="width:${r.pct}%;background:${r.color}"></i></div>
            </div>`).join('')}
        </div>
      </div>
      <div class="dlg-actions">
        <a class="btn" href="teacher.html">📊 Öğretmen Panelinde Detaylı İncele</a>
        <button type="button" class="btn btn-primary" id="finishRestart">Ana Menüye Dön</button>
      </div>
    `;
    body.querySelector('#finishRestart').addEventListener('click', () => location.reload());
    if (!dlg.open) dlg.showModal();
  }

  /* ---------- Çevrimdışı durum ---------- */
  function updateNet() {
    const on = navigator.onLine;
    ['#net', '#netStart'].forEach((s) => {
      const n = $(s);
      n.textContent = on ? '● Çevrimiçi' : '● Çevrimdışı · veriler cihazda';
      n.classList.toggle('offline', !on);
    });
    if (on && T.get()) T.event('sync_window');
  }
  addEventListener('online', updateNet);
  addEventListener('offline', updateNet);
  updateNet();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
