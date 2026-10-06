import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsPanel } from '@/components/SettingsPanel';
import { getChapter } from '@/lib/content';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';

export default function Settings() {
  const { c, t } = useStore();
  const b = getChapter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <Text style={{ fontFamily: F.viB, fontSize: 26, color: c.ink, marginTop: 8 }} accessibilityRole="header">{t('Tùy chọn', 'Settings')}</Text>
        <SettingsPanel />
        <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2, marginTop: 18, lineHeight: 18 }}>
          {t('Bản thử riêng tư. Nguồn:', 'Private test build. Sources:')}{'\n'}中文: {b.sources.zh}{'\n'}Việt: {b.sources.vi}{'\n'}English: {b.sources.en}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
