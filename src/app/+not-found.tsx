import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';

export default function NotFound() {
  const { c, t } = useStore();
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: c.paper, gap: 12 }}>
        <Text style={{ fontFamily: F.viB, fontSize: 20, color: c.ink }}>{t('Không có trang này.', 'This page does not exist.')}</Text>
        <Link href="/"><Text style={{ fontFamily: F.uiM, color: c.jade }}>{t('Về thư viện', 'Back to the library')}</Text></Link>
      </View>
    </>
  );
}
