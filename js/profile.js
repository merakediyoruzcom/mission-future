/* Mission: Future — PKYS 6 Karakter Tipi & Davranışsal Puanlama Motoru
 * GDD'deki 4 Ana Bölüm + Gölge Veri (Tıklama Isı Haritası, Tereddüt Süresi, Hata Sonrası Tepki/Yılmazlık, Ses)
 * ve kariyer önerilerini üretir.
 */
window.MF = window.MF || {};

/* PKYS 6 Ana Karakter Tipi */
MF.PKYS_TYPES = [
  {
    key: 'explorer', name: 'KAŞİF', sub: 'Analitik & Araştırmacı', icon: '🔬', color: '#5ee2c8',
    colonyTitle: 'Baş Bilim ve Algoritma Analisti',
    desc: 'Sorunların kök nedenini arar, yazılım/veri analiziyle hatayı bulur ve merakla keşfeder.',
    whyCareer: 'Verileri inceleme, kod/sistem içindeki mantık hatalarını bulma ve bilimsel merakla hareket etme tarzın bu alanlarla birebir örtüşüyor.',
    careers: {
      classic: ['Yazılım & Algoritma Mühendisi', 'Veri Bilimcisi', 'Bilimsel Araştırmacı (Ar-Ge)', 'Tıp Doktoru / Genetik Uzmanı'],
      future: ['Yapay Zekâ ve Kuantum Sistem Araştırmacısı', 'Astrobiyolog & Gezegen Bilimcisi', 'Biyoenformatik Mimarı'],
    },
    moduleSuggestion: 'Yaratıcı tasarım veya sosyal empati atölyeleriyle analitik gücünü çok yönlü destekleyebilir.',
    questions: ['Kod veya veri içindeki bir hatayı bulmak sana ne hissettiriyor?', 'Yeni bir konuyu öğrenirken ilk nereden başlarsın?'],
  },
  {
    key: 'maker', name: 'YAPICI', sub: 'Maker & Uygulamacı', icon: '🔧', color: '#ffb35c',
    colonyTitle: 'Baş Mekanik ve Saha Donanım Mühendisi',
    desc: 'Alet çantasını alıp doğrudan müdahale eder; somut, mekanik ve pratik çözümler üretir.',
    whyCareer: 'Soyut teoriler yerine parçaları birleştirerek, ellerinle tamir ederek ve somut sistemler kurarak problem çözmen bu mühendislik alanlarının temelidir.',
    careers: {
      classic: ['Makine / Mekatronik Mühendisi', 'Elektrik-Elektronik & Robotik Uzmanı', 'Havacılık ve Uzay Teknisyeni', 'Endüstriyel Ürün Geliştirici'],
      future: ['Otonom Robotik ve Drone Donanım Mimarı', 'Uzay İstasyonu Yaşam Destek Mühendisi', '3B Biyo-Baskı ve Akıllı Malzeme Üreticisi'],
    },
    moduleSuggestion: 'Uzun vadeli stratejik planlama ve veri okuma egzersizleriyle pratik zekâsını güçlendirebilir.',
    questions: ['Bozulan bir eşyayı veya sistemi tamir ederken nasıl bir yol izlersin?', 'Kendi ellerinle yaptığın ve en çok gurur duyduğun çalışma neydi?'],
  },
  {
    key: 'strategist', name: 'STRATEJİST', sub: 'Girişimci & Yönetici', icon: '♟️', color: '#7aa7ff',
    colonyTitle: 'Koloni Operasyon ve Savunma Komutanı',
    desc: 'Cesur kararlar alır, fırsatı görür, kriz anında savunma ve yönetim stratejisi kurar.',
    whyCareer: 'Hızlı inisiyatif alabilmen, hesaplı risklerden çekinmemen ve kaynakları/savunmayı taktiksel yönetmen liderlik ve yönetim rollerine çok uygun.',
    careers: {
      classic: ['Teknoloji Girişimcisi / Kurucu', 'Stratejik Yönetim & Operasyon Lideri', 'Siber Güvenlik ve Savunma Mimarı', 'Hukukçu / Kriz Yöneticisi'],
      future: ['Gezegenlerarası Lojistik ve Koloni Direktörü', 'Otonom Savunma Sistemleri Stratejisti', 'Küresel Kriz ve Risk Simülasyon Lideri'],
    },
    moduleSuggestion: 'Empati, aktif dinleme ve bağ kurma modüllerine yönlendirilerek takım içi iletişim yönü desteklenmeli.',
    questions: ['Riskli ama kazancı yüksek bir karar alırken neyi tartarsın?', 'Bir ekibi yönetirken sence en önemli şey nedir?'],
  },
  {
    key: 'systemist', name: 'SİSTEMCİ', sub: 'Ekolojik & Düzenli', icon: '🌱', color: '#7ee081',
    colonyTitle: 'Ekosistem ve Sürdürülebilirlik Mimarı',
    desc: 'Harita ve sensör verilerini dikkatle inceler; güvenliği, düzeni ve uzun vadeli sürdürülebilirliği seçer.',
    whyCareer: 'Karar vermeden önce tüm verileri okuman, sağlam zemini seçmen ve doğal kaynak dengesini koruman sistem ve çevre mühendisliğinin özüdür.',
    careers: {
      classic: ['Endüstri & Sistem Mühendisi', 'Çevre ve İklim Bilimcisi', 'Veri & Kalite Güvence Analisti', 'Şehir ve Bölge Planlamacısı'],
      future: ['Döngüsel Ekosistem ve Biyosfer Tasarımcısı', 'Yenilenebilir Enerji Şebekesi Mimarı', 'İklim Modelleme ve Sürdürülebilirlik Direktörü'],
    },
    moduleSuggestion: 'Hızlı karar gerektiren belirsizlik senaryoları ve doğaçlama çalışmalarıyla esnekliği artırılabilir.',
    questions: ['Bir işe başlamadan önce tüm verileri ve kuralları bilmek seni nasıl rahatlatır?', 'Uzun vadeli düzen mi yoksa anlık heyecan mı sana daha yakın?'],
  },
  {
    key: 'connector', name: 'BAĞ KURUCU', sub: 'Sosyal & Empatik', icon: '🤝', color: '#f472b6',
    colonyTitle: 'Kültürlerarası İletişim ve Diplomasi Elçisi',
    desc: 'Bilinmeyenle karşılaştığında silah yerine iletişimi seçer; uyumu, ritmi ve empatiyi önceler.',
    whyCareer: 'Yabancı bir canlıyla bile ortak bir ritim ve dil yakalayabilmen, çatışma yerine uzlaşıyı seçmen insan odaklı mesleklerde eşsiz bir yetenektir.',
    careers: {
      classic: ['Psikolog / Psikolojik Danışman', 'Diplomat & Uluslararası İlişkiler Uzmanı', 'Eğitimci / İletişim Tasarımcısı', 'İnsan ve Kültür (İK) Lideri'],
      future: ['İnsan–Yapay Zekâ Empati ve Etik Tasarımcısı', 'Topluluk Refahı ve Sosyal İnovasyon Lideri', 'Evrensel Dil ve İletişim Protokolleri Uzmanı'],
    },
    moduleSuggestion: 'Teknik analiz ve stratejik kaynak yönetimi modülleriyle analitik karar süreçleri desteklenebilir.',
    questions: ['Farklı düşünen biriyle ortak bir dil kurmak için ne yaparsın?', 'Bir grupta herkesin kendini iyi hissetmesi senin için ne kadar önemli?'],
  },
  {
    key: 'designer', name: 'TASARIMCI', sub: 'Sanatsal & Özgün', icon: '🎨', color: '#c084fc',
    colonyTitle: 'Koloni Kimlik, Sanat ve Vizyon Başmimarı',
    desc: 'Renkleri, simetriyi ve sembolleri özgün bir dille birleştirir; koloninin ruhunu ve mesajını tasarlar.',
    whyCareer: 'Görsel düşünme, renk uyumu, soyut kavramları bir sembole dönüştürme ve sabırla detay işleme becerin yaratıcı tasarım dünyasının kalbidir.',
    careers: {
      classic: ['Mimar / İç Mimar', 'Oyun & Dijital Ürün (UI/UX) Tasarımcısı', 'Görsel İletişim ve Marka Tasarımcısı', 'Yaratıcı Yönetmen / Sanatçı'],
      future: ['Artırılmış Gerçeklik (XR) ve Metavren Mimarı', 'Biyo-Tasarım ve Akıllı Yaşam Alanı Tasarımcısı', 'Gelecek Senaryoları ve Etkileşim Tasarımcısı'],
    },
    moduleSuggestion: 'Mekanik ve algoritmik problem çözme modülleriyle tasarımlarını çalışan prototiplere dönüştürmesi teşvik edilebilir.',
    questions: ['Koloni bayrağını tasarlarken seçtiğin renkler ve şekiller senin için ne ifade ediyor?', 'Bir şeyi sıfırdan hayal edip çizmek sana nasıl hissettiriyor?'],
  },
];

