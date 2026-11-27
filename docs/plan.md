# Kort Defteri: plan

Bir tenis antrenörünün günlük işini tek uygulamada toplayan iPhone ajandası: sporcular, ödemeler, ders programı, yoklama, performans takibi, turnuvalar ve hocanın kendi profili. App Store'a çıkmaz; tek bir iPhone'a ad hoc derlemeyle kurulur ve hoca sahada her gün kullanır.

## Kararlar

| Konu | Karar | Neden |
|---|---|---|
| Platform | Expo + React Native + TypeScript, iOS | Yerel bildirim gerekiyor, web uygulaması iOS'ta zamanlanmış bildirim gönderemiyor |
| Kurulum | EAS internal distribution, ad hoc, tek derleme | App Store ve TestFlight yok; TestFlight derlemesi 90 günde biter, ad hoc profil bir yıl geçerli |
| Güncelleme | EAS Update | JS değişiklikleri derleme hakkı harcamadan telefona gelir |
| Ana veri | expo-sqlite, telefonda | Kortta çekim olmasa da anında çalışır |
| Yedek | Supabase Storage, otomatik | Uygulama silinse ya da telefon değişse de veri geri gelir |
| Bildirim | expo-notifications, yalnızca yerel bildirim | Sunucu ve push sertifikası gerekmez, internetsiz de gelir |
| Gezinme | expo-router | Dosya tabanlı ekranlar, Expo Go'da çalışır |
| Grafik | react-native-svg ile elle çizilen radar ve çizgi grafik | Kütüphane yükü yok, mülakatta anlatması kolay |
| Test | Vitest, saf TypeScript iş mantığı | Ödeme durumu, doğum günü, ders üretimi, bildirim planı, yedek doğrulama gibi kurallar React Native'den ayrı test edilir |
| Expo sürümü | SDK 58 | iPhone'daki Expo Go yalnızca en yeni SDK'yı açıyor; geliştirme derlemesiz Expo Go ile yapılır |

Kod yorumları Türkçe. Uygulama içi metinler Türkçe.

## Ücretsiz katman kontrolü

| Servis | Sınır | Bizim kullanım |
|---|---|---|
| EAS Build Free | Ayda 15 iOS derlemesi, Odd Lives ile ortak | Toplam 1 derleme, yılda 1 yenileme. Kasımın son derlemesi Odd Lives'a ayrıldığı için derleme aralıkta alınır |
| EAS Update Free | 1.000 aylık aktif kullanıcı | 1 kullanıcı |
| Supabase Free | 1 GB Storage, 5 GB aylık çıkış trafiği, 500 MB veritabanı, hesap başına 2 aktif ücretsiz proje, 7 gün hiç istek gelmezse proje duraklatılır | Fotoğraf başına sıkıştırılmış yaklaşık 120 KB, 40 sporcu için yaklaşık 5 MB; son 30 yedek yaklaşık 6 MB. Hoca her gün kullandıkça proje duraklamaz; duraklarsa panelden yeniden açılır, veri silinmez |
| Apple Developer | Mevcut üyelik, yıllık 100 iPhone kaydı | 1 iPhone |

Aylık maliyet: 0 TL. Supabase'de 2 ücretsiz proje hakkının dolu olup olmadığı proje açılırken kontrol edilir.

## Ekranlar ve özellikler

### Ana sayfa
- Sayaçlar: aktif sporcu, bu ay ödeme yapan ve bekleyen, turnuva sporcusu, bugün kalan ders.
- Bugünün programı; derse dokununca yoklama açılır.
- Bu haftaki doğum günleri.
- Geciken ödemeler.
- Yedek durumu: son yedek zamanı, yedek alınamıyorsa uyarı.

