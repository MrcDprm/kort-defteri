import { router, Stack } from 'expo-router';
import { uzunTarih } from '@/domain/tarih';
import { useVeri } from '@/db/olay';
import { turnuvalar } from '@/db/veri';
import { Bolum, Bos, Ekran, MetinDugme, Satir, Yukleniyor } from '@/ui/bilesenler';

export default function Turnuvalar() {
  const { veri } = useVeri(turnuvalar);
  if (!veri) return <Yukleniyor />;
  return (
    <Ekran>
      <Stack.Screen options={{ title: 'Turnuvalar', headerRight: () => <MetinDugme yazi="Ekle" onPress={() => router.push('/turnuva')} /> }} />
      <Bolum stil={{ marginTop: 4 }}>
        {veri.length === 0 ? (
          <Bos yazi="Henüz turnuva yok. Turnuvayı, katılan sporcuları ve sonuçlarını ekle; her sporcunun profilinde de görünür." dugme="Turnuva ekle" onPress={() => router.push('/turnuva')} />
        ) : (
          veri.map((t, i) => (
            <Satir
              key={t.id}
              baslik={t.name}
              alt={[uzunTarih(t.date), t.place, t.category, `${t.katilimci} sporcu`].filter(Boolean).join(', ')}
              onPress={() => router.push({ pathname: '/turnuva', params: { id: t.id } })}
              son={i === veri.length - 1}
            />
          ))
        )}
      </Bolum>
    </Ekran>
  );
}
