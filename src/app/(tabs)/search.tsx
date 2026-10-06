// Search: accent-insensitive Vietnamese/English and Chinese (variant-aware). Entities and passages.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Seg, SectionLabel } from '@/components/ui';
import { CHAPTERS, entName, HAN, norm, yearLabel, type Book, type Entity } from '@/lib/content';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';

type Row =
  | { k: 'h'; key: string; label: string }
  | { k: 'e'; key: string; b: Book; e: Entity; hit: string }
  | { k: 'p'; key: string; b: Book; id: string; text: string; i: number; len: number; zh: boolean };

export default function Search() {
  const { c, t, prefs } = useStore();
  const [q, setQ] = useState('');
  const [f, setF] = useState<'all' | 'text' | 'ent'>('all');
  const en = prefs.lang === 'en';

  const rows = useMemo<Row[]>(() => {
    const qq = q.trim();
    if (!qq) return [];
    const zh = HAN.test(qq);
    const out: Row[] = [];
    for (const b of Object.values(CHAPTERS)) {
      const V = b.lexicon.variants;
      const nz = (s: string) => Array.from(s).map((x) => V[x] || x).join('');
      const nq = zh ? nz(qq) : norm(qq);
      const ents: Row[] = [], ps: Row[] = [];
      if (f !== 'text') for (const e of Object.values(b.entities)) {
        const names = [e.names.vi, e.names.zh, ...(e.aliases?.vi || []), ...(e.aliases?.zh || [])].filter(Boolean) as string[];
        const hit = names.find((n) => (zh ? nz(n) : norm(n)).includes(nq));
        if (hit) ents.push({ k: 'e', key: 'e' + e.id, b, e, hit });
      }
      if (f !== 'ent') for (const p of b.passages) {
        const text = zh ? p.plain.zh : en ? p.plain.en : p.plain.vi;
        const hay = zh ? nz(text) : norm(text);
        const i = hay.indexOf(nq);
        if (i >= 0) ps.push({ k: 'p', key: 'p' + p.id, b, id: p.id, text, i, len: qq.length, zh });
      }
      ents.sort((a, z) => ((z as { e: Entity }).e.occurrences?.total || 0) - ((a as { e: Entity }).e.occurrences?.total || 0));
      if (ents.length) out.push({ k: 'h', key: 'he', label: `${t('Thực thể', 'Entities')} · ${ents.length}` }, ...ents.slice(0, 20));
      if (ps.length) out.push({ k: 'h', key: 'hp', label: `${t('Văn bản', 'Text')} · ${ps.length} ${t('kết quả', 'results')}` }, ...ps.slice(0, 60));
    }
    return out;
  }, [q, f, en, t]);

  const render = ({ item: r }: { item: Row }) => {
    if (r.k === 'h') return <SectionLabel>{r.label}</SectionLabel>;
    if (r.k === 'e') return (
      <Pressable onPress={() => router.push({ pathname: '/reader/[chapter]', params: { chapter: r.b.slug, ent: r.e.id } })} accessibilityRole="button"
        style={({ pressed }) => [s.card, { borderColor: c.rule, backgroundColor: pressed ? c.paper2 : c.leaf }]}>
        <Text style={[s.type, { backgroundColor: c.et, color: c.ebInk }]}>{r.e.type.replace('_', ' ').toUpperCase()}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.viM, fontSize: 16, color: c.ink }}>{entName(r.e)}{r.e.names.zh ? <Text style={{ fontFamily: F.zh }}> {r.e.names.zh}</Text> : null}</Text>
          <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2 }}>{r.e.occurrences?.total || 0} {t('lần trong', 'times in')} {en ? r.b.title.en : r.b.title.vi}{r.hit !== entName(r.e) && r.hit !== r.e.names.zh ? ` · ${r.hit}` : ''}</Text>
        </View>
      </Pressable>
    );
    const p = r.b.passages[r.b.PI[r.id]];
    const a = Math.max(0, r.i - 30), z = Math.min(r.text.length, r.i + r.len + 60);
    return (
      <Pressable onPress={() => router.push({ pathname: '/reader/[chapter]', params: { chapter: r.b.slug, at: r.id } })} accessibilityRole="button"
        style={({ pressed }) => [s.card, { flexDirection: 'column', alignItems: 'stretch', borderColor: c.rule, backgroundColor: pressed ? c.paper2 : c.leaf }]}>
        <Text style={{ fontFamily: F.ui, fontSize: 11.5, color: c.ink2 }}>{en ? r.b.RM[p.reign].en : r.b.RM[p.reign].vi} · {yearLabel(r.b.YM[p.year], en)} · {r.id}</Text>
        <Text style={{ fontFamily: r.zh ? F.zh : F.vi, fontSize: 15, lineHeight: 22, color: c.ink }}>
          {a > 0 ? '…' : ''}{r.text.slice(a, r.i)}<Text style={{ backgroundColor: c.lit }}>{r.text.slice(r.i, r.i + r.len)}</Text>{r.text.slice(r.i + r.len, z)}{z < r.text.length ? '…' : ''}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={['top']}>
      <View style={{ padding: 16, paddingBottom: 4, gap: 10, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <View style={[s.box, { borderColor: c.jade, backgroundColor: c.leaf }]}>
          <Icon name="search" size={18} color={c.ink2} />
          <TextInput value={q} onChangeText={setQ} placeholder={t('Tìm tên, chữ Hán, từ… (không cần dấu)', 'Search names, Chinese, words…')} placeholderTextColor={c.ink2}
            style={{ flex: 1, fontFamily: F.ui, fontSize: 16, color: c.ink, paddingVertical: 10 }} autoCorrect={false} autoCapitalize="none" returnKeyType="search" accessibilityLabel={t('Tìm', 'Search')} />
          {q ? <Pressable onPress={() => setQ('')} accessibilityLabel={t('Xóa', 'Clear')} hitSlop={10}><Icon name="close" size={16} color={c.ink2} /></Pressable> : null}
        </View>
        <Seg value={f} onChange={setF} options={[['all', t('Tất cả', 'All')], ['text', t('Văn bản', 'Text')], ['ent', t('Nhân vật · Địa danh', 'People · Places')]]} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={render}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' }}
        ListEmptyComponent={<Text style={{ fontFamily: F.ui, fontSize: 14, color: c.ink2, marginTop: 24, textAlign: 'center' }}>
          {q.trim() ? t('Không có kết quả.', 'No results.') : t('Ví dụ: su quan, Hoa Lư, 丁部領', 'For example: su quan, Hoa Lư, 丁部領')}</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  type: { fontFamily: F.uiB, fontSize: 10, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, overflow: 'hidden' },
});