### Sporcular
- Ad soyad, veli adı soyadı, doğum tarihi, fotoğraf, sporcu ve veli telefonu.
- Oynadığı top: kırmızı, turuncu, yeşil, sarı.
- Deneyim, yani başlama tarihi; grup; sağ ya da sol el; tek ya da çift el backhand.
- Boy ve kilo geçmiş olarak tutulur, gelişim grafiği çıkar.
- Aktif ve pasif durumu, turnuva sporcusu işareti, serbest notlar.
- Arama ve gruba göre süzme.
- Fotoğraf seçilince 800 piksel genişliğe sıkıştırılıp kaydedilir.

### Ödemeler
- İki ödeme türü: aylık aidat, sporcuya göre tutar ve ödeme günü; paket ders, örneğin 8 derslik paket.
- Ay ay her sporcu: ödeme tarihi, tutar, ödedi mi. Ödediyse yeşil, ödemediyse kırmızı, günü geçtiyse gecikmiş.
- Tek dokunuşla ödendi işareti, nakit ya da havale.
- Pakette kalan ders sayısı yoklamadan otomatik düşer; paket bitince ödeme bekleyene geçer.
- Veliye hazır yazılmış WhatsApp hatırlatması, wa.me linkiyle.
- Aylık toplam gelir ve bekleyen tutar.

### Takvim ve yoklama
- Haftalık tekrar eden dersler: gün, saat, kort, grup ya da özel ders, sporcular.
- Haftalık plan ve günlük liste.
- Yoklama: geldi yeşil, gelmedi kırmızı, tek dokunuşla.
- Yağmur ya da başka nedenle iptal, telafi dersi ekleme.
- Sporcu bazında devam oranı.

### Performans
- Metrikler: forehand, backhand, servis, servis karşılama, vole, smaç, ayak hareketi, kondisyon, taktik, mental. Hoca listeyi düzenleyebilir, yeni metrik ekleyebilir.
- Tarihli değerlendirme, her metrik 1-5 arası, hoca notu.
- Radar grafik ve metrik bazında zaman içindeki gelişim.
- Gelişim karnesi görseli: sporcu fotoğrafı, radar, son değişimler, hoca adı; WhatsApp ile veliye paylaşılır.

### Turnuvalar
- Turnuva adı, tarihi, yeri, kategorisi.
- Katılan sporcular ve sonuçları.

### Profilim
- Hocanın fotoğrafı, tanıtım yazısı, deneyimi, sertifikaları, Instagram ve WhatsApp bağlantıları.
- Velilere telefondan gösterilecek vitrin sayfası olarak tasarlanır.
- Alt bilgi: © yıl Miraç Deprem, yıl o anki tarihten gelir.

### Bildirimler
- Sabah özeti, saati ayarlanabilir: bugünkü ders sayısı, ödeme günü gelenler, doğum günleri.
- Ders öncesi hatırlatma, dakikası ayarlanabilir ya da kapatılabilir.
- Geciken ödeme hatırlatması.
- Doğum günü: hafta başında o haftanın doğum günleri ve günün kendisi.
- iOS aynı anda en fazla 64 yerel bildirim tutar. Uygulama her açıldığında ve her veri değişikliğinde önümüzdeki 14 günün bildirimleri silinip yeniden kurulur; plan 64'ü geçmeyecek şekilde önceliklendirilir.

### Yedek ve geri yükleme
- Supabase'de tek hesap, e-posta ve şifreyle, e-posta doğrulamalı. Hesap açıldıktan sonra yeni kayıt kapatılır.
- Oturum belirteci expo-secure-store'da, yani iOS Keychain'de tutulur.
- Her veri değişikliğinden 30 saniye sonra ve uygulama arka plana geçerken tüm veri tek JSON olarak yüklenir. İnternet yoksa sonra yeniden denenir.
- Fotoğraflar içerik özetiyle adlandırılıp bir kez yüklenir, her yedekte tekrar gitmez.
- Özel bucket, RLS ile her kullanıcı yalnızca kendi klasörünü görür: `<kullanıcı-id>/yedekler/`, `<kullanıcı-id>/fotograflar/`.
- Son 30 yedek saklanır, eskisi silinir.
- Geri yükleme: giriş yap, yedek listesinden seç. İndirilen dosya şema ve sürüm doğrulamasından geçmeden veritabanına yazılmaz.
- Telefonun kendi iCloud yedeği de uygulama verisini içerir.

