// Library: continue reading, then the work's tree. Parts without data yet are dimmed.
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Card, SectionLabel } from '@/components/ui';
import { CHAPTERS, DEFAULT_CHAPTER, getChapter, WORK, yearLabel, type NavNode } from '@/lib/content';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';

export default function Library() {
  const { c, t, last, prefs } = useStore();
  const en = prefs.lang === 'en';
  const nm = (s: string) => (en && WORK.en?.[s]) || s;
  const lb = getChapter(last?.chapter || DEFAULT_CHAPTER);
  const lid = last && lb.PI[last.id] != null ? last.id : lb.passages[0].id;
  const lp = lb.passages[lb.PI[lid]];
  const pos = lb.PI[lid] + 1, total = lb.passages.length;
  const open = (slug: string, at?: string) => router.push({ pathname: '/reader/[chapter]', params: at ? { chapter: slug, at } : { chapter: slug } });
  const main = WORK.sections.find((s) => s.items.length);
  const others = WORK.sections.filter((s) => !s.items.length);

  const row = (n: NavNode, i: number) => {
    const has = !!(n.chapter && CHAPTERS[n.chapter]);
    const b = has ? CHAPTERS[n.chapter!] : null;
    return (
      <Pressable key={i} disabled={!has} onPress={() => open(n.chapter!)} accessibilityRole="button" accessibilityState={{ disabled: !has }}
        style={({ pressed }) => [s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }, pressed && { backgroundColor: c.paper2 }]}>
        <Text style={{ flex: 1, fontFamily: F.vi, fontSize: 17, color: has ? c.ink : c.ink2, opacity: has ? 1 : 0.6 }}>
          {nm(n.t)}{b ? <Text style={{ fontFamily: F.zh, color: c.seal }}> {b.title.zh}</Text> : null}
        </Text>
        <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2, opacity: has ? 1 : 0.6 }}>{b ? `${b.passages.length} ${t('đoạn', 'passages')}` : t('sắp có', 'soon')}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <View style={s.brand}>
          <View style={[s.seal, { borderColor: c.seal }]}><Text style={{ fontFamily: F.zh, fontSize: 24, color: c.seal }}>史</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.viB, fontSize: 22, color: c.ink }} accessibilityRole="header">{en ? WORK.title.en : WORK.title.vi}</Text>
            <Text style={{ fontFamily: F.zh, fontSize: 14, color: c.ink2 }}>{WORK.title.zh}</Text>
          </View>
        </View>

        <SectionLabel>{last ? t('Đọc tiếp', 'Continue reading') : t('Bắt đầu đọc', 'Start reading')}</SectionLabel>
        <Pressable onPress={() => open(lb.slug, lid)} accessibilityRole="button">
          <Card style={s.cont}>
            <Text style={{ fontFamily: F.zh, fontSize: 30, color: c.seal }}>{lb.title.zh}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: F.viB, fontSize: 17, color: c.ink }}>{en ? lb.title.en : lb.title.vi}</Text>
              <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2 }}>{yearLabel(lb.YM[lp.year], en)} · {t('đoạn', 'passage')} {lid} · {pos}/{total}</Text>
              <View style={[s.track, { backgroundColor: c.paper2 }]}><View style={{ width: `${(pos / total) * 100}%`, height: '100%', backgroundColor: c.jade, borderRadius: 2 }} /></View>
            </View>
            <Icon name="chevron" size={18} color={c.ink2} />
          </Card>
        </Pressable>

        {main ? <>
          <SectionLabel>{nm(main.t)}</SectionLabel>
          <Card>{main.items.map(row)}</Card>
        </> : null}

        <SectionLabel>{t('Các phần khác', 'Other parts')}</SectionLabel>
        <Card style={[s.row, { opacity: 0.65 }]}>
          <Text style={{ flex: 1, fontFamily: F.vi, fontSize: 15, color: c.ink2 }}>{others.map((x) => nm(x.t)).join(' · ')}</Text>
          <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2 }}>{t('chưa có dữ liệu', 'no data yet')}</Text>
        </Card>

        <Text style={{ fontFamily: F.ui, fontSize: 11.5, color: c.ink2, marginTop: 20, lineHeight: 17 }}>
          {t('Bản thử riêng tư. Bản dịch tiếng Việt chưa xin phép bản quyền; bản tiếng Anh là bản nháp có AI hỗ trợ.', 'Private test build. The Vietnamese translation is not yet licensed; the English is an AI-assisted draft.')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  seal: { width: 44, height: 44, borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cont: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  track: { height: 4, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 50, paddingVertical: 10 },
});
