/* Mission: Future — Öğretmen Paneli (Dashboard)
 * GDD Bölüm 4 formatında Öğretmen Rapor Kartı, PKYS 6 Karakter Haritası,
 * Tıklama Isı Haritası, Koloni Bayrağı incelemesi ve Meslek Rotaları.
 */
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEYMAP = 'mf_keymap';
  const T = MF.Tracker;
  let selected = null;

  /* ---------- PIN kapısı ---------- */
  function unlock() { $('#gate').hidden = true; $('#panel').hidden = false; render(); }
  if (sessionStorage.getItem('mf_teacher') === '1') unlock();
  $('#gateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = $('#pin');
    if (pin.value === '2085') { sessionStorage.setItem('mf_teacher', '1'); unlock(); }
    else { pin.setCustomValidity('PIN hatalı.'); pin.reportValidity(); pin.setCustomValidity(''); pin.select(); }
  });

  const keymap = () => { try { return JSON.parse(localStorage.getItem(KEYMAP)) || {}; } catch { return {}; } };
  const setKey = (code, label) => { const m = keymap(); if (label) m[code] = label; else delete m[code]; localStorage.setItem(KEYMAP, JSON.stringify(m)); };

  /* ---------- Veri ---------- */
  function sessions() {
    return Object.values(T.loadAll())
      .map((s) => ({ s, p: MF.Profile.compute(s) }))
      .sort((a, b) => String(b.s.updatedAt).localeCompare(String(a.s.updatedAt)));
  }
  const statusText = { completed: 'Tamamladı', active: 'Devam ediyor' };

  function render() {
    const list = sessions();
    $('#empty').hidden = list.length > 0;
    $('#classView').hidden = list.length === 0;
    renderList(list);
    renderHeat(list);
    if (!selected && list.length) selected = list[0].s.code;
    if (selected && list.find((x) => x.s.code === selected)) renderDetail(list.find((x) => x.s.code === selected));
    else $('#detail').hidden = true;
  }

  function renderList(list) {
    const km = keymap();
    $('#students').innerHTML = list.map(({ s, p }) => {
      const displayName = s.studentName || km[s.code] || s.code;
      return `
      <button type="button" class="stu" role="listitem" data-code="${esc(s.code)}" aria-current="${s.code === selected}">
        <span class="ic" aria-hidden="true">${p.primary.icon}</span>
        <b>${esc(displayName)}</b>
        <span class="st ${esc(s.status)}">%${p.primary.pct} ${esc(p.primary.name)}</span>
        <small>Kod: ${esc(s.code)} · Gün ${s.dayReached}/100</small>
      </button>`;
    }).join('');
  }
  $('#students').addEventListener('click', (e) => { const b = e.target.closest('.stu'); if (b) select(b.dataset.code); });

  function select(code) {
    selected = code;
    render();
    $('#detail').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function heatColor(v) {
    const a = Math.max(0.1, Math.min(0.85, (v - 15) / 80));
    return `rgb(94 226 200 / ${a.toFixed(2)})`;
  }

  function renderHeat(list) {
    const types = MF.PKYS_TYPES;
    const km = keymap();
    $('#heat').innerHTML = `<thead><tr><th scope="col">Öğrenci</th>${types.map((t) => `<th scope="col">${t.icon} ${t.name}<small>${t.sub}</small></th>`).join('')}</tr></thead>
      <tbody>${list.map(({ s, p }) => {
        const name = s.studentName || km[s.code] || s.code;
        return `<tr><td class="code" data-code="${esc(s.code)}">${esc(name)}</td>${types.map((t) => `<td style="background:${heatColor(p.dims[t.key])}" title="${t.name}: %${p.dims[t.key]}">%${p.dims[t.key]}</td>`).join('')}</tr>`;
      }).join('')}</tbody>`;
    const counts = {};
    list.forEach(({ p }) => { const k = `${p.primary.icon} ${p.primary.name}`; counts[k] = (counts[k] || 0) + 1; });
    $('#archDist').innerHTML = Object.entries(counts).map(([k, n]) => `<span class="chip">${esc(k)} · ${n} öğrenci</span>`).join('');
  }
  $('#heat').addEventListener('click', (e) => { const td = e.target.closest('td.code'); if (td) select(td.dataset.code); });

  /* ---------- Radar Grafiği (PKYS 6 Karakter Tipi) ---------- */
  function radarSVG(dims) {
    const size = 320, cx = 160, cy = 160, R = 104, n = MF.PKYS_TYPES.length;
    const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    const rings = [0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${MF.PKYS_TYPES.map((_, i) => pt(i, R * f).join(',')).join(' ')}" fill="none" stroke="#26325a" stroke-width="${f === 0.5 ? 1.4 : 0.8}" ${f === 0.5 ? 'stroke-dasharray="3 3"' : ''}/>`).join('');
    const axes = MF.PKYS_TYPES.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#26325a"/>`; }).join('');
    const poly = MF.PKYS_TYPES.map((d, i) => pt(i, (R * dims[d.key]) / 100).join(',')).join(' ');
    const dots = MF.PKYS_TYPES.map((d, i) => { const [x, y] = pt(i, (R * dims[d.key]) / 100); return `<circle cx="${x}" cy="${y}" r="4" fill="${d.color}"/>`; }).join('');
    const labels = MF.PKYS_TYPES.map((d, i) => {
      const [x, y] = pt(i, R + 26);
      const anchor = Math.abs(x - cx) < 5 ? 'middle' : x > cx ? 'start' : 'end';
      return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="#e7ecf7" font-size="11" font-weight="700">${d.icon} ${d.name}<tspan x="${x}" dy="13" fill="#93a0c2" font-weight="400" font-size="10">%${dims[d.key]}</tspan></text>`;
    }).join('');
    return `<svg class="radar-svg" viewBox="-45 -12 ${size + 90} ${size + 24}" role="img" aria-label="PKYS 6 Karakter Radar Grafiği">${rings}${axes}
      <polygon points="${poly}" fill="rgb(94 226 200 / .22)" stroke="#5ee2c8" stroke-width="2"/>${dots}${labels}</svg>`;
  }

  /* ---------- Tıklama Isı Haritası Görselleştirmesi ---------- */
  function heatmapSVG(s, m) {
    const pts = s.heatmap || [];
    const circles = pts.map((p) => {
      const c = p.zone === 'visual' ? '#5ee2c8' : p.zone === 'text' ? '#ffb35c' : '#7aa7ff';
      return `<circle cx="${p.x * 3}" cy="${p.y * 1.6}" r="7" fill="${c}" fill-opacity="0.35"/>`;
    }).join('');
    return `
      <svg viewBox="0 0 300 160" class="heatmap-svg" role="img" aria-label="Tıklama ısı haritası">
        <rect width="300" height="160" rx="10" fill="#090f22" stroke="#26325a"/>
        <rect x="8" y="8" width="185" height="105" rx="6" fill="none" stroke="#5ee2c8" stroke-dasharray="3 3" stroke-opacity="0.4"/>
        <text x="14" y="22" fill="#5ee2c8" font-size="9" opacity="0.7">Görsel Sahne & Harita Alanı</text>
        <rect x="200" y="8" width="92" height="144" rx="6" fill="none" stroke="#ffb35c" stroke-dasharray="3 3" stroke-opacity="0.4"/>
        <text x="206" y="22" fill="#ffb35c" font-size="9" opacity="0.7">Veri & Panel</text>
        ${circles}
      </svg>
      <div class="legend">
        <span style="color:#5ee2c8">● Görsel (%${m.visualRatio})</span>
        <span style="color:#ffb35c">● Metin/Veri (%${m.textRatio})</span>
        <span>Odak: <b>${esc(m.focusStyle)}</b></span>
      </div>`;
  }

  /* ---------- Detay (GDD Bölüm 4 Öğretmen Dashboard Kartı) ---------- */
  function renderDetail({ s, p }) {
    const m = p.metrics;
    const km = keymap();
    const studentTitle = s.studentName || km[s.code] || s.code;
    const playMin = Math.max(1, Math.round((m.playTimeSec || 2520) / 60));
    const fmtS = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)} sn`);

    const metricRows = [
      ['Tıklama Isı Haritası (Odak)', 'Ekranda önce nereye bakıyor? (Görsel vs. Metin)', `%${m.visualRatio} Görsel · %${m.textRatio} Metin (${m.focusStyle})`],
      ['Ortalama Tereddüt Süresi', 'Çok bekleyen: Analitik / Hızlı basan: Dürtüsel-Girişimci', fmtS(m.avgLatency)],
      ['Hata Sonrası Tepki (Yılmazlık)', 'Yanınca "Tekrar Dene"ye mi basıyor, vaz mı geçiyor?', `%${m.resilienceScore} Yılmazlık (${m.puzzleRetries} tekrar deneme)`],
      ['Ses Açma / Kapama', 'Oyunun müziğini dinliyor mu? (İşitsel duyarlılık)', m.audioMuted ? '🔇 Kapattı (Sessiz odak)' : '🔊 Açık (Müziği dinliyor)'],
      ['Sabır ve Detaycılık Puanı', 'Bölüm 4 Koloni Bayrağı süresi ve detay yoğunluğu', `%${m.patienceScore}`],
      ['Sensör & Veri İnceleme', 'Bölüm 1 harita verilerini okuma sayısı', `${m.sensorReads} rapor incelendi`],
    ];

    const flagHtml = s.flagData?.dataUrl
      ? `<div class="flag-preview-box">
          <img src="${s.flagData.dataUrl}" alt="Öğrencinin çizdiği koloni bayrağı" class="end-flag-img">
          <div>
            <b>Dünya'ya Gönderdiği Mesaj:</b>
            <p style="margin:.25rem 0;color:var(--accent)">"${esc(s.flagData.message)}"</p>
            <small class="hint">Süre: ${Math.round((s.flagData.durationMs || 0) / 1000)} sn · ${s.flagData.colorsUsed || 1} renk · ${s.flagData.symmetryUsed ? 'Simetri kullanıldı' : 'Serbest çizim'} · Sabır: %${s.flagData.patienceScore || m.patienceScore}</small>
          </div>
        </div>`
      : '<p class="hint">Öğrenci henüz Bölüm 4 (Koloni Bayrağı) aşamasına gelmedi.</p>';

    const det = $('#detail');
    det.hidden = false;
    det.innerHTML = `
      <div class="det-head">
        <div>
          <div class="eyebrow">MEB e-Okul / Kaptan Kodu: ${esc(s.code)} · Gün ${s.dayReached}/100</div>
          <h2>Öğrenci: ${esc(studentTitle)}</h2>
        </div>
        <form class="keymap" id="keyForm">
          <label for="keyInput" class="hint">Öğrenci Adı / Sınıfı:</label>
          <input id="keyInput" value="${esc(s.studentName || km[s.code] || '')}" placeholder="Örn: Can Yılmaz (9-B)" maxlength="32">
          <button class="btn btn-sm" type="submit">Kaydet</button>
        </form>
      </div>

      <!-- GDD Bölüm 4: Özet Öğretmen Kartı -->
      <div class="gdd-summary-card">
        <div class="gdd-row"><span>👤 Öğrenci:</span> <b>${esc(studentTitle)}</b></div>
        <div class="gdd-row"><span>⏱️ Oyun Süresi:</span> <b>${playMin} Dakika</b></div>
        <div class="gdd-row"><span>🏆 Dominant Karakter:</span> <b style="color:var(--ok)">%${p.primary.pct} ${esc(p.primary.name)}</b> <span class="hint">(${esc(p.dominantEvidence)})</span></div>
        <div class="gdd-row"><span>📉 Gelişime Açık Yön:</span> <b style="color:var(--warn)">%${p.weakest.pct} ${esc(p.weakest.name)}</b> <span class="hint">(${esc(p.weakEvidence)})</span></div>
        <div class="gdd-row gdd-rec"><span>💡 Pedagojik Öneri:</span> <b>${esc(p.teacherRecommendation)}</b></div>
      </div>

      <div class="det-grid">
        <div>
          <h3 class="sec-title" style="margin-top:0">PKYS 6 Karakter Radar Haritası</h3>
          ${radarSVG(p.dims)}
          <h3 class="sec-title">Tıklama Isı Haritası (Gölge Veri)</h3>
          ${heatmapSVG(s, m)}
          <h3 class="sec-title">Bölüm 4: Koloni Bayrağı ve Mesajı</h3>
          ${flagHtml}
          <h3 class="sec-title">Rehberlik Görüşmesi İçin Sorular</h3>
          <ul class="qs">${p.primary.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
        </div>

        <div>
          <h3 class="sec-title" style="margin-top:0">PKYS 6 Karakter Puan Dağılımı</h3>
          <div class="riasec-bars">
            ${p.ranked.map((r) => `
              <div class="r-row">
                <div class="r-top"><span>${r.icon} <b>${esc(r.name)}</b> · ${esc(r.sub)}</span><span class="r-pct">%${r.pct}</span></div>
                <div class="r-bar"><i style="width:${r.pct}%;background:${r.color}"></i></div>
                <div class="r-sub">${esc(r.desc)}</div>
              </div>`).join('')}
          </div>

          <h3 class="sec-title">Arka Plan "Gölge Veri" (Metadata) Analizi</h3>
          <table class="metrics"><tbody>${metricRows.map(([a, b, c]) => `<tr><td>${a}<small>${b}</small></td><td>${esc(c)}</td></tr>`).join('')}</tbody></table>

          <h3 class="sec-title">Önerilen Meslek & Gelecek Rotaları</h3>
          <div class="career-box">
            <div class="career-head">
              <span class="career-badge">🌌 ${esc(p.careerBridge.colonyTitle)}</span>
              <span class="career-code">PKYS Kodu: ${esc(p.careerBridge.pkysCode)}</span>
            </div>
            <p class="career-why">${esc(p.careerBridge.whyCareer)}</p>
            <div class="career-cols">
              <div class="career-col">
                <h4>🌍 Bugünün Meslek Alanları</h4>
                <div class="career-chips">${p.careerBridge.classic.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
              </div>
              <div class="career-col">
                <h4>🚀 2085 & Geleceğin Rotaları</h4>
                <div class="career-chips">${p.careerBridge.future.map((c) => `<span class="chip up">${esc(c)}</span>`).join('')}</div>
              </div>
            </div>
          </div>

          <h3 class="sec-title">Bölüm & Kriz Kararları</h3>
          <div class="heat-wrap"><table class="timeline"><thead><tr><th>Gün</th><th>Bölüm</th><th>Tercih & Analiz</th><th>Süre</th></tr></thead>
          <tbody>${(s.decisions || []).filter((d) => !d.passive).map((d) => `<tr><td>G${d.day ?? '—'}</td><td>${esc(d.id)}</td><td>${esc(d.label)}</td><td>${fmtS(d.latencyMs)}</td></tr>`).join('') || '<tr><td colspan="4" class="hint">Henüz karar yok.</td></tr>'}</tbody></table></div>
        </div>
      </div>`;

    $('#keyForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = $('#keyInput').value.trim();
      setKey(s.code, val);
      const all = T.loadAll();
      if (all[s.code]) { all[s.code].studentName = val; T.saveAll(all); }
      render();
    });
  }

  /* ---------- Dışa aktar / sil ---------- */
  $('#exportBtn').addEventListener('click', () => {
    const data = sessions().map(({ s, p }) => ({
      code: s.code, status: s.status, dayReached: s.dayReached, playTimeSec: s.playTimeSec,
      dominant: `${p.primary.name} (%${p.primary.pct})`, weakest: `${p.weakest.name} (%${p.weakest.pct})`,
      recommendation: p.teacherRecommendation, dims: p.dims, careerBridge: p.careerBridge,
      metrics: p.metrics, decisions: s.decisions,
    }));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mission-future-pkys-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $('#clearBtn').addEventListener('click', () => {
    if (!confirm('Bu cihazdaki TÜM öğrenci verileri silinecek. Emin misiniz?')) return;
    Object.keys(localStorage).filter((k) => k.startsWith('mf_')).forEach((k) => localStorage.removeItem(k));
    selected = null; render();
  });

  /* ---------- Demo Sınıfı Oluştur (GDD'deki "Can Yılmaz" örneği dahil!) ---------- */
  function makeSampleFlag(bg1, bg2, accent) {
    const c = document.createElement('canvas');
    c.width = 360; c.height = 220;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 360, 220);
    g.addColorStop(0, bg1); g.addColorStop(1, bg2);
    x.fillStyle = g; x.fillRect(0, 0, 360, 220);
    x.strokeStyle = accent; x.lineWidth = 4;
    x.beginPath(); x.arc(180, 110, 46, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(180, 110, 95, 28, -0.28, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(180, 110, 12, 0, Math.PI * 2); x.fill();
    return c.toDataURL('image/png');
  }

  function genHeatmap(biasZone) {
    return Array.from({ length: 45 }, () => {
      const isVis = biasZone === 'visual' ? Math.random() < 0.72 : biasZone === 'text' ? Math.random() < 0.3 : Math.random() < 0.5;
      return isVis
        ? { x: Math.round(10 + Math.random() * 50), y: Math.round(15 + Math.random() * 55), zone: 'visual' }
        : { x: Math.round(68 + Math.random() * 28), y: Math.round(15 + Math.random() * 75), zone: 'text' };
    });
  }

  const DEMO_STUDENTS = [
    {
      code: '1042',
      studentName: 'Can Yılmaz',
      playTimeSec: 42 * 60,
      audioMuted: false,
      pkys: { explorer: 70, strategist: 48, systemist: 42, maker: 32, designer: 24, connector: 0 },
      counters: { visualClicks: 28, textClicks: 54, uiClicks: 12, sensorReads: 3, puzzleRetries: 2, puzzleGiveUps: 0, crewTalks: 1, infoRequests: 4, builds: 5 },
      biasZone: 'text',
      flag: { colors: ['#0b132b', '#1e3a5f', '#5ee2c8'], msg: 'Bilim ve veriyle Proxima B\'yi aydınlatıyoruz.', durationMs: 28000, colorsUsed: 3, symmetryUsed: true, patienceScore: 78 },
      decisions: [
        { id: 'landing', day: 1, choice: 'mountain', label: 'Seçenek B: Dağ Eteği (8.4 sn · 3 veri incelendi)', latencyMs: 8400 },
        { id: 'repair', day: 25, choice: 'code', label: 'Yazılım Analizi (Kaşif · Kod hatasını 12 saniyede buldu)', latencyMs: 12000, meta: { solveSec: 12, attempts: 1 } },
        { id: 'contact', day: 55, choice: 'defense', label: 'Kule Savunma & Dron Hattı (Stratejist · 19 sn)', latencyMs: 19000 },
        { id: 'flag', day: 85, choice: 'designed', label: 'Koloni Bayrağı (28 sn · 3 renk · Sabır %78)', latencyMs: 28000, meta: { patienceScore: 78, durationMs: 28000, colorsUsed: 3, symmetryUsed: true } },
      ],
    },
    {
      code: '1088',
      studentName: 'Zeynep Kaya',
      playTimeSec: 46 * 60,
      audioMuted: false,
      pkys: { connector: 68, designer: 58, systemist: 38, explorer: 30, maker: 20, strategist: 4 },
      counters: { visualClicks: 62, textClicks: 24, uiClicks: 14, sensorReads: 2, puzzleRetries: 3, puzzleGiveUps: 0, crewTalks: 9, infoRequests: 2, builds: 4 },
      biasZone: 'visual',
      flag: { colors: ['#2b1055', '#7597de', '#f472b6'], msg: 'Yeni gezegende tüm canlılarla uyum içinde bir gelecek!', durationMs: 54000, colorsUsed: 6, symmetryUsed: true, patienceScore: 94 },
      decisions: [
        { id: 'landing', day: 1, choice: 'mountain', label: 'Seçenek B: Dağ Eteği (9.1 sn · 2 veri incelendi)', latencyMs: 9100 },
        { id: 'repair', day: 25, choice: 'code', label: 'Yazılım Analizi (Kaşif · Kod hatasını 22 saniyede buldu)', latencyMs: 22000, meta: { solveSec: 22, attempts: 2 } },
        { id: 'contact', day: 55, choice: 'comm', label: 'İletişim & Ritim Oyunu (Bağ Kurucu · 16 sn)', latencyMs: 16000 },
        { id: 'flag', day: 85, choice: 'designed', label: 'Koloni Bayrağı (54 sn · 6 renk · Sabır %94)', latencyMs: 54000, meta: { patienceScore: 94, durationMs: 54000, colorsUsed: 6, symmetryUsed: true } },
      ],
    },
    {
      code: '1105',
      studentName: 'Efe Demir',
      playTimeSec: 39 * 60,
      audioMuted: true,
      pkys: { maker: 72, strategist: 52, systemist: 30, explorer: 26, designer: 18, connector: 6 },
      counters: { visualClicks: 58, textClicks: 19, uiClicks: 15, sensorReads: 0, puzzleRetries: 4, puzzleGiveUps: 0, crewTalks: 2, infoRequests: 1, builds: 8 },
      biasZone: 'visual',
      flag: { colors: ['#1f1c2c', '#928dab', '#ffb35c'], msg: 'Nova-X Mühendislik Üssü kuruldu!', durationMs: 19000, colorsUsed: 3, symmetryUsed: false, patienceScore: 64 },
      decisions: [
        { id: 'landing', day: 1, choice: 'river', label: 'Seçenek A: Nehir Kenarı (3.2 sn · 0 veri incelendi)', latencyMs: 3200 },
        { id: 'repair', day: 25, choice: 'manual', label: 'Mekanik Tamir (Yapıcı · 15 sn · 2 deneme)', latencyMs: 15000, meta: { solveSec: 15, attempts: 2 } },
        { id: 'contact', day: 55, choice: 'defense', label: 'Kule Savunma & Dron Hattı (Stratejist · 14 sn)', latencyMs: 14000 },
        { id: 'flag', day: 85, choice: 'designed', label: 'Koloni Bayrağı (19 sn · 3 renk · Sabır %64)', latencyMs: 19000, meta: { patienceScore: 64, durationMs: 19000, colorsUsed: 3, symmetryUsed: false } },
      ],
    },
    {
      code: '1154',
      studentName: 'Defne Arslan',
      playTimeSec: 48 * 60,
      audioMuted: false,
      pkys: { designer: 74, connector: 46, explorer: 38, systemist: 34, maker: 22, strategist: 8 },
      counters: { visualClicks: 70, textClicks: 22, uiClicks: 10, sensorReads: 2, puzzleRetries: 2, puzzleGiveUps: 0, crewTalks: 6, infoRequests: 3, builds: 5 },
      biasZone: 'visual',
      flag: { colors: ['#141e30', '#243b55', '#c084fc'], msg: 'Sanat, bilim ve umutla Proxima B\'deyiz.', durationMs: 65000, colorsUsed: 7, symmetryUsed: true, patienceScore: 98 },
      decisions: [
        { id: 'landing', day: 1, choice: 'mountain', label: 'Seçenek B: Dağ Eteği (7.5 sn · 2 veri incelendi)', latencyMs: 7500 },
        { id: 'repair', day: 25, choice: 'manual', label: 'Mekanik Tamir (Yapıcı · 24 sn · 2 deneme)', latencyMs: 24000, meta: { solveSec: 24, attempts: 2 } },
        { id: 'contact', day: 55, choice: 'comm', label: 'İletişim & Ritim Oyunu (Bağ Kurucu · 18 sn)', latencyMs: 18000 },
        { id: 'flag', day: 85, choice: 'designed', label: 'Koloni Bayrağı (65 sn · 7 renk · Sabır %98)', latencyMs: 65000, meta: { patienceScore: 98, durationMs: 65000, colorsUsed: 7, symmetryUsed: true } },
      ],
    },
  ];

  $('#demoBtn').addEventListener('click', () => {
    const all = T.loadAll();
    const now = Date.now();
    DEMO_STUDENTS.forEach((d, idx) => {
      const flagData = {
        dataUrl: makeSampleFlag(d.flag.colors[0], d.flag.colors[1], d.flag.colors[2]),
        message: d.flag.msg,
        durationMs: d.flag.durationMs,
        strokes: 18,
        colorsUsed: d.flag.colorsUsed,
        symmetryUsed: d.flag.symmetryUsed,
        patienceScore: d.flag.patienceScore,
      };
      all[d.code] = {
        code: d.code,
        studentName: d.studentName,
        createdAt: new Date(now - 864e5 * (idx + 1)).toISOString(),
        updatedAt: new Date(now - idx * 3600e3).toISOString(),
        status: 'completed',
        dayReached: 100,
        sessions: 1,
        playTimeSec: d.playTimeSec,
        audioMuted: d.audioMuted,
        pkys: d.pkys,
        counters: d.counters,
        heatmap: genHeatmap(d.biasZone),
        flagData,
        decisions: d.decisions,
        events: [],
        daily: [],
      };
    });
    T.saveAll(all);
    selected = '1042'; // Can Yılmaz varsayılan seçili açılsın
    render();
  });
})();
