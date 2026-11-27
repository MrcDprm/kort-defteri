# Kort Defteri: tasarım

## Kim, nerede, ne için

- **Kullanıcı:** tek bir tenis antrenörü.
- **Ortam:** açık kortta, çoğu zaman güneş altında, bir elinde raket ya da top sepeti varken telefonuna bakıyor.
- **Ana iş:** sıradaki dersi görmek, yoklamayı birkaç dokunuşla almak, kimin ödemediğini bilmek.
- **İkinci iş:** velilere ve yanındaki insanlara uygulamayı göstermek. Profil ve gelişim karnesi bu yüzden vitrin gibi tasarlanır.

## Yön

- **Açık zemin:** Koyu tema güneşte okunmuyor. Bu karar kategoriden değil, kullanım yerinden geliyor.
- **Kortun kendisi:** Sert kortun üstten görünüşü, yani mavi oyun alanı, yeşil dış saha ve beyaz çizgiler, uygulamanın imzası. Yalnızca başlıklarda kullanılır; ekranın geri kalanı sade kalır.
- **Gerçek anlamı olan renkler:**
  - Yeşil ve kırmızı yalnızca geldi-gelmedi ile ödendi-ödenmedi için kullanılır.
  - Top sarısı yalnızca o anda yapılacak işin düğmesindedir.
  - Çocukların top evresi ITF'in gerçek top renkleriyle çizilir: kırmızı, turuncu ve yeşil top iki renkli keçe, sarı top tek renk.
- **Renk tek başına bilgi taşımaz:** Her renk yanında bir yazıyla gelir. Güneşte ya da renk körlüğünde de okunur.

## Renkler

| Ad | Hex | Görev |
|---|---|---|
| Kireç | `#F4F5F1` | Zemin, kort çizgisi boyasının soğuk beyazı |
| Kort mavisi | `#2E5E8E` | Başlıklar, seçili sekme, grafikte güncel değerlendirme |
| Saha yeşili | `#4F7F55` | Yalnızca kort çiziminin dış sahası |
| Top sarısı | `#D9F04A` | Ana eylem düğmesi, üstünde mürekkep rengi yazı |
| Mürekkep | `#17212B` | Metin |
| Soluk | `#66717C` | İkincil metin |
| Çizgi | `#DADDD6` | Ayırıcılar |
| Geldi, ödendi | `#188A4A`, zemini `#E2F2E8` | Durum |
| Gelmedi, ödenmedi | `#CF3B3B`, zemini `#FBE6E4` | Durum |

## Yazı

Tek aile: **Archivo**, Omnibus-Type, SIL Open Font License, Latin Extended ile Türkçe karakterler tam. Genişlik ekseni 62-125 arası. Uygulamaya statik TTF dosyaları olarak gömülür.

| Rol | Kesim |
|---|---|
| Ekran başlığı | Archivo SemiExpanded, ExtraBold |
| Sayılar, saatler | Archivo Condensed, ExtraBold, eşit genişlikli rakamlar |
| Gövde ve arayüz | Archivo, Regular ve SemiBold |

Saatler ve sayılar dar kesimde maç tabelası gibi okunur, başlıklar geniş kesimde. İkinci bir aileye gerek kalmadan hiyerarşi genişlikten gelir.

## Ekran düzeni

```
┌──────────────────────────────┐
│ ░ kort çizimi, mavi + yeşil ░│  tarih, bugün kaç ders, sıradaki saat
│ ░  top servis kutusunda     ░│
├──────────────────────────────┤
│ 32 │ 24/32 │ 8 │ 4           │  aktif, bu ay ödedi, turnuva, kalan ders
├──────────────────────────────┤
│ 14:00          35 dk sonra   │  sıradaki ders
│ Bireysel antrenman, Kort 2   │
│ [ Yoklamayı aç ]  top sarısı │
├──────────────────────────────┤
│ Programın geri kalanı        │  satır listesi, kart değil
│ Bu hafta: doğum günü, gecikme│
├──────────────────────────────┤
│ Bugün Sporcular Takvim Ödeme Profilim │
└──────────────────────────────┘
```

- İçerik sola hizalı.
- Kart yalnızca sıradaki ders ve sayı şeritleri için kullanılır, listeler düz satırlardır.
- Dokunma alanları en az 44 piksel, ana düğmeler 52 piksel.
- Ekran 375x667'de taşmadan çalışır; uzun listeler kayar, ana düğme altta sabit durur.

## Hareket

- **Tek kurulu hareket:** Bugün ekranı açılırken top servis kutusuna bir kez seker.
- **Geri bildirim hareketi:** Yoklamada geldi ya da gelmedi seçilince düğme renge dolar.
- **Hareketi azalt:** Telefonda bu ayar açıksa hiçbir hareket oynamaz.

## Kaçınılanlar

- Koyu zemin ve tek parlak vurgu rengi.
- Krem zemin ve kiremit rengi.
- Her şeyin aynı kartlara bölünmesi.
- Başlık üstünde küçük büyük harfli etiketler.
- Ekran çerçevesi ya da sahte telefon çizimi.