### Ayarlar
- Bildirim saatleri, metrik listesi, gruplar ve kortlar, yedek durumu, uygulama sürümü.

## Veri modeli

- `coach_profile`: tek satır, hocanın profil bilgileri.
- `athletes`: sporcu bilgileri, ödeme türü, aylık tutar ve ödeme günü.
- `measurements`: sporcu, tarih, boy, kilo.
- `lesson_templates`: haftalık tekrar eden ders.
- `lessons`: tarihli ders, durumu planlı, yapıldı ya da iptal; telafi ise bağlı olduğu ders.
- `lesson_athletes` ve `attendance`: derse kayıtlı sporcular ve yoklama.
- `payments`: sporcu, dönem ya da paket, vade, tutar, ödeme tarihi, yöntem.
- `packages`: sporcu, ders sayısı, alış tarihi, tutar; kalan ders yoklamadan hesaplanır.
- `metrics`, `evaluations`, `evaluation_scores`: performans.
- `tournaments`, `tournament_entries`: turnuvalar ve sonuçlar.
- `settings`: anahtar ve değer.

Tüm kimlikler UUID. Şema sürümlüdür, göçler sırayla uygulanır.

## Klasör yapısı

```
mobile/04-kort-defteri/
├── app/                 expo-router ekranları
├── src/
│   ├── domain/          saf TypeScript kurallar ve testleri
│   ├── db/              SQLite şema, göçler, veri erişimi
│   ├── backup/          Supabase yedek ve geri yükleme
│   ├── notifications/   bildirim planı ve zamanlama
│   └── ui/              tema, bileşenler, grafikler
├── assets/              ikon, yazı tipleri
└── docs/
```

## Yapım sırası

Her parça kendi branch'inde, testleri geçer durumda biter.

1. Tasarım önerisi: palet, yazı tipleri, sahadan gelen imza çizim, ana sayfa ve sporcu ekranı taslağı. Onaydan sonra koda geçilir.
2. İskelet: Expo SDK 58, expo-router, tema, alt sekmeler, SQLite şema ve göçler, Vitest.
3. Sporcular ve sporcu profili.
4. Ödemeler ve paket ders.
5. Takvim ve yoklama.
6. Ana sayfa.
7. Performans ve gelişim karnesi.
8. Turnuvalar ve Profilim.
9. Bildirimler.
10. Supabase giriş, otomatik yedek ve geri yükleme.
11. Ayarlar, ekran görüntüleri için örnek veri, son tarama.
12. Ad hoc derleme ve hocanın telefonuna kurulum, aralık ayında.

## Kurulum adımları, hocanın telefonu

1. `eas device:create` ile üretilen link hocanın iPhone'unda Safari'den açılır, profil yüklenir.
2. `eas build --profile preview --platform ios` ile tek derleme alınır.
3. Hoca kurulum linkinden uygulamayı yükler.
4. Ayarlar > Gizlilik ve Güvenlik > Geliştirici Modu açılır, telefon yeniden başlatılır.
5. Sonraki değişiklikler `eas update` ile gider. Ad hoc profilin süresi dolmadan yeni derleme eskisinin üzerine kurulur, veri korunur.

## Yayın sonrası

- Portfolyo kartı: bir tenis antrenörünün günlük kullanımı için geliştirildiği yazılır. Ekran görüntüleri örnek veriyle çekilir, gerçek sporcu verisi hiçbir görselde yer almaz.
- İki dilli README, ekran görüntüleriyle.
- LinkedIn gönderisi: gerçek bir kullanıcının sahadaki ihtiyacından çıkan kararlar anlatılır, örneğin neden web değil native, bildirimlerin sunucusuz kurulması, verinin telefonda kalıp otomatik yedeklenmesi. Görseller örnek veriyle.
