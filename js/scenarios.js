/* Mission: Future — GDD 4 Ana Kriz Bölümü + Ara Koloni Kararları
 * Bölüm 1: İniş Alanı Seçimi (Stratejist vs. Sistemci)
 * Bölüm 2: Oksijen Filtresi Arızası (Yapıcı [Sürükle/Eşleştir] vs. Kaşif [Kod Bug Bulma])
 * Bölüm 3: İlk Temas (Bağ Kurucu [Mini Ritim Oyunu] vs. Stratejist [Kule Savunma])
 * Bölüm 4: Koloni Bayrağı ve Mesajı (Tasarımcı & Sabır [Çizim + Simetri + Renk Analizi])
 */
window.MF = window.MF || {};

(function () {
  const T = () => MF.Tracker;
  const A = () => MF.Audio;

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  const crew = (k) => MF.CREW.find((c) => c.key === k) || MF.CREW[0];
  function speaker(k, text) {
    const c = crew(k);
    return `<div class="speaker"><div class="avatar" style="background:${c.color}" aria-hidden="true">${c.icon}</div>
      <div class="bubble"><b>${c.name} · ${c.role}</b>${text}</div></div>`;
  }

  const S = {};

  /* =========================================================================
   * BÖLÜM 1: İniş Alanı Seçimi (Stratejist vs. Sistemci) — Gün 1
   * ========================================================================= */
  S.landing = (api) => {
    api.setHead('BÖLÜM 1 · Gün 1 · Yörünge Alçalışı', 'İniş Alanı Seçimi');
    const body = api.body;
    body.innerHTML = '';

    const readSet = new Set();
    const t0 = performance.now();

    body.append(el(`<div>${speaker('elif', 'Kaptan, Proxima B atmosferine girdik! Önümüzde iki iniş bölgesi var. İstersen sensör raporlarını (rüzgar, toprak yapısı, taşkın riski) inceleyebilir ya da hemen iniş emri verebilirsin.')}</div>`));

    // İnteraktif gezegen haritası + sensör verileri
    const mapWrap = el(`
      <div class="landing-wrap">
        <div class="map-visual" role="img" aria-label="Proxima B İniş Haritası">
          <svg viewBox="0 0 560 200" class="planet-map">
            <defs>
              <linearGradient id="pmSky" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#141e3c"/>
                <stop offset="100%" stop-color="#3c1f2b"/>
              </linearGradient>
            </defs>
            <rect width="560" height="200" rx="12" fill="url(#pmSky)"/>
            <!-- Dağlar (Seçenek B) -->
            <polygon points="310,165 370,65 435,165" fill="#4b3a5a" stroke="#7ee081" stroke-width="1.5"/>
            <polygon points="390,165 455,50 525,165" fill="#5c476e" stroke="#7ee081" stroke-width="1.5"/>
            <rect x="0" y="160" width="560" height="40" fill="#4a2923"/>
            <!-- Nehir (Seçenek A) -->
            <path d="M 40,60 Q 130,115 95,160 T 185,200" fill="none" stroke="#38bdf8" stroke-width="18" stroke-linecap="round"/>
            <path d="M 40,60 Q 130,115 95,160 T 185,200" fill="none" stroke="#bae6fd" stroke-width="4" stroke-dasharray="6 6"/>
            <!-- Bölge A İşaretçisi -->
            <g class="map-pin" data-site="river" style="cursor:pointer">
              <circle cx="120" cy="128" r="22" fill="rgba(255,179,92,0.22)" stroke="#ffb35c" stroke-width="2"/>
              <circle cx="120" cy="128" r="6" fill="#ffb35c"/>
              <text x="120" y="96" text-anchor="middle" fill="#ffb35c" font-size="12" font-weight="700">A · NEHİR KENARI</text>
            </g>
            <!-- Bölge B İşaretçisi -->
            <g class="map-pin" data-site="mountain" style="cursor:pointer">
              <circle cx="425" cy="120" r="22" fill="rgba(126,224,129,0.22)" stroke="#7ee081" stroke-width="2"/>
              <circle cx="425" cy="120" r="6" fill="#7ee081"/>
              <text x="425" y="88" text-anchor="middle" fill="#7ee081" font-size="12" font-weight="700">B · DAĞ ETEĞİ</text>
            </g>
          </svg>
        </div>

        <div class="sensor-bar">
          <span class="hint">📡 Gezegen Sensör Verileri (İncelemek için tıkla):</span>
          <div class="sensor-btns">
            <button type="button" class="btn btn-sm" data-sensor="hydro">💧 Su & Taşkın Analizi</button>
            <button type="button" class="btn btn-sm" data-sensor="soil">🪨 Toprak & Zemin Yapısı</button>
            <button type="button" class="btn btn-sm" data-sensor="wind">🌬️ Rüzgar & Atmosfer Raporu</button>
          </div>
          <div class="sensor-out" id="sensorOut" hidden></div>
        </div>
      </div>
    `);

    const SENSOR_TEXT = {
      hydro: '<b>💧 Su & Taşkın Raporu:</b> Nehir Kenarı günlük <b>+5 Su</b> bonusu sağlar ancak mevsimsel taşkın olasılığı %42\'dir. Dağ Eteği su kaynağına 4 km uzaktır; su arıtıcı modüllerle desteklenmelidir.',
      soil: '<b>🪨 Toprak & Zemin Raporu:</b> Nehir yatağı alüvyonlu ve yumuşaktır. Dağ Eteği bazalt kayalık üzerine kuruludur; sismik açıdan %96 güvenlidir ve <b>+3 Malzeme</b> sağlar.',
      wind: '<b>🌬️ Rüzgar & Atmosfer Raporu:</b> Dağ Eteği fırtına koridorunun dışındadır, güneş panelleri kesintisiz çalışır. Nehir vadisinde ani rüzgar koridorları oluşabilir.',
    };

    const opts = el(`
      <div class="options" role="group" aria-label="İniş alanı seçenekleri">
        <button type="button" class="opt" data-opt="river">
          <span class="ico">🌊</span>
          <b>Seçenek A: Nehir Kenarı (Riskli ama Kazançlı)</b>
          <span>Su bol (+5 su/gün), hızlı büyüme fırsatı; ancak sel ve taşkın riski yüksek.</span>
        </button>
        <button type="button" class="opt" data-opt="mountain">
          <span class="ico">⛰️</span>
          <b>Seçenek B: Dağ Eteği (Güvenli ve Sürdürülebilir)</b>
          <span>Sağlam bazalt zemin (+3 malzeme/gün), sıfır sel riski; ancak su kaynağına uzak.</span>
        </button>
      </div>
    `);

    body.append(mapWrap, opts);
    T().startDecision('landing', opts);

    mapWrap.querySelectorAll('[data-sensor]').forEach((btn) => {
      btn.addEventListener('click', () => {
        A()?.click();
        const k = btn.dataset.sensor;
        if (!readSet.has(k)) {
          readSet.add(k);
          T().count('sensorReads');
          T(). count('infoRequests');
          T().event('sensor_read', { sensor: k });
        }
        btn.classList.add('active-sensor');
        const out = mapWrap.querySelector('#sensorOut');
        out.hidden = false;
        out.innerHTML = SENSOR_TEXT[k];
      });
    });

    function chooseSite(site) {
      A()?.ok();
      const latencyMs = Math.round(performance.now() - t0);
      const sensorsRead = readSet.size;
      api.s.landingSite = site;

      const pkys = {};
      if (site === 'river') {
        // Hızlı karar verip risk alanı -> Stratejist (Girişimci) puanı artar
        pkys.strategist = latencyMs < 8000 ? 32 : 24;
        if (sensorsRead >= 2) pkys.explorer = 8;
        api.decide('landing', 'river', {
          pkys,
          label: `Seçenek A: Nehir Kenarı (${(latencyMs / 1000).toFixed(1)} sn · ${sensorsRead} veri incelendi)`,
          meta: { sensorsRead, latencyMs },
        });
        const chips = api.apply({ water: 25, food: 10 });
        api.finish('Nova-X Nehir Kenarına indi! Bol su kaynağı sayesinde seralar hızla filizlendi. Cesur ve fırsat odaklı bir başlangıç yaptın.', chips);
      } else {
        // Verileri detaylı inceleyip güvenliği seçeni -> Sistemci (Ekolojik/Düzenli) puanı artar
        pkys.systemist = 24 + sensorsRead * 5;
        if (sensorsRead >= 2) pkys.explorer = 8;
        api.decide('landing', 'mountain', {
          pkys,
          label: `Seçenek B: Dağ Eteği (${(latencyMs / 1000).toFixed(1)} sn · ${sensorsRead} veri incelendi)`,
          meta: { sensorsRead, latencyMs },
        });
        const chips = api.apply({ materials: 25, energy: 10 });
        api.finish('Nova-X Dağ Eteğindeki sağlam bazalt zemine indi! Koloni sel ve fırtınalara karşı tam güvende. Planlı ve sürdürülebilir bir temel attın.', chips);
      }
    }

    opts.addEventListener('click', (e) => {
      const b = e.target.closest('[data-opt]');
      if (b) chooseSite(b.dataset.opt);
    });
    mapWrap.querySelectorAll('.map-pin').forEach((pin) => {
      pin.addEventListener('click', () => chooseSite(pin.dataset.site));
    });
  };

  /* =========================================================================
   * BÖLÜM 2: Arıza ve Onarım (Yapıcı vs. Kaşif) — Gün 25
   * ========================================================================= */
  S.repair = (api) => {
    api.setHead('BÖLÜM 2 · Gün 25 · KIRMIZI ALARM', 'Oksijen Filtresi Arızası!');
    const body = api.body;
    body.innerHTML = '';

    body.append(el(`<div>${speaker('deniz', 'Kaptan! İniş sırasındaki sarsıntıdan dolayı Ana Oksijen Filtresi bozuldu, alarm çalıyor! Nasıl müdahale edeceğiz?')}</div>`));

    const opts = el(`
      <div class="options" role="group" aria-label="Müdahale yöntemi">
        <button type="button" class="opt" data-opt="manual">
          <span class="ico">🧰</span>
          <b>Seçenek A (Müdahale): "Alet çantasını getir!"</b>
          <span>Panel kapağını aç, güç kablolarını ve valfleri kendi ellerinle (Puzzle) tamir et. (Yapıcı / Maker)</span>
        </button>
        <button type="button" class="opt" data-opt="code">
          <span class="ico">💻</span>
          <b>Seçenek B (Analiz): "Yazılımı kontrol et!"</b>
          <span>Tableti aç, O₂ sensör kod satırları arasındaki hatayı (Bug) bulup düzelt. (Kaşif / Analitik)</span>
        </button>
      </div>
    `);
    body.append(opts);
    T().startDecision('repair_path', opts);

    opts.addEventListener('click', (e) => {
      const b = e.target.closest('[data-opt]');
      if (!b) return;
      A()?.click();
      const choice = b.dataset.opt;
      T().endDecision('repair_path', choice, { passive: true, day: api.s.day });
      if (choice === 'manual') runManualPuzzle(api);
      else runCodePuzzle(api);
    });
  };

  /* Bölüm 2A: Mekanik Tamir Bulmacası (Yapıcı / Maker) */
  function runManualPuzzle(api) {
    api.setHead('BÖLÜM 2A · Mekanik Müdahale', '🧰 O₂ Filtre Panelini Onar');
    const body = api.body;
    body.innerHTML = '';
    const t0 = performance.now();
    let attempts = 0;

    const targetMap = { red: 'V1', blue: 'V2', yellow: 'V3', green: 'V4' };
    const cables = [
      { k: 'red', name: 'Kırmızı Yüksek Basınç Hattı', c: '#ef4444', hint: 'V1 (Giriş Valfi)' },
      { k: 'blue', name: 'Mavi Soğutma Sıvısı', c: '#3b82f6', hint: 'V2 (Soğutucu)' },
      { k: 'yellow', name: 'Sarı Karbon Tutucu', c: '#eab308', hint: 'V3 (Filtre Çekirdeği)' },
      { k: 'green', name: 'Yeşil Saf O₂ Çıkışı', c: '#22c55e', hint: 'V4 (Yaşam Kubbesi)' },
    ];
    const ports = [
      { p: 'V2', label: 'V2 · Soğutucu Girişi', color: '#3b82f6' },
      { p: 'V4', label: 'V4 · Yaşam Kubbesi Hattı', color: '#22c55e' },
      { p: 'V1', label: 'V1 · Ana Basınç Valfi', color: '#ef4444' },
      { p: 'V3', label: 'V3 · Karbon Çekirdeği', color: '#eab308' },
    ];
    const conn = {};
    let sel = null;

    body.append(el(`<div>${speaker('deniz', 'Kapağı açtım kaptan! Kabloyu sürükleyip ilgili valfe bırakabilir ya da önce kabloya sonra valfe tıklayabilirsin.')}</div>`));

    const grid = el(`
      <div class="reactor">
        <div class="col">
          <h3>Güç & Akış Kabloları</h3>
          ${cables.map((c) => `<button type="button" class="cable" draggable="true" data-c="${c.k}">
            <span class="sw" style="background:${c.c}"></span>${c.name}<span class="to"></span>
          </button>`).join('')}
        </div>
        <div class="col">
          <h3>Filtre Valfleri</h3>
          ${ports.map((pt) => `<button type="button" class="port" data-p="${pt.p}">
            <span class="sw" style="background:${pt.color};width:10px;height:10px;border-radius:50%"></span>
            <b>${pt.label}</b><span class="from"></span>
          </button>`).join('')}
        </div>
      </div>
    `);
    const status = el('<div class="reactor-status" role="status" aria-live="polite">4 kabloyu renk ve işlevlerine uygun valflere bağla.</div>');
    const actions = el(`
      <div class="dlg-actions" style="justify-content:space-between">
        <button type="button" class="btn btn-sm btn-ghost" data-a="switch">💻 Yazılım analizine geç</button>
        <div style="display:flex;gap:.5rem">
          <button type="button" class="btn btn-sm" data-a="reset">↺ Bağlantıları Sıfırla</button>
          <button type="button" class="btn btn-primary" data-a="test" disabled>🔧 Filtreyi Çalıştır</button>
        </div>
      </div>
    `);
    body.append(grid, status, actions);
    const testBtn = actions.querySelector('[data-a="test"]');

    function connect(cableKey, portKey) {
      A()?.click();
      Object.keys(conn).forEach((k) => { if (conn[k] === portKey) delete conn[k]; });
      conn[cableKey] = portKey;
      sel = null;
      render();
    }

    function render() {
      grid.querySelectorAll('.cable').forEach((b) => {
        b.classList.toggle('sel', b.dataset.c === sel);
        b.querySelector('.to').textContent = conn[b.dataset.c] ? `→ ${conn[b.dataset.c]}` : '';
      });
      grid.querySelectorAll('.port').forEach((b) => {
        const c = cables.find((x) => conn[x.k] === b.dataset.p);
        b.style.borderColor = c ? c.c : '';
        b.querySelector('.from').textContent = c ? c.name.split(' ')[0] : '';
      });
      testBtn.disabled = Object.keys(conn).length < 4;
    }

    // Sürükle-bırak + tıklama desteği
    grid.querySelectorAll('.cable').forEach((b) => {
      b.addEventListener('dragstart', (e) => { sel = b.dataset.c; e.dataTransfer?.setData('text/plain', sel); });
      b.addEventListener('click', () => { sel = b.dataset.c; render(); });
    });
    grid.querySelectorAll('.port').forEach((b) => {
      b.addEventListener('dragover', (e) => e.preventDefault());
      b.addEventListener('drop', (e) => {
        e.preventDefault();
        const cKey = e.dataTransfer?.getData('text/plain') || sel;
        if (cKey) connect(cKey, b.dataset.p);
      });
      b.addEventListener('click', () => { if (sel) connect(sel, b.dataset.p); });
    });

    actions.addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (!a) return;
      if (a === 'reset') {
        T().count('undo');
        Object.keys(conn).forEach((k) => delete conn[k]);
        render();
      } else if (a === 'switch') {
        T().count('puzzleGiveUps');
        runCodePuzzle(api);
      } else if (a === 'test') {
        attempts += 1;
        const okCount = cables.filter((c) => conn[c.k] === targetMap[c.k]).length;
        if (okCount === 4) {
          A()?.ok();
          const solveSec = Math.max(3, Math.round((performance.now() - t0) / 1000));
          api.s.flags.repairChoice = 'maker';
          api.decide('repair', 'manual', {
            latencyMs: solveSec * 1000,
            pkys: { maker: 36, strategist: 6 },
            label: `Mekanik Tamir (Yapıcı · ${solveSec} sn · ${attempts} deneme)`,
            meta: { solveSec, attempts },
          });
          const chips = api.apply({ o2: 25, morale: 8 });
          api.finish(`Alet çantasıyla filtreyi ${solveSec} saniyede onardın! Saf oksijen kubbelere doluyor.`, chips);
        } else {
          A()?.err();
          status.className = 'reactor-status err';
          status.innerHTML = `⚠️ Basınç kaçağı! (${okCount}/4 valf doğru). <button type="button" class="btn btn-sm btn-primary" id="retryInline" style="margin-left:.6rem">Tekrar Dene ↻</button>`;
          status.querySelector('#retryInline')?.addEventListener('click', () => {
            T().count('puzzleRetries');
            T().event('puzzle_retry', { section: 'repair_manual', attempt: attempts });
            status.className = 'reactor-status';
            status.textContent = 'Valf renk ipuçlarına dikkat ederek bağlantıları düzelt.';
          });
        }
      }
    });
  }

  /* Bölüm 2B: Yazılım / Kod Analizi Bulmacası (Kaşif / Analitik) */
  function runCodePuzzle(api) {
    api.setHead('BÖLÜM 2B · Yazılım Analizi', '💻 O₂ Sensör Kodundaki Hatayı (Bug) Bul');
    const body = api.body;
    body.innerHTML = '';
    const t0 = performance.now();
    let attempts = 0;

    body.append(el(`<div>${speaker('kaan', 'O₂ kontrol yazılımında bir mantık hatası (Bug) var! Filtre fanı açılmak yerine kapanıyor. Hatalı satıra tıkla ve düzelt.')}</div>`));

    const lines = [
      { n: 1, code: 'function kontrolOksijenFiltresi(o2Seviyesi) {', bug: false },
      { n: 2, code: '  const hedefSeviye = 95; // %95 saf oksijen eşiği', bug: false },
      { n: 3, code: '  if (o2Seviyesi < hedefSeviye) {', bug: false },
      { n: 4, code: '    filtreFanDurumu = "KAPALI"; // <-- ŞÜPHELİ SATIR', bug: true },
      { n: 5, code: '    alarmGonder("Oksijen seviyesi dengeleniyor");', bug: false },
      { n: 6, code: '  }', bug: false },
      { n: 7, code: '  return filtreFanDurumu;', bug: false },
      { n: 8, code: '}', bug: false },
    ];

    const editor = el(`
      <div class="code-editor" role="group" aria-label="Kod satırları">
        ${lines.map((l) => `<button type="button" class="code-line" data-line="${l.n}" data-bug="${l.bug}">
          <span class="ln">${l.n}</span><code>${l.code}</code>
        </button>`).join('')}
      </div>
    `);

    const patchBox = el(`
      <div class="patch-box" hidden>
        <p style="margin:0 0 .5rem"><b>Satır 4 seçildi!</b> Doğru kod hangisi olmalı?</p>
        <div class="options" style="margin-top:.3rem">
          <button type="button" class="opt" data-fix="ok">
            <span class="ico">✅</span>
            <b><code>filtreFanDurumu = "ACIK";</code></b>
            <span>Oksijen hedef seviyenin altındayken fanı AÇIK konuma getir.</span>
          </button>
          <button type="button" class="opt" data-fix="wrong">
            <span class="ico">❌</span>
            <b><code>hedefSeviye = 0;</code></b>
            <span>Hedef oksijen eşiğini sıfırla.</span>
          </button>
        </div>
      </div>
    `);

    const status = el('<div class="reactor-status" role="status" aria-live="polite">İpucu: Oksijen düşükken fanın ne yapması gerektiğine bak ve o satıra tıkla.</div>');
    const actions = el(`
      <div class="dlg-actions" style="justify-content:space-between">
        <button type="button" class="btn btn-sm btn-ghost" data-a="switch">🧰 Mekanik tamire geç</button>
      </div>
    `);

    body.append(editor, patchBox, status, actions);

    editor.addEventListener('click', (e) => {
      const btn = e.target.closest('.code-line');
      if (!btn) return;
      attempts += 1;
      editor.querySelectorAll('.code-line').forEach((x) => x.classList.remove('selected'));
      btn.classList.add('selected');
      if (btn.dataset.bug === 'true') {
        A()?.click();
        status.className = 'reactor-status ok';
        status.textContent = '✔ Hatalı satırı yakaladın! Şimdi aşağıdan doğru yamayı (patch) uygula.';
        patchBox.hidden = false;
      } else {
        A()?.err();
        patchBox.hidden = true;
        status.className = 'reactor-status err';
        status.innerHTML = `Satır ${btn.dataset.line} normal görünüyor. <button type="button" class="btn btn-sm" id="retryCode" style="margin-left:.5rem">Tekrar Dene ↻</button>`;
        status.querySelector('#retryCode')?.addEventListener('click', () => {
          T().count('puzzleRetries');
          status.className = 'reactor-status';
          status.textContent = 'Koşul bloğunun (if) içindeki atama satırını kontrol et.';
        });
      }
    });

    patchBox.addEventListener('click', (e) => {
      const fix = e.target.closest('[data-fix]')?.dataset.fix;
      if (!fix) return;
      if (fix === 'ok') {
        A()?.ok();
        const solveSec = Math.max(2, Math.round((performance.now() - t0) / 1000));
        api.s.flags.repairChoice = 'explorer';
        api.decide('repair', 'code', {
          latencyMs: solveSec * 1000,
          pkys: { explorer: 38, systemist: 8 },
          label: `Yazılım Analizi (Kaşif · Kod hatasını ${solveSec} saniyede buldu)`,
          meta: { solveSec, attempts },
        });
        const chips = api.apply({ o2: 25, energy: 10, morale: 8 });
        api.finish(`Harika analiz! Kod hatasını ${solveSec} saniyede bulup düzelttin. Oksijen filtresi tam kapasite devrede.`, chips);
      } else {
        A()?.err();
        T().count('puzzleRetries');
        status.className = 'reactor-status err';
        status.textContent = '⚠️ Hedef seviyeyi sıfırlamak filtreyi tamamen durdurur! Diğer yamayı dene.';
      }
    });

    actions.querySelector('[data-a="switch"]').addEventListener('click', () => {
      T().count('puzzleGiveUps');
      runManualPuzzle(api);
    });
  }

  /* =========================================================================
   * BÖLÜM 3: İlk Temas (Bağ Kurucu vs. Stratejist) — Gün 55
   * ========================================================================= */
  S.contact = (api) => {
    api.setHead('BÖLÜM 3 · Gün 55 · Kamp Sınırı', 'İlk Temas: Yerel Canlılar');
    const body = api.body;
    body.innerHTML = '';

    body.append(el(`<div>${speaker('mira', 'Kaptan! Gezegende yaşayan ışık sırtlı yerel canlılar kampa yaklaştı. Agresif görünmüyorlar ama dış depodan erzak aşırıyorlar! Nasıl karşılık vereceğiz?')}</div>`));

    const opts = el(`
      <div class="options" role="group" aria-label="İlk temas seçenekleri">
        <button type="button" class="opt" data-opt="comm">
          <span class="ico">🎵</span>
          <b>Seçenek A (İletişim): Hediye ver ve ritimle anlaş</b>
          <span>Onlara kristal meyve sun ve ışık/ses hareketlerini taklit ederek iletişim kur (Mini Ritim Oyunu · Bağ Kurucu).</span>
        </button>
        <button type="button" class="opt" data-opt="defense">
          <span class="ico">🛸</span>
          <b>Seçenek B (Savunma): Çitleri güçlendir ve dronları yerleştir</b>
          <span>Kamp çevresine enerji çitleri ve nöbetçi dronlar kurarak erzakları koru (Kule Savunma Oyunu · Stratejist).</span>
        </button>
      </div>
    `);
    body.append(opts);
    T().startDecision('contact_path', opts);

    opts.addEventListener('click', (e) => {
      const b = e.target.closest('[data-opt]');
      if (!b) return;
      A()?.click();
      const choice = b.dataset.opt;
      T().endDecision('contact_path', choice, { passive: true, day: api.s.day });
      if (choice === 'comm') runRhythmGame(api);
      else runTowerDefenseGame(api);
    });
  };

  /* Bölüm 3A: Mini Ritim & Taklit Oyunu (Bağ Kurucu / Sosyal) */
  function runRhythmGame(api) {
    api.setHead('BÖLÜM 3A · Empatik İletişim', '🎵 Biyo-Işık Ritim Uyumu');
    const body = api.body;
    body.innerHTML = '';
    const t0 = performance.now();

    const pads = [
      { idx: 0, icon: '🟣', name: 'Mor Frekans', color: '#a855f7' },
      { idx: 1, icon: '🔵', name: 'Mavi Dalga', color: '#3b82f6' },
      { idx: 2, icon: '🟢', name: 'Yeşil Yankı', color: '#22c55e' },
      { idx: 3, icon: '🟡', name: 'Altın Çağrı', color: '#eab308' },
    ];
    const seq = [1, 2, 0, 3];
    let userSeq = [];
    let playing = false;
    let retries = 0;

    body.append(el(`<div>${speaker('mira', 'Canlılar sırtlarındaki kristallerle 4 adımlı bir melodi çalıyor! Önce sinyali izle, sonra aynı sırayla pedlere basarak dostluk mesajını tekrarla.')}</div>`));

    const padWrap = el(`
      <div class="rhythm-pads">
        ${pads.map((p) => `<button type="button" class="rhythm-pad" data-idx="${p.idx}" style="--pad-c:${p.color}">
          <span class="r-ico">${p.icon}</span><b>${p.name}</b>
        </button>`).join('')}
      </div>
    `);
    const status = el('<div class="reactor-status" role="status" aria-live="polite">Sinyali dinlemek için "Sinyali Oynat"a bas.</div>');
    const actions = el(`
      <div class="dlg-actions" style="justify-content:space-between">
        <button type="button" class="btn btn-sm" data-a="play">🔊 Sinyali Tekrar Dinle</button>
        <span class="hint" id="rhythmProg">Adım: 0 / 4</span>
      </div>
    `);
    body.append(padWrap, status, actions);

    function flashPad(idx) {
      const btn = padWrap.querySelector(`[data-idx="${idx}"]`);
      if (!btn) return;
      btn.classList.add('lit');
      A()?.note(idx);
      setTimeout(() => btn.classList.remove('lit'), 340);
    }

    function playSequence() {
      if (playing) return;
      playing = true;
      userSeq = [];
      actions.querySelector('#rhythmProg').textContent = 'Adım: 0 / 4';
      status.className = 'reactor-status';
      status.textContent = '👀 Canlıların ışık dizisini izle…';
      seq.forEach((idx, i) => {
        setTimeout(() => {
          flashPad(idx);
          if (i === seq.length - 1) {
            setTimeout(() => {
              playing = false;
              status.textContent = 'Şimdi sıra sende! Aynı 4 sinyali tekrarla.';
            }, 400);
          }
        }, (i + 1) * 520);
      });
    }

    actions.querySelector('[data-a="play"]').addEventListener('click', playSequence);
    setTimeout(playSequence, 350);

    padWrap.addEventListener('click', (e) => {
      if (playing) return;
      const btn = e.target.closest('.rhythm-pad');
      if (!btn) return;
      const idx = +btn.dataset.idx;
      flashPad(idx);
      userSeq.push(idx);
      actions.querySelector('#rhythmProg').textContent = `Adım: ${userSeq.length} / 4`;

      const step = userSeq.length - 1;
      if (userSeq[step] !== seq[step]) {
        A()?.err();
        retries += 1;
        T().count('puzzleRetries');
        status.className = 'reactor-status err';
        status.innerHTML = '⚠️ Ritim karıştı! Canlılar şaşkınlıkla baktı. Sinyali tekrar dinleyip yeniden dene.';
        setTimeout(playSequence, 900);
        return;
      }

      if (userSeq.length === seq.length) {
        A()?.ok();
        const solveSec = Math.round((performance.now() - t0) / 1000);
        api.s.flags.allies = true;
        api.decide('contact', 'comm', {
          latencyMs: solveSec * 1000,
          pkys: { connector: 38, designer: 8 },
          label: `İletişim & Ritim Oyunu (Bağ Kurucu · ${solveSec} sn)`,
          meta: { solveSec, retries },
        });
        const chips = api.apply({ water: 25, food: 20, morale: 15 });
        api.finish('Muhteşem uyum! Canlılar ritmine karşılık verdi ve koloniye gizli bir yeraltı su pınarı gösterdiler (+4 su/gün).', chips);
      }
    });
  }

  /* Bölüm 3B: Kule Savunma Oyunu (Stratejist) */
  function runTowerDefenseGame(api) {
    api.setHead('BÖLÜM 3B · Taktik Savunma', '🛸 Nöbetçi Dronları ve Çitleri Yerleştir');
    const body = api.body;
    body.innerHTML = '';
    const t0 = performance.now();

    body.append(el(`<div>${speaker('deniz', 'Erzak deposuna giden 3 yaklaşım koridoru var! 3 adet Nöbetçi Dron / Lazer Çit birimini koridorlara yerleştirerek savunma hattını kur.')}</div>`));

    const lanes = [
      { id: 0, name: 'Kuzey Vadisi Koridoru', threat: 'Yüksek Hareketlilik' },
      { id: 1, name: 'Doğu Nehir Yatağı', threat: 'Orta Hareketlilik' },
      { id: 2, name: 'Güney Kayalık Geçidi', threat: 'Yüksek Hareketlilik' },
    ];
    const placed = {};

    const tdWrap = el(`
      <div class="td-grid">
        ${lanes.map((l) => `
          <div class="td-lane" data-lane="${l.id}">
            <div class="td-info"><b>${l.name}</b><small>${l.threat}</small></div>
            <div class="td-slots">
              <button type="button" class="btn btn-sm td-slot" data-lane="${l.id}" data-type="fence">⚡ Enerji Çiti Kur</button>
              <button type="button" class="btn btn-sm td-slot" data-lane="${l.id}" data-type="drone">🛸 Nöbetçi Dron Ata</button>
            </div>
            <span class="td-state" id="tdState${l.id}">Korunmasız</span>
          </div>
        `).join('')}
      </div>
    `);
    const status = el('<div class="reactor-status" role="status" aria-live="polite">3 koridorun tamamına savunma birimi ata (0 / 3).</div>');
    const actions = el(`
      <div class="dlg-actions">
        <button type="button" class="btn btn-primary" data-a="launch" disabled>🛡️ Savunma Simülasyonunu Başlat</button>
      </div>
    `);
    body.append(tdWrap, status, actions);
    const launchBtn = actions.querySelector('[data-a="launch"]');

    tdWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.td-slot');
      if (!btn) return;
      A()?.click();
      const lane = btn.dataset.lane;
      const type = btn.dataset.type;
      placed[lane] = type;
      const laneEl = tdWrap.querySelector(`.td-lane[data-lane="${lane}"]`);
      laneEl.querySelectorAll('.td-slot').forEach((b) => b.classList.toggle('active-sensor', b === btn));
      laneEl.querySelector(`#tdState${lane}`).textContent = type === 'drone' ? '🛸 Dron Aktif' : '⚡ Çit Aktif';
      const count = Object.keys(placed).length;
      status.textContent = `Savunma hattı: ${count} / 3 koridor güvende.`;
      launchBtn.disabled = count < 3;
    });

    launchBtn.addEventListener('click', () => {
      A()?.ok();
      const solveSec = Math.round((performance.now() - t0) / 1000);
      api.decide('contact', 'defense', {
        latencyMs: solveSec * 1000,
        pkys: { strategist: 38, systemist: 8 },
        label: `Kule Savunma & Dron Hattı (Stratejist · ${solveSec} sn)`,
        meta: { solveSec, placed },
      });
      const chips = api.apply({ materials: 15, food: 15, energy: -8 });
      api.finish('Nöbetçi dronlar ve caydırıcı enerji çitleri devreye girdi! Yerel canlılar kampa zarar vermeden geri çekildi, erzak deposu tam güvende.', chips);
    });
  }

  /* =========================================================================
   * BÖLÜM 4: Koloni Bayrağı ve Mesajı (Tasarımcı & Sabır) — Gün 85
   * ========================================================================= */
  S.flag = (api) => {
    api.setHead('BÖLÜM 4 · Gün 85 · Dünya\'ya İlk Sinyal', '🎨 Koloni Bayrağını ve Mesajını Tasarla');
    const body = api.body;
    body.innerHTML = '';
    const t0 = performance.now();

    body.append(el(`<div>${speaker('mira', 'Kolonimiz artık ayakta! Dünya\'ya göndereceğimiz ilk büyük pakette bizi temsil edecek bir Koloni Sembolü (Bayrak) ve Kaptan Mesajı yer alacak. Sahne senin!')}</div>`));

    const colors = ['#5ee2c8', '#ff7a45', '#7aa7ff', '#eab308', '#f472b6', '#7ee081', '#ffffff', '#ef4444'];
    let curColor = colors[0];
    let brushSize = 6;
    let symmetry = false;
    let strokes = 0;
    const usedColors = new Set([curColor]);

    const wrap = el(`
      <div class="flag-studio">
        <div class="flag-tools">
          <div class="palette" role="group" aria-label="Renk Paleti">
            ${colors.map((c, i) => `<button type="button" class="swatch ${i === 0 ? 'active' : ''}" data-c="${c}" style="background:${c}" aria-label="Renk ${i + 1}"></button>`).join('')}
          </div>
          <div class="tool-row">
            <label class="btn btn-sm"><input type="checkbox" id="symToggle" style="margin-right:.35rem"> 🦋 Ayna Simetri</label>
            <button type="button" class="btn btn-sm" data-stamp="star">✦ Yıldız</button>
            <button type="button" class="btn btn-sm" data-stamp="orbit">🪐 Yörünge</button>
            <button type="button" class="btn btn-sm" data-stamp="leaf">🌱 Filiz</button>
            <button type="button" class="btn btn-sm btn-ghost" id="clearFlag">Temizle</button>
          </div>
        </div>
        <div class="flag-canvas-wrap">
          <canvas id="flagCanvas" width="360" height="220"></canvas>
        </div>
        <div class="field" style="margin-top:.8rem">
          <label for="colonyMsg">📡 Dünya'ya Gönderilecek Kaptan Mesajı:</label>
          <input id="colonyMsg" class="input" style="text-transform:none;font-family:var(--font);letter-spacing:0" maxlength="120"
                 value="Proxima B'de yeni bir umut filizlendi. Geleceği birlikte kuruyoruz!" placeholder="Dünya'ya mesajını yaz...">
        </div>
        <div class="dlg-actions">
          <button type="button" class="btn btn-primary" id="sendFlag">🚀 Bayrağı Gönder ve Görevi Tamamla</button>
        </div>
      </div>
    `);
    body.append(wrap);

    const cvs = wrap.querySelector('#flagCanvas');
    const fctx = cvs.getContext('2d');

    function resetCanvas() {
      const g = fctx.createLinearGradient(0, 0, 360, 220);
      g.addColorStop(0, '#0b132b');
      g.addColorStop(1, '#1c2541');
      fctx.fillStyle = g;
      fctx.fillRect(0, 0, 360, 220);
      // Hafif kılavuz çerçeve
      fctx.strokeStyle = 'rgba(255,255,255,0.08)';
      fctx.strokeRect(8, 8, 344, 204);
    }
    resetCanvas();

    let drawing = false;
    let lastPt = null;

    function pos(e) {
      const r = cvs.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * cvs.width,
        y: ((e.clientY - r.top) / r.height) * cvs.height,
      };
    }

    function drawSegment(p1, p2) {
      fctx.strokeStyle = curColor;
      fctx.lineWidth = brushSize;
      fctx.lineCap = 'round';
      fctx.beginPath();
      fctx.moveTo(p1.x, p1.y);
      fctx.lineTo(p2.x, p2.y);
      fctx.stroke();

      if (symmetry) {
        fctx.beginPath();
        fctx.moveTo(cvs.width - p1.x, p1.y);
        fctx.lineTo(cvs.width - p2.x, p2.y);
        fctx.stroke();
      }
    }

    cvs.addEventListener('pointerdown', (e) => {
      drawing = true;
      strokes += 1;
      usedColors.add(curColor);
      lastPt = pos(e);
      drawSegment(lastPt, lastPt);
    });
    cvs.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const p = pos(e);
      drawSegment(lastPt, p);
      lastPt = p;
    });
    addEventListener('pointerup', () => { drawing = false; });

    wrap.querySelector('.palette').addEventListener('click', (e) => {
      const sw = e.target.closest('.swatch');
      if (!sw) return;
      A()?.click();
      curColor = sw.dataset.c;
      usedColors.add(curColor);
      wrap.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('active', b === sw));
    });

    wrap.querySelector('#symToggle').addEventListener('change', (e) => {
      symmetry = e.target.checked;
      A()?.click();
    });

    wrap.querySelectorAll('[data-stamp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        A()?.click();
        strokes += 2;
        usedColors.add(curColor);
        const type = btn.dataset.stamp;
        fctx.save();
        fctx.strokeStyle = curColor;
        fctx.fillStyle = curColor;
        fctx.lineWidth = 3;
        const cx = 180, cy = 110;
        if (type === 'star') {
          fctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            const r = i % 2 === 0 ? 36 : 14;
            fctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }
          fctx.closePath();
          fctx.stroke();
        } else if (type === 'orbit') {
          fctx.beginPath();
          fctx.arc(cx, cy, 24, 0, Math.PI * 2);
          fctx.fill();
          fctx.beginPath();
          fctx.ellipse(cx, cy, 52, 16, -0.3, 0, Math.PI * 2);
          fctx.stroke();
        } else if (type === 'leaf') {
          fctx.beginPath();
          fctx.arc(cx - 12, cy, 22, -Math.PI / 3, Math.PI / 2);
          fctx.arc(cx + 12, cy, 22, Math.PI / 2, (4 * Math.PI) / 3);
          fctx.closePath();
          fctx.stroke();
        }
        fctx.restore();
      });
    });

    wrap.querySelector('#clearFlag').addEventListener('click', () => {
      T().count('undo');
      resetCanvas();
    });

    wrap.querySelector('#sendFlag').addEventListener('click', () => {
      A()?.ok();
      const durationMs = Math.round(performance.now() - t0);
      const colorsUsed = usedColors.size;
      const msg = wrap.querySelector('#colonyMsg').value.trim() || 'Proxima B\'den selamlar!';
      const patienceScore = Math.min(100, Math.round(35 + Math.min(40, durationMs / 750) + Math.min(25, strokes * 2)));
      const designerBoost = Math.min(42, 16 + colorsUsed * 4 + (symmetry ? 8 : 0) + Math.min(10, strokes));

      const flagData = {
        dataUrl: cvs.toDataURL('image/png'),
        message: msg,
        durationMs,
        strokes,
        colorsUsed,
        symmetryUsed: symmetry,
        patienceScore,
      };
      T().set('flagData', flagData);

      api.decide('flag', 'designed', {
        latencyMs: durationMs,
        pkys: { designer: designerBoost, connector: msg.length > 25 ? 8 : 4 },
        label: `Koloni Bayrağı (${Math.round(durationMs / 1000)} sn · ${colorsUsed} renk · Sabır %${patienceScore})`,
        meta: flagData,
      });
      const chips = api.apply({ morale: 20 });
      api.finish(`Koloni bayrağın göndere çekildi ve mesajın Dünya'ya iletildi! (${Math.round(durationMs / 1000)} sn tasarım · Sabır Puanı: %${patienceScore})`, chips);
    });
  };

  /* =========================================================================
   * Ara Koloni Kararları (Gün 15, 40, 70)
   * ========================================================================= */
  function quickChoice(api, cfg) {
    api.setHead(cfg.eyebrow, cfg.title);
    api.body.innerHTML = '';
    api.body.append(el(`<div>${speaker(cfg.speaker, cfg.text)}</div>`));
    const opts = el('<div class="options"></div>');
    cfg.options.forEach((o) => {
      const b = el(`<button type="button" class="opt" data-opt="${o.key}"><span class="ico">${o.icon}</span><b>${o.label}</b><span>${o.desc}</span></button>`);
      b.addEventListener('click', () => {
        A()?.click();
        api.decide(cfg.id, o.key, { pkys: o.pkys, label: o.label });
        const chips = api.apply(o.fx);
        api.finish(o.out, chips);
      });
      opts.append(b);
    });
    api.body.append(opts);
    T().startDecision(cfg.id, opts);
  }

  S.harvest = (api) => quickChoice(api, {
    id: 'harvest', eyebrow: 'Gün 15 · Sera Raporu', title: 'İlk Hasat Fazlası', speaker: 'elif',
    text: 'Kaptan, ilk biyo-sera hasadımız beklentinin üzerinde! Fazla ürünü nasıl değerlendirelim?',
    options: [
      { key: 'store', icon: '📦', label: 'Gelecek günler için soğuk depoya al', desc: 'Stok güvenliği sağlar (Sistemci).', pkys: { systemist: 12 }, fx: { food: 35 }, out: 'Hasat düzenli biçimde kataloglanıp soğuk depoya alındı.' },
      { key: 'feast', icon: '🎉', label: 'Mürettebat için kutlama yemeği düzenle', desc: 'Takım bağlarını ve morali güçlendirir (Bağ Kurucu).', pkys: { connector: 12, designer: 4 }, fx: { food: 10, morale: 15 }, out: 'Kubbede müzik ve kahkaha yükseldi; ekip birbirine kenetlendi!' },
      { key: 'bioplastic', icon: '🧪', label: 'Biyo-plastik ve yapı malzemesine dönüştür', desc: 'Yeni modüller için üretim girdisi (Yapıcı / Kaşif).', pkys: { maker: 8, explorer: 8 }, fx: { materials: 35 }, out: 'Fazla biyokütle atölyede dayanıklı yapı malzemesine dönüştürüldü.' },
    ],
  });

  S.conflict = (api) => quickChoice(api, {
    id: 'conflict', eyebrow: 'Gün 40 · Ekip İçi Görüş Ayrılığı', title: 'Enerji Tahsisi Tartışması', speaker: 'mira',
    text: 'Deniz atölye için, Dr. Kaan ise araştırma laboratuvarı için ek enerji istiyor. Karar senin kaptan.',
    options: [
      { key: 'mediate', icon: '🤝', label: 'Ortak çalışma masası kur ve enerjiyi paylaştır', desc: 'Uzlaşı ve iş birliği (Bağ Kurucu).', pkys: { connector: 14 }, fx: { morale: 10, energy: -5 }, out: 'İki ekip ortak bir çizelgede anlaştı; koloni uyumu güçlendi.' },
      { key: 'lab', icon: '🔬', label: 'Araştırma laboratuvarına öncelik ver', desc: 'Bilimsel veri ve keşif önceliği (Kaşif).', pkys: { explorer: 14 }, fx: { energy: 15, o2: 10 }, out: 'Dr. Kaan yeni sensör algoritmalarıyla enerji verimliliğini artırdı.' },
      { key: 'workshop', icon: '🔧', label: 'Mekanik atölyeye öncelik ver', desc: 'Somut üretim ve donanım gücü (Yapıcı).', pkys: { maker: 14 }, fx: { materials: 30 }, out: 'Deniz atölyede yedek valf ve yapı panelleri üretti.' },
    ],
  });

  S.reroute = (api) => quickChoice(api, {
    id: 'reroute', eyebrow: 'Gün 70 · Güneş Fırtınası', title: 'Manyetik Dalga Yaklaşıyor', speaker: 'kaan',
    text: 'Proxima yıldızından gelen bir manyetik dalga 24 saat içinde koloniyi etkileyecek. Hangi hazırlığı yapalım?',
    options: [
      { key: 'shield', icon: '🛡️', label: 'Kalkanları maksimum güce çıkar', desc: 'Cesur savunma hamlesi (Stratejist).', pkys: { strategist: 12 }, fx: { energy: -10, morale: 8 }, out: 'Kalkanlar manyetik dalgayı saptırdı, koloni dimdik ayakta!' },
      { key: 'protocol', icon: '📐', label: 'Standart koruma protokolünü adım adım uygula', desc: 'Düzenli ve güvenli geçiş (Sistemci).', pkys: { systemist: 12 }, fx: { o2: 10, water: 10 }, out: 'Tüm sistemler prosedüre uygun koruma moduna alındı ve sıfır kayıpla atlatıldı.' },
      { key: 'aurora', icon: '🌌', label: 'Manyetik aurorayı kaydet ve kubbede görsel şölene dönüştür', desc: 'Estetik ve moral odaklı yaklaşım (Tasarımcı).', pkys: { designer: 14, connector: 6 }, fx: { morale: 18 }, out: 'Gökyüzündeki büyüleyici ışıklar kubbeye yansıtıldı; unutulmaz bir gece yaşandı!' },
    ],
  });

  MF.Scenarios = S;
})();
