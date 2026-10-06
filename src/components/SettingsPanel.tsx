// Reading settings, used by the Settings tab and the reader's Aa sheet.
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useStore, type Prefs } from '@/lib/store';
import { F, SIZES } from '@/lib/theme';
import { Card, Seg, SectionLabel } from './ui';

export function SettingsPanel({ compact }: { compact?: boolean }) {
  const { c, t, prefs, setPrefs } = useStore();
  const toggles: [keyof Prefs, string, string][] = [
    ['al', 'Sáng cả câu tương ứng', 'Light up the matching clause'],
    ['ruby', 'Âm Hán-Việt dưới chữ Hán', 'Sino-Vietnamese reading under characters'],
    ['norm', 'Chuẩn hóa chữ dị thể', 'Normalise variant characters'],
    ['hideEd', 'Ẩn chữ dịch giả thêm [ ]', 'Hide translator additions [ ]'],
    ['hideOn', 'Ẩn chú nhỏ của nguyên văn ( )', 'Hide small original notes ( )'],
  ];
  const step = (d: number) => setPrefs({ size: Math.max(0, Math.min(SIZES.length - 1, prefs.size + d)) });
  return (
    <View>
      <SectionLabel style={compact ? { marginTop: 4 } : undefined}>{t('Cỡ chữ', 'Text size')}</SectionLabel>
      <Card style={s.sizeRow}>
        <Pressable onPress={() => step(-1)} accessibilityRole="button" accessibilityLabel={t('Chữ nhỏ hơn', 'Smaller text')} style={s.sizeBtn}><Text style={{ fontFamily: F.vi, fontSize: 15, color: c.ink }}>A</Text></Pressable>
        <View style={s.dots} accessibilityRole="adjustable" accessibilityValue={{ min: 1, max: SIZES.length, now: prefs.size + 1 }}>
          {SIZES.map((_, i) => (
            <Pressable key={i} onPress={() => setPrefs({ size: i })} hitSlop={8} accessibilityLabel={`${t('Cỡ', 'Size')} ${i + 1}`}
              style={[s.dot, { backgroundColor: i <= prefs.size ? c.jade : c.rule, transform: [{ scale: i === prefs.size ? 1.5 : 1 }] }]} />
          ))}
        </View>
        <Pressable onPress={() => step(1)} accessibilityRole="button" accessibilityLabel={t('Chữ lớn hơn', 'Larger text')} style={s.sizeBtn}><Text style={{ fontFamily: F.vi, fontSize: 24, color: c.ink }}>A</Text></Pressable>
      </Card>
      <SectionLabel>{t('Giao diện', 'Theme')}</SectionLabel>
      <Seg value={prefs.theme} onChange={(v) => setPrefs({ theme: v })} options={[['auto', t('Theo máy', 'System')], ['light', t('Sáng', 'Light')], ['dark', t('Tối', 'Dark')]]} />
      <SectionLabel>{t('Ngôn ngữ', 'Language')}</SectionLabel>
      <Seg value={prefs.lang} onChange={(v) => setPrefs({ lang: v })} options={[['vi', 'Tiếng Việt'], ['en', 'English']]} />
      <SectionLabel>{t('Hiển thị', 'Display')}</SectionLabel>
      <Card>
        {toggles.map(([k, vi, en], i) => (
          <View key={k} style={[s.tg, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }]}>
            <Text style={{ flex: 1, fontFamily: F.ui, fontSize: 14, color: c.ink }}>{t(vi, en)}</Text>
            <Switch value={!!prefs[k]} onValueChange={(v) => setPrefs({ [k]: v } as Partial<Prefs>)} trackColor={{ true: c.jade, false: c.rule }} accessibilityLabel={t(vi, en)} />
          </View>
        ))}
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  sizeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  sizeBtn: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tg: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: 52, gap: 10 },
});
