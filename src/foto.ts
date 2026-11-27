import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Fotoğraflar uygulama belgeler klasöründe tutulur; veritabanına yalnızca dosya adı yazılır.
// iOS uygulama klasörünün tam yolunu güncellemelerde değiştirebildiği için tam yol saklanmaz.
export function fotoKlasoru(): Directory {
  const d = new Directory(Paths.document, 'fotograflar');
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

export function fotoDosyasi(ad: string): File {
  return new File(fotoKlasoru(), ad);
}

export function fotoAdresi(ad: string | null | undefined): string | null {
  if (!ad) return null;
  const f = fotoDosyasi(ad);
  return f.exists ? f.uri : null;
}

async function kaydet(uri: string): Promise<string> {
  const islem = ImageManipulator.manipulate(uri).resize({ width: 800 });
  const goruntu = await islem.renderAsync();
  const sonuc = await goruntu.saveAsync({ compress: 0.72, format: SaveFormat.JPEG });
  const ad = `${Crypto.randomUUID()}.jpg`;
  await new File(sonuc.uri).copy(fotoDosyasi(ad));
  return ad;
}

/** Kameradan ya da galeriden fotoğraf alır, 800 piksele küçültüp kaydeder ve dosya adını döner. */
export function fotoSec(): Promise<string | null> {
  return new Promise((coz) => {
    const al = async (kamera: boolean) => {
      try {
        const izin = kamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!izin.granted) {
          Alert.alert('İzin gerekli', kamera ? 'Fotoğraf çekmek için Ayarlar > Kort Defteri bölümünden kameraya izin ver.' : 'Fotoğraf seçmek için Ayarlar > Kort Defteri bölümünden fotoğraflara izin ver.');
          coz(null);
          return;
        }
        const secenek: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
        const r = kamera ? await ImagePicker.launchCameraAsync(secenek) : await ImagePicker.launchImageLibraryAsync(secenek);
        const varlik = r.canceled ? undefined : r.assets[0];
        coz(varlik ? await kaydet(varlik.uri) : null);
      } catch {
        Alert.alert('Fotoğraf eklenemedi', 'Fotoğraf işlenirken bir sorun çıktı, başka bir fotoğrafla tekrar dene.');
        coz(null);
      }
    };
    // Uyarı penceresi kapanmadan seçici açılırsa iOS seçiciyi göstermeyebiliyor; kısa bir bekleme bırakılır.
    const sonra = (kamera: boolean) => setTimeout(() => void al(kamera), 400);
    Alert.alert('Fotoğraf', undefined, [
      { text: 'Fotoğraf çek', onPress: () => sonra(true) },
      { text: 'Galeriden seç', onPress: () => sonra(false) },
      { text: 'Vazgeç', style: 'cancel', onPress: () => coz(null) },
    ]);
  });
}

/** Artık hiçbir kaydın kullanmadığı fotoğraf dosyasını siler. */
export function fotoSil(ad: string | null | undefined): void {
  if (!ad) return;
  try {
    const f = fotoDosyasi(ad);
    if (f.exists) f.delete();
  } catch {
    // Silinemeyen dosya yalnızca yer kaplar, işleyişi bozmaz.
  }
}
