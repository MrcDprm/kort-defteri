import { Tabs } from 'expo-router';
import { SekmeIkonu } from '@/ui/cizimler';
import { renk, yazi } from '@/ui/tema';

export default function SekmeYerlesimi() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: renk.kort,
        tabBarInactiveTintColor: renk.soluk,
        tabBarStyle: { backgroundColor: renk.beyaz, borderTopColor: renk.cizgi },
        tabBarLabelStyle: { fontFamily: yazi.yariKalin, fontSize: 11 },
        sceneStyle: { backgroundColor: renk.kirec },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bugün', tabBarIcon: ({ color }) => <SekmeIkonu ad="bugun" renk={String(color)} /> }} />
      <Tabs.Screen name="sporcular" options={{ title: 'Sporcular', tabBarIcon: ({ color }) => <SekmeIkonu ad="sporcular" renk={String(color)} /> }} />
      <Tabs.Screen name="takvim" options={{ title: 'Takvim', tabBarIcon: ({ color }) => <SekmeIkonu ad="takvim" renk={String(color)} /> }} />
      <Tabs.Screen name="odemeler" options={{ title: 'Ödemeler', tabBarIcon: ({ color }) => <SekmeIkonu ad="odemeler" renk={String(color)} /> }} />
      <Tabs.Screen name="profil" options={{ title: 'Profilim', tabBarIcon: ({ color }) => <SekmeIkonu ad="profil" renk={String(color)} /> }} />
    </Tabs>
  );
}