/* Geriye dönük uyumluluk için DIMENSIONS ve ARCHETYPES takma adları */
MF.DIMENSIONS = MF.PKYS_TYPES.map((t) => ({ key: t.key, name: t.name, low: 'Düşük', high: t.sub }));
MF.ARCHETYPES = MF.PKYS_TYPES;

MF.Profile = (function () {
  const mean = (arr) => (arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : null);

  function metrics(s) {
    const c = s.counters || {};
    const active = (s.decisions || []).filter((d) => !d.passive && d.latencyMs != null);
    const d1 = (s.decisions || []).find((d) => d.id === 'landing');
    const d2 = (s.decisions || []).find((d) => d.id === 'repair');
    const d3 = (s.decisions || []).find((d) => d.id === 'contact');
    const d4 = (s.decisions || []).find((d) => d.id === 'flag');
    const vis = c.visualClicks || 0;
    const txt = c.textClicks || 0;
    const totClicks = Math.max(1, vis + txt + (c.uiClicks || 0));

    return {
      decisions: active.length,
      playTimeSec: s.playTimeSec || 0,
      avgLatency: mean(active.map((d) => d.latencyMs)),
      avgHover: mean(active.map((d) => d.hoverSwitches)),
      visualRatio: Math.round((vis / totClicks) * 100),
      textRatio: Math.round((txt / totClicks) * 100),
      focusStyle: vis > txt * 1.25 ? 'Görsel Odaklı' : txt > vis * 1.25 ? 'Metin/Veri Odaklı' : 'Dengeli (Görsel + Metin)',
      sensorReads: c.sensorReads || 0,
      puzzleRetries: c.puzzleRetries || 0,
      puzzleGiveUps: c.puzzleGiveUps || 0,
      resilienceScore: Math.min(100, Math.max(20, 65 + (c.puzzleRetries || 0) * 15 - (c.puzzleGiveUps || 0) * 25)),
      patienceScore: d4?.meta?.patienceScore ?? Math.min(100, Math.round(((mean(active.map((d) => d.latencyMs)) || 6000) / 120))),
      audioMuted: !!s.audioMuted,
      audioToggles: c.audioToggles || 0,
      crewTalks: c.crewTalks || 0,
      infoRequests: c.infoRequests || 0,
      builds: c.builds || 0,
      undo: c.undo || 0,
      landingChoice: d1?.choice || null,
      landingLatencySec: d1?.latencyMs ? Math.round(d1.latencyMs / 1000) : null,
      repairChoice: d2?.choice || null,
      repairTimeSec: d2?.meta?.solveSec ?? (d2?.latencyMs ? Math.round(d2.latencyMs / 1000) : null),
      contactChoice: d3?.choice || null,
      flagMeta: d4?.meta || s.flagData || null,
    };
  }

  function compute(s) {
    const m = metrics(s);
    const raw = {
      strategist: 15,
      systemist: 15,
      maker: 15,
      explorer: 15,
      connector: 15,
      designer: 15,
    };

    // Kaydedilmiş PKYS puanlarını ekle
    if (s.pkys) {
      Object.entries(s.pkys).forEach(([k, v]) => {
        if (raw[k] != null) raw[k] += v;
      });
    }

    // Gölge veri katkıları
    if (m.sensorReads >= 2) raw.systemist += 10;
    if (m.avgLatency != null) {
      if (m.avgLatency < 4500) raw.strategist += 8;
      else if (m.avgLatency > 9000) { raw.explorer += 6; raw.systemist += 6; }
    }
    if (m.crewTalks >= 3) raw.connector += Math.min(15, m.crewTalks * 3);
    if (m.infoRequests >= 2) raw.explorer += Math.min(12, m.infoRequests * 4);
    if (m.puzzleRetries >= 1) raw.maker += 6;

    // 15..95 aralığına normalize et (öğretmen panelinde %85 Kaşif, %15 Bağ Kurucu gibi net yüzdeler için)
    const vals = Object.values(raw);
    const maxV = Math.max(...vals, 30);
    const minV = Math.min(...vals);
    const dims = {};
    MF.PKYS_TYPES.forEach((t) => {
      const v = raw[t.key];
      const norm = maxV === minV ? 50 : 15 + ((v - minV) / (maxV - minV)) * 77;
      dims[t.key] = Math.round(Math.max(12, Math.min(95, norm)));
    });

    const ranked = MF.PKYS_TYPES.map((t) => ({ ...t, pct: dims[t.key], value: dims[t.key] })).sort((a, b) => b.pct - a.pct);
    const primary = ranked[0];
    const secondary = ranked[1];
    const weakest = ranked[ranked.length - 1];

    // GDD Bölüm 4 kanıt metinleri (Örn: "Kod hatasını 12 saniyede buldu")
    const dominantEvidence = buildEvidence(primary.key, m, true);
    const weakEvidence = buildEvidence(weakest.key, m, false);
    const teacherRecommendation = buildRecommendation(s, primary, weakest);

    const uniq = (arr) => [...new Set(arr)];
    const careerBridge = {
      colonyTitle: primary.colonyTitle,
      whyCareer: primary.whyCareer,
      classic: uniq([...primary.careers.classic, ...(secondary?.careers.classic.slice(0, 2) || [])]).slice(0, 5),
      future: uniq([...primary.careers.future, ...(secondary?.careers.future.slice(0, 1) || [])]).slice(0, 4),
      pkysCode: ranked.slice(0, 3).map((r) => r.name[0]).join(''),
    };

    return {
      dims,
      metrics: m,
      primary,
      secondary,
      weakest,
      ranked,
      dominantEvidence,
      weakEvidence,
      teacherRecommendation,
      careerBridge,
      flags: flags(m, dims),
      confidence: confidence(m),
    };
  }

  function buildEvidence(key, m, isStrong) {
    if (key === 'explorer') {
      if (m.repairChoice === 'code') return `O₂ filtresinde yazılım analizini seçti ve kod hatasını ${m.repairTimeSec || 12} saniyede buldu.`;
      return isStrong ? 'Karar öncesi sensör ve analiz verilerini detaylı inceledi.' : 'Arızada yazılım analizi yerine doğrudan mekanik müdahaleyi tercih etti.';
    }
    if (key === 'maker') {
      if (m.repairChoice === 'manual') return `Alet çantasını seçip mekanik filtreyi ${m.repairTimeSec || 18} saniyede elleriyle onardı.`;
      return isStrong ? 'Koloni modüllerini ve donanımı aktif biçimde inşa etti.' : 'Mekanik tamir yerine masa başı yazılım analizini tercih etti.';
    }
    if (key === 'strategist') {
      if (m.contactChoice === 'defense') return 'Yerlilerle temasta savunma hattı ve nöbetçi dron stratejisi kurdu.';
      if (m.landingChoice === 'river') return `Haritada hızlı karar vererek (${m.landingLatencySec || 5} sn) yüksek kazançlı Nehir Kenarına indi.`;
      return isStrong ? 'Kriz anlarında hızlı ve sonuç odaklı inisiyatif aldı.' : 'Savunma/rekabet yerine uzlaşı ve güvenli zemini tercih etti.';
    }
    if (key === 'systemist') {
      if (m.landingChoice === 'mountain') return `Sensör verilerini inceleyip (${m.sensorReads} veri kartı) güvenli Dağ Eteğine iniş yaptı.`;
      return isStrong ? 'Kaynakları ve koloni düzenini sürdürülebilir tuttu.' : 'Güvenli prosedürler yerine hızlı ve riskli hamleleri seçti.';
    }
    if (key === 'connector') {
      if (m.contactChoice === 'comm') return 'Yerlilerle savunma yerine ritim ve hediye ile empatik iletişim kurdu.';
      if (m.contactChoice === 'defense') return 'Yerlilerle iletişim kurmadı, direkt savunma duvarı ve dron hattı ördü.';
      return isStrong ? `Mürettebatla ${m.crewTalks} kez görüşerek ortak akılla hareket etti.` : 'Kararları bireysel aldı, ekip ve iletişim kanallarını az kullandı.';
    }
    if (key === 'designer') {
      if (m.flagMeta) {
        const sec = Math.round((m.flagMeta.durationMs || 25000) / 1000);
        return `Koloni bayrağına ${sec} sn ayırdı; ${m.flagMeta.colorsUsed || 4} renk${m.flagMeta.symmetryUsed ? ' ve simetri modu' : ''} kullandı.`;
      }
      return isStrong ? 'Görsel ve estetik araçlara yüksek ilgi gösterdi.' : 'Görsel tasarım aşamasını hızlı tamamladı.';
    }
    return '';
  }

  function buildRecommendation(s, primary, weakest) {
    const name = s.studentName || s.code;
    const strengthMap = {
      explorer: 'analitik problem çözme ve kök neden analizinde',
      maker: 'uygulamalı mühendislik ve somut çözüm üretmede',
      strategist: 'kriz yönetimi, liderlik ve stratejik karar almada',
      systemist: 'sistem kurma, veri okuma ve sürdürülebilir planlamada',
      connector: 'empati, iletişim ve takım uyumunda',
      designer: 'görsel tasarım, estetik ve özgün ifade alanında',
    };
    const weakMap = {
      connector: 'empati ve grup içi iletişim modüllerine',
      explorer: 'veri analizi ve algoritmik düşünme atölyelerine',
      maker: 'uygulamalı maker/robotik atölyelerine',
      strategist: 'liderlik ve hızlı karar alma simülasyonlarına',
      systemist: 'planlama ve süreç yönetimi çalışmalarına',
      designer: 'yaratıcı sanat ve tasarım atölyelerine',
    };
    return `"${name}, ${strengthMap[primary.key]} çok iyi (%${primary.pct} ${primary.name}); ancak ${weakMap[weakest.key]} yönlendirilerek (%${weakest.pct} ${weakest.name}) çok yönlü gelişimi desteklenmeli."`;
  }

  function flags(m) {
    const out = [];
    out.push({ type: 'info', text: `Görsel / Metin Odak Dağılımı: %${m.visualRatio} Görsel · %${m.textRatio} Metin (${m.focusStyle}).` });
    if (m.puzzleRetries > 0 && m.puzzleGiveUps === 0) {
      out.push({ type: 'positive', text: `Yüksek Yılmazlık (Resilience): Zorlandığında pes etmeyip ${m.puzzleRetries} kez "Tekrar Dene"ye bastı.` });
    } else if (m.puzzleGiveUps > 0) {
      out.push({ type: 'watch', text: `Hata Sonrası Tepki: Bulmacada zorlandığında ${m.puzzleGiveUps} kez yöntem değiştirdi/vazgeçti. Yılmazlık desteklenebilir.` });
    }
    if (m.avgLatency != null && m.avgLatency < 3500) {
      out.push({ type: 'watch', text: `Düşük Tereddüt Süresi (ort. ${(m.avgLatency / 1000).toFixed(1)} sn): Hızlı/dürtüsel karar eğilimi.` });
    } else if (m.avgLatency != null && m.avgLatency > 9500) {
      out.push({ type: 'info', text: `Uzun Tereddüt Süresi (ort. ${(m.avgLatency / 1000).toFixed(1)} sn): Karar öncesi derin/analitik değerlendirme.` });
    }
    out.push({
      type: m.audioMuted ? 'info' : 'positive',
      text: `İşitsel Duyarlılık: Oyun müziğini/seslerini ${m.audioMuted ? 'kapattı (sessiz odaklanma)' : 'açık tuttu (işitsel atmosferle etkileşim)'}.`,
    });
    return out;
  }

  function confidence(m) {
    const n = m.decisions;
    if (n >= 4) return { level: 'Yüksek', note: `${n} kriz bölümü tamamlandı` };
    if (n >= 2) return { level: 'Orta', note: `${n} kriz bölümü tamamlandı` };
    return { level: 'Başlangıç', note: `Henüz ${n} bölüm tamamlandı` };
  }

  return { compute, metrics };
})();
