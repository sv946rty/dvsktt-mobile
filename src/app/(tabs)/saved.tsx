// Saved passages and the user's correction notes (on this device until accounts exist).
import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { SectionLabel } from '@/components/ui';
import { CHAPTERS, yearLabel } from '@/lib/content';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';

export default function Saved() {
  const { c, t, prefs, saved, notes, removeNote } = useStore();
  const en = prefs.lang === 'en';
  const open = (chapter: string, at: string) => router.push({ pathname: '/reader/[chapter]', params: { chapter, at } });
  const del = (id: string) => {
    if (Platform.OS === 'web') { removeNote(id); return; }
    Alert.alert(t('Xóa góp ý này?', 'Delete this note?'), undefined, [
      { text: t('Hủy', 'Cancel'), style: 'cancel' },
      { text: t('Xóa', 'Delete'), style: 'destructive', onPress: () => removeNote(id) },
    ]);
  };
  const items = saved.filter((x) => CHAPTERS[x.chapter]?.PI[x.id] != null);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <Text style={{ fontFamily: F.viB, fontSize: 26, color: c.ink, marginTop: 8 }} accessibilityRole="header">{t('Đã lưu', 'Saved')}</Text>
        <SectionLabel>{t('Đoạn đã lưu', 'Saved passages')} · {items.length}</SectionLabel>
        {items.length ? items.map((x) => {
          const b = CHAPTERS[x.chapter], p = b.passages[b.PI[x.id]];
          return (
            <Pressable key={x.chapter + x.id} onPress={() => open(x.chapter, x.id)} accessibilityRole="button" style={({ pressed }) => [s.card, { borderColor: c.rule, backgroundColor: pressed ? c.paper2 : c.leaf }]}>
              <Text style={{ fontFamily: F.ui, fontSize: 11.5, color: c.ink2 }}>{yearLabel(b.YM[p.year], en)} · {p.id}</Text>
              {p.plain.zh ? <Text style={{ fontFamily: F.zh, fontSize: 16, color: c.ink }} numberOfLines={1}>{p.plain.zh}</Text> : null}
              <Text style={{ fontFamily: F.vi, fontSize: 15, color: c.ink }} numberOfLines={2}>{en ? p.plain.en : p.plain.vi}</Text>
            </Pressable>
          );
        }) : <Text style={[s.empty, { color: c.ink2 }]}>{t('Nhấn giữ một đoạn khi đọc (hoặc nút ⋯) để lưu.', 'Long-press a passage while reading (or use ⋯) to save it.')}</Text>}

        <SectionLabel>{t('Góp ý sửa của bạn', 'Your correction notes')} · {notes.length}</SectionLabel>
        {notes.length ? notes.map((n) => (
          <View key={n.id} style={[s.card, { borderColor: c.rule, backgroundColor: c.leaf, flexDirection: 'row', alignItems: 'flex-start' }]}>
            <Pressable style={{ flex: 1, gap: 2 }} onPress={() => open(n.chapter, n.entry)} accessibilityRole="button">
              <Text style={{ fontFamily: F.viB, fontSize: 16, color: c.ink }}>{n.title}</Text>
              {n.body ? <Text style={{ fontFamily: F.ui, fontSize: 13, color: c.ink }} numberOfLines={3}>{n.body}</Text> : null}
              <Text style={{ fontFamily: F.ui, fontSize: 11.5, color: c.ink2 }}>{n.entry} · {new Date(n.ts).toLocaleDateString(en ? 'en-GB' : 'vi-VN')} · {t('chỉ lưu trên máy này', 'only on this device')}</Text>
            </Pressable>
            <Pressable onPress={() => del(n.id)} accessibilityRole="button" accessibilityLabel={t('Xóa góp ý', 'Delete note')} style={s.del}><Icon name="trash" size={18} color={c.ink2} /></Pressable>
          </View>
        )) : <Text style={[s.empty, { color: c.ink2 }]}>{t('Chưa có góp ý. Dùng "Góp ý sửa" trong thao tác của đoạn.', 'No notes yet. Use "Suggest a correction" in a passage\'s actions.')}</Text>}
        <Text style={[s.empty, { color: c.ink2, marginTop: 18 }]}>{t('Khi có tài khoản (giai đoạn 2), các mục này sẽ đồng bộ với bản web.', 'Once accounts exist (phase 2), these will sync with the website.')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4, marginBottom: 8 },
  empty: { fontFamily: F.ui, fontSize: 13, lineHeight: 19 },
  del: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
