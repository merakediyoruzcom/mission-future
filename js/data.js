/* Mission: Future — Oyun verileri, 4 Ana Kriz Bölümü ve ekonomi modeli */
window.MF = window.MF || {};

MF.TOTAL_DAYS = 100;

MF.RESOURCES = [
  { key: 'o2', name: 'Oksijen', icon: '💨', max: 200 },
  { key: 'water', name: 'Su', icon: '💧', max: 200 },
  { key: 'food', name: 'Gıda', icon: '🥫', max: 200 },
  { key: 'energy', name: 'Enerji', icon: '⚡', max: 200 },
  { key: 'materials', name: 'Malzeme', icon: '🧱', max: 300 },
];

MF.BUILDINGS = {
  solar:      { name: 'Güneş Paneli',       icon: '☀️', cost: 20, desc: '+12 enerji/gün', pkys: { systemist: 2 } },
  greenhouse: { name: 'Sera',               icon: '🌱', cost: 30, desc: '+8 gıda · −3 enerji', pkys: { systemist: 2 } },
  water:      { name: 'Su Arıtıcı',         icon: '💧', cost: 30, desc: '+8 su · −3 enerji', pkys: { systemist: 2 } },
  oxygen:     { name: 'O₂ Jeneratörü',      icon: '💨', cost: 30, desc: '+9 O₂ · −3 enerji', pkys: { maker: 2 } },
  habitat:    { name: 'Yaşam & Sanat Kubbesi', icon: '🏠', cost: 35, desc: '+3 moral · −2 enerji', pkys: { connector: 2, designer: 2 } },
  shield:     { name: 'Nöbetçi Kalkan Kulesi', icon: '🛡️', cost: 40, desc: 'Savunma sağlar · −2 enerji', pkys: { strategist: 3 } },
};

MF.RATIONS = {
  low:    { name: 'Tasarruflu', food: 0.16, morale: -1 },
  normal: { name: 'Dengeli',    food: 0.25, morale: 0.5 },
  high:   { name: 'Cömert',     food: 0.34, morale: 2 },
};

MF.CREW = [
  { key: 'deniz', name: 'Deniz',    role: 'Baş Mühendis (Yapıcı)',     icon: '🔧', color: '#3b6fd8' },
  { key: 'elif',  name: 'Elif',     role: 'Ekolog & Sistem Uzmanı',    icon: '🌿', color: '#2f9e6e' },
  { key: 'kaan',  name: 'Dr. Kaan', role: 'Veri & Yazılım Bilimcisi',  icon: '💻', color: '#b0476b' },
  { key: 'mira',  name: 'Mira',     role: 'İletişim & Kültür Elçisi',  icon: '📡', color: '#a06a1d' },
];

/* 4 Ana Bölüm (GDD) + 12 kriz/süreç senaryosu (aşağıda) */
MF.CHAPTERS = [
  { num: 1, day: 1,  key: 'landing', title: 'Bölüm 1: İniş Alanı Seçimi',        sub: 'Stratejist vs. Sistemci' },
  { num: 2, day: 5,  key: 'repair',  title: 'Bölüm 2: Ana Reaktör Arızası',      sub: 'Yapıcı vs. Kaşif' },
  { num: 3, day: 40, key: 'contact', title: 'Bölüm 3: İlk Temas',                 sub: 'Bağ Kurucu vs. Stratejist' },
  { num: 4, day: 85, key: 'flag',    title: 'Bölüm 4: Koloni Bayrağı',           sub: 'Tasarımcı & Sabır' },
];

/* 12 Kriz ve Süreç Senaryosu (Görev Metni):
 * 1: Brifing, 5: Reaktör, 12: Sosyal çatışma, 20: Salgın, 30: Meteor,
 * 40: İlk temas, 50: Mağara, 60: Lojistik ikilemi, 70: Güç kesintisi,
 * 75/80: Toz fırtınası (uyarı + vuruş), 85: Bayrak (süreç), 90: Mülteci gemisi.
 */
MF.EVENT_DAYS = {
  1:  'landing',
  5:  'repair',
  12: 'conflict',
  20: 'epidemic',
  30: 'meteor',
  40: 'contact',
  50: 'cave',
  60: 'logistics',
  70: 'outage',
  75: 'storm75',
  80: 'storm80',
  85: 'flag',
  90: 'refugee',
};

