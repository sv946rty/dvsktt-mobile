// Table of contents for a chapter: grouped by reign and year, current passage highlighted.
import { useEffect, useRef } from 'react';
import { Modal, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Book, Passage } from '@/lib/content';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';
import { IconBtn } from './ui';

export function Contents({ book, open, current, onPick, onClose }: { book: Book; open: boolean; current: string | null; onPick: (id: string) => void; onClose: () => void }) {
  const { c, t, prefs } = useStore();
  const en = prefs.lang === 'en';
  const list = useRef<SectionList<Passage>>(null);
  const sections: { title: string; data: Passage[] }[] = [];
  for (const p of book.passages) {
    const y = book.YM[p.year], r = book.RM[p.reign];
    const title = `${en ? r.en : r.vi} · ${en ? y.enLabel || y.label : y.title}${y.jul ? ' [' + y.jul + ']' : ''}`;
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.data.push(p); else sections.push({ title, data: [p] });
  }
  useEffect(() => {
    if (!open || !current) return;
    const si = sections.findIndex((s) => s.data.some((p) => p.id === current));
    if (si < 0) return;
    const ii = sections[si].data.findIndex((p) => p.id === current);
    const k = setTimeout(() => { try { list.current?.scrollToLocation({ sectionIndex: si, itemIndex: ii, viewPosition: 0.3, animated: false }); } catch { /* not measured yet */ } }, 250);
    return () => clearTimeout(k);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only when opening
  }, [open]);
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={['top', 'bottom']}>
        <View style={[s.head, { borderColor: c.rule }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.viB, fontSize: 22, color: c.ink }} accessibilityRole="header">{t('Mục lục', 'Contents')}</Text>
            <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2 }}>{en ? book.title.en : book.title.vi} · {book.passages.length} {t('đoạn', 'passages')}</Text>
          </View>
          <IconBtn name="close" label={t('Đóng', 'Close')} onPress={onClose} />
        </View>
        <SectionList
          ref={list}
          sections={sections}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          stickySectionHeadersEnabled={false}
          onScrollToIndexFailed={() => {}}
          renderSectionHeader={({ section }) => <Text style={[s.sh, { color: c.ink2 }]}>{section.title}</Text>}
          renderItem={({ item: p }) => {
            const on = p.id === current;
            const txt = en ? p.plain.en : p.plain.vi;
            const comment = p.type === 'comment' || p.type === 'assess';
            return (
              <Pressable onPress={() => onPick(p.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={({ pressed }) => [s.row, { borderColor: on ? c.jade : c.rule, backgroundColor: on ? c.et : pressed ? c.paper2 : c.leaf }]}>
                <Text style={{ flex: 1, fontFamily: F.vi, fontSize: 15, lineHeight: 21, color: c.ink }} numberOfLines={2}>{txt}</Text>
                {comment ? <Text style={{ fontFamily: F.ui, fontSize: 11, color: c.seal }}>{t('Nhận xét', 'Comment')}</Text> : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  sh: { fontFamily: F.uiB, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
});
