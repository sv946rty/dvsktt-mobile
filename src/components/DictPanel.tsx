// Dictionary panel for one Chinese character: Hán-Việt reading, gloss, variant, external lookups.
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Book } from '@/lib/content';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';
import { Icon } from './Icon';
import { SectionLabel } from './ui';

export function DictPanel({ book, ch, onBack, onClose }: { book: Book; ch: string; onBack?: () => void; onClose: () => void }) {
  const { c, t } = useStore();
  const hv = book.lexicon.hanviet[ch], gl = book.lexicon.glossary[ch], v = book.lexicon.variants[ch];
  const enc = encodeURIComponent(ch);
  const links: [string, string][] = [
    ['thivien', 'https://hvdic.thivien.net/whv/' + enc],
    ['zdic', 'https://zdic.net/hant/' + enc],
    ['nomfoundation', `https://www.nomfoundation.org/nom-tools/Nom-Lookup-Tool/Nom-Lookup-Tool?input_type=rqn_or_hn&inputText=${enc}&uiLang=en&GO=GO`],
  ];
  return (
    <View style={{ padding: 16, paddingTop: 6 }}>
      <View style={s.row}>
        {onBack ? <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('Quay lại', 'Back')} style={[s.x, { borderColor: c.rule }]}><Icon name="back" size={16} color={c.ink} /></Pressable> : null}
        <View style={[s.big, { borderColor: c.rule, backgroundColor: c.paper }]}><Text style={{ fontFamily: F.zh, fontSize: 52, lineHeight: 64, color: c.ink }}>{ch}</Text></View>
        <View style={{ flex: 1, gap: 4 }}>
          {hv ? <Text style={{ fontFamily: F.viB, fontSize: 24, color: c.ink }}>{hv}</Text>
            : <Text style={{ fontFamily: F.ui, fontSize: 13, color: c.ink2 }}>{t('Chưa có âm Hán-Việt trong từ điển mini', 'No Sino-Vietnamese reading in the mini dictionary')}</Text>}
          {hv ? <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2 }}>{t('Âm Hán-Việt (từ điển mini)', 'Sino-Vietnamese reading (mini dictionary)')}</Text> : null}
          {gl ? <Text style={{ fontFamily: F.ui, fontSize: 13.5, color: c.ink }}>{gl}</Text> : null}
          {v ? <Text style={{ fontFamily: F.ui, fontSize: 13, color: c.ink2 }}>{t('Dị thể của', 'Variant of')} <Text style={{ fontFamily: F.zh }}>{v}</Text></Text> : null}
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('Đóng', 'Close')} style={[s.x, { borderColor: c.rule }]}><Icon name="close" size={16} color={c.ink} /></Pressable>
      </View>
      <SectionLabel>{t('Tra thêm', 'Look up')}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {links.map(([l, h]) => (
          <Pressable key={l} onPress={() => Linking.openURL(h)} accessibilityRole="link" style={[s.chip, { borderColor: c.rule }]}>
            <Text style={{ fontFamily: F.uiM, fontSize: 13, color: c.ink }}>{l} ↗</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2, marginTop: 14, lineHeight: 17 }}>
        {t('Dị thể: chữ gốc trong bản khắc được giữ nguyên; bật "Chuẩn hóa chữ dị thể" để xem dạng chuẩn.', 'Variants: the original woodblock character is kept; turn on "Normalise variant characters" to see the standard form.')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  big: { width: 84, height: 84, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  x: { width: 36, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' },
});
