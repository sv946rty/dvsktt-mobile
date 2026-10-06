import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';

export default function TabLayout() {
  const { c, t } = useStore();
  const ins = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.jade,
        tabBarInactiveTintColor: c.ink2,
        tabBarStyle: { backgroundColor: c.leaf, borderTopColor: c.rule, height: 58 + ins.bottom, paddingBottom: ins.bottom + 6, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: F.uiM, fontSize: 11 },
      }}>
      <Tabs.Screen name="index" options={{ title: t('Đọc', 'Read'), tabBarIcon: ({ color }) => <Icon name="book" color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: t('Tìm', 'Search'), tabBarIcon: ({ color }) => <Icon name="search" color={color} /> }} />
      <Tabs.Screen name="saved" options={{ title: t('Đã lưu', 'Saved'), tabBarIcon: ({ color }) => <Icon name="star" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('Tùy chọn', 'Settings'), tabBarIcon: ({ color }) => <Icon name="gear" color={color} /> }} />
    </Tabs>
  );
}