MF.newState = function () {
  return {
    day: 1,
    landingSite: null, // 'river' | 'mountain'
    res: { o2: 110, water: 100, food: 100, energy: 80, materials: 60 },
    morale: 80,
    pop: 30,
    buildings: { solar: 1, greenhouse: 1, water: 1, oxygen: 1, habitat: 0, shield: 0 },
    ration: 'normal',
    stormDays: 0,
    flags: {},
    prep75: null,   // Gün 75 fırtına uyarısındaki kaynak/istatistik anlık görüntüsü
    stormReady: 0,  // Gün 80'de hesaplanan fırtına hazırlık puanu
    seenEvents: {},
  };
};

/** Bir günlük net değişimi hesaplar. Bükülme (Twist): Koloni asla "Game Over" olmaz; acil destek devreye girer. */
MF.dailyDelta = function (s, overrides = {}) {
  const b = s.buildings;
  const pop = overrides.pop ?? s.pop;
  const siteWaterBonus = s.landingSite === 'river' ? 5 : 0;
  const siteMatBonus = s.landingSite === 'mountain' ? 3 : 0;
  const solarEach = 12;
  const energyUse = 3 * (b.greenhouse + b.water + b.oxygen) + 2 * (b.habitat + b.shield);
  const energyIn = b.solar * solarEach;
  const powered = s.res.energy + energyIn >= energyUse ? 1 : 0.65;
  const r = MF.RATIONS[s.ration];
  return {
    energy: energyIn - energyUse,
    o2: b.oxygen * 9 * powered - pop * 0.22,
    water: b.water * 8 * powered + siteWaterBonus + (s.flags.allies ? 4 : 0) - pop * 0.22,
    food: b.greenhouse * 8 * powered - pop * r.food,
    materials: 4 + siteMatBonus + (s.flags.mine ? 3 : 0),
    morale: b.habitat * 3 + r.morale,
  };
};

MF.crewLine = function (key, s) {
  const d = s.day;
  const lines = {
    deniz: () => {
      if (s.flags.repairChoice === 'maker') return 'Reaktörü ellerinle tamir edişin efsaneydi kaptan! Gerçek bir Yapıcısın.';
      if (s.flags.repairChoice === 'explorer') return 'Yazılımdaki o satır hatasını bulman harika bir analitik refleksti!';
      if (s.flags.repairChoice === 'delegate') return 'Reaktörü ustasına devretmen de akıllıca bir yönetim refleksiydi.';
      if (d < 12) return 'Ana reaktörden garip bir titreşim geliyor. Alet çantam hazırdır, bir pürüz olursa hemen bakarım.';
      return 'Modüller sorunsuz çalışıyor. Yeni bir O₂ jeneratörü veya panel kurabiliriz.';
    },
    elif: () => {
      if (s.landingSite === 'river') return 'Nehir kenarı su açısından harika ama taşkın sensörlerini gözlemlemeliyiz.';
      if (s.landingSite === 'mountain') return 'Dağ eteği çok güvenli bir zemin sundu. Su arıtıcılarla dengeyi kurduk.';
      return 'Proxima B ekosistemiyle uyum içinde büyüyoruz. Seralar verimli.';
    },
    kaan: () => {
      if (d < 20) return 'Geminin yazılım loglarını tarıyorum. Sensör verilerini okumak her zaman sürprizleri önler.';
      if (s.flags.outageOrder) return 'Güç kesintisindeki sistem önceliğin telemetriye kaydedildi; analizin devam ediyor.';
      return 'Telemetri verileri stabil. Kararların koloni algoritmasını şekillendiriyor.';
    },
    mira: () => {
      if (d >= 30 && d < 40) return 'Gökyüzünde yabancı iki metal parçacığı algıladım. Bir şey yolda olabilir, gözlemliyorum.';
      if (d >= 75 && d < 85) return 'Toz fırtınası bastınca kubbeleri kapatmıştık; şimdi Dünya\'ya ilk büyük sinyalimizi hazırlıyoruz!';
      if (d >= 85) return 'Yakında Dünya\'ya ilk büyük sinyalimizi ve koloni bayrağımızı göndereceğiz!';
      return 'Unutma kaptan: burada doğru ya da yanlış karar yok; senin liderlik tarzın var.';
    },
  };
  return lines[key]();
};
