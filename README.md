# 🚀 Mission: Future — Oynanabilir Prototip

2085 yılında Proxima B gezegeninde geçen, **gölge veri (shadow data)** tabanlı karakter ve karar analizi oyununun tam çalışır web prototipi.

## Hızlı Başlangıç

Projede harici bağımlılık veya derleme adımı yoktur. Doğrudan [index.html](index.html) dosyasını tarayıcıda açabilir veya yerel bir sunucu (Service Worker / çevrimdışı önbellek için önerilir) başlatabilirsiniz:

```powershell
py -m http.server 8080
```

Ardından tarayıcıda:
- **Öğrenci Oyunu:** `http://localhost:8080/index.html`
- **Öğretmen Paneli:** `http://localhost:8080/teacher.html` (Prototip PIN: **`2085`**)

## Özellikler

- **100 Günlük Koloni Simülasyonu:** Oksijen, su, gıda, enerji, malzeme ve moral yönetimi; 6 farklı bina türü; rasyon politikaları ve 4 mürettebat danışmanı.
- **12 Kriz ve Süreç Senaryosu:**
  - *Gün 1 Brifing:* Yönerge okuma hızı, kaydırma oranı ve atlama davranışı.
  - *Gün 5 Reaktör Arızası:* İnteraktif kablo-port bulmacası (deneme-yanılma vs. teknik kılavuz vs. mühendise devretme + geri alma sayısı).
  - *Gün 30 Meteor Yağmuru:* 12 saniyelik gerçek zamanlı geri sayım ve olasılık radarı altında stres performansı.
  - *Gün 40 İlk Temas:* İki aşamalı dallanan senaryo (savunma, iletişim veya önce gözlem/veri toplama).
  - *Gün 70 Güç Kesintisi:* 5 sistemi öncelik sırasına dizme ve düzeltme/geri alma takibi.
  - *Gün 75 & 80 Toz Fırtınası:* Uyarı sonrası 5 günlük gerçek kaynak hazırlığının ölçülmesi.
  - *Gün 12, 20, 50, 60, 90:* Sosyal çatışma, salgın, mağara keşfi ve mülteci gemisi ikilemleri.
- **Gölge Veri (Shadow Data) Motoru:** Tereddüt süresi (`latencyMs`), seçenekler arası gezinme (`hoverSwitches`), kılavuz açma/okuma süresi, geri alma (`undo`), ek bilgi talebi, mürettebatla konuşma ve başarısızlık sonrası yeniden deneme refleksi.
- **Öğretmen Paneli:** 6 boyutlu SVG radar grafiği, 7 arketip (Stratejist, Sürdürülebilir, Sabırsız, Bağ Kurucu, Koruyucu, Kâşif, Mükemmeliyetçi), sınıf ısı haritası, görüşme soruları, tek tıkla **Demo Sınıfı Oluşturma** ve KVKK uyumlu anonim JSON dışa aktarma.
