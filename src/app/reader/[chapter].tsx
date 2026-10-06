// The reader: Chinese above the translation, passage by passage, with a floating dock for layout and
// language. Tap a name for its card, other text to light up the clause pair, a Chinese character in
// the lit clause for the dictionary, a footnote number for the note; long-press for passage actions.
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type NativeScrollEvent, type NativeSyntheticEvent, type ViewToken,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Contents } from '@/components/Contents';
import { DictPanel } from '@/components/DictPanel';
import { EntityCard } from '@/components/EntityCard';
import { Icon, type IconName } from '@/components/Icon';
import { PassageView, SegText, type Tap } from '@/components/PassageView';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Sheet } from '@/components/Sheet';
import { IconBtn, Seg } from '@/components/ui';
import { CHAPTERS, getChapter, HAN, isText, yearLabel, type Book, type Passage } from '@/lib/content';
import { useStore } from '@/lib/store';
import { F, SIZES } from '@/lib/theme';

type Item =
  | { key: string; k: 'R'; reign: string }
  | { key: string; k: 'Y'; year: string }
  | { key: string; k: 'P'; p: Passage };
type SheetState =
  | { k: 'card'; id: string; hist: string[] }
  | { k: 'dict'; ch: string; back?: { id: string; hist: string[] } }
  | { k: 'fn'; pid: string; n: number }
  | { k: 'act'; pid: string; par?: boolean }
  | { k: 'note'; pid: string }
  | { k: 'aa' };

const DOCK_H = 64;

/** Static web export: one page per chapter. */
export function generateStaticParams() {
  return Object.keys(CHAPTERS).map((chapter) => ({ chapter }));
}

function buildItems(b: Book) {
  const items: Item[] = [];
  let lr = '', ly = '';
  for (const p of b.passages) {
    if (p.reign !== lr) { items.push({ key: 'R-' + p.reign, k: 'R', reign: p.reign }); lr = p.reign; ly = ''; }
    if (p.year !== ly) { if (b.YM[p.year].gz) items.push({ key: 'Y-' + p.year, k: 'Y', year: p.year }); ly = p.year; }
    items.push({ key: p.id, k: 'P', p });
  }
  return items;
}

/** The Chinese and translated text of one clause group, for the pair bar. */
function pairText(p: Passage, g: number, en: boolean) {
  const z = (p.zh || []).filter((t) => t.g === g).map((t) => t.c).join('');
  const v = (en ? p.en : p.vi).filter(isText).filter((s) => s.g === g).map((s) => s.t).join('').trim();
  return { z, v };
}

export default function Reader() {
  const params = useLocalSearchParams<{ chapter: string; at?: string; ent?: string }>();
  const book = getChapter(params.chapter);
  const { c, t, prefs, setPrefs, isSaved, toggleSaved, addNote, setLast, last, saved } = useStore();
  const ins = useSafeAreaInsets();
  const en = prefs.lang === 'en';
  const items = useMemo(() => buildItems(book), [book]);
  const index = useMemo(() => Object.fromEntries(items.map((it, i) => [it.key, i])), [items]);

  const [sel, setSel] = useState<{ pid: string; g: number } | null>(null);
  const [sheet, setSheet] = useState<SheetState | null>(() => (params.ent && book.entities[params.ent] ? { k: 'card', id: params.ent, hist: [] } : null));
  const [toc, setToc] = useState(false);
  const [cur, setCur] = useState<string>(params.at && book.PI[params.at] != null ? params.at : last?.chapter === book.slug ? last.id : book.passages[0].id);
  const [flash, setFlash] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const list = useRef<FlatList<Item>>(null);
  const chips = useRef<ScrollView>(null);
  const chipX = useRef<Record<string, number>>({});

  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast((x) => (x === m ? null : x)), 1800); }, []);

  // ------------------------------------------------------------ scrolling
  const [dock] = useState(() => new Animated.Value(0));
  const lastY = useRef(0), hidden = useRef(false), jumpUntil = useRef(0);
  const showDock = useCallback(() => {
    if (!hidden.current) return;
    hidden.current = false;
    Animated.timing(dock, { toValue: 0, duration: 180, useNativeDriver: true }).start();
  }, [dock]);
  const scrollTo = useCallback((key: string, animated = true) => {
    const i = index[key];
    if (i == null) return;
    jumpUntil.current = Date.now() + 1200; // programmatic scrolls do not hide the dock
    list.current?.scrollToIndex({ index: i, animated, viewPosition: 0 });
    // items between here and there may only now be rendered and measured: settle on the target
    for (const ms of [350, 800]) setTimeout(() => list.current?.scrollToIndex({ index: i, animated: false, viewPosition: 0 }), ms);
  }, [index]);
  const goPassage = useCallback((pid: string, doFlash = true) => {
    const p = book.passages[book.PI[pid]];
    if (!p) return;
    showDock();
    // land on the reign banner or year header when jumping to the first passage under it
    const firstR = book.passages.find((x) => x.reign === p.reign)?.id === pid;
    const firstY = book.passages.find((x) => x.year === p.year)?.id === pid && index['Y-' + p.year] != null;
    scrollTo(firstR ? 'R-' + p.reign : firstY ? 'Y-' + p.year : pid);
    if (doFlash) { setFlash(pid); setTimeout(() => setFlash((f) => (f === pid ? null : f)), 1400); }
  }, [book, index, scrollTo, showDock]);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const target = cur;
    if (target !== book.passages[0].id) setTimeout(() => goPassage(target, !!params.at), 200);
  }, [book, cur, goPassage, params.at]);

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken<Item>[] }) => {
    const first = viewableItems.find((v) => v.item.k === 'P' && v.isViewable);
    if (first && first.item.k === 'P') setCur(first.item.p.id);
  }, []);
  useEffect(() => { setLast(book.slug, cur); }, [book.slug, cur, setLast]);
  const curP = book.passages[book.PI[cur]] || book.passages[0];
  const curY = book.YM[curP.year];
  useEffect(() => {
    const x = chipX.current[curP.year];
    if (x != null) chips.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, [curP.year]);

  // dock hides while scrolling down, returns on scroll up
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y, dy = y - lastY.current;
    lastY.current = y;
    if (Date.now() < jumpUntil.current) return;
    const hide = dy > 6 && y > 80 ? true : dy < -6 || y < 40 ? false : hidden.current;
    if (hide !== hidden.current) {
      hidden.current = hide;
      Animated.timing(dock, { toValue: hide ? 1 : 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [dock]);

  // ------------------------------------------------------------ taps
  const tapRef = useRef<(x: Tap) => void>(() => {});
  const handleTap = (x: Tap) => {
    const p = book.passages[book.PI[x.pid]];
    if (x.k === 'ent') { const m = book.mentions[x.m]; if (m) setSheet({ k: 'card', id: m.e, hist: [] }); return; }
    if (x.k === 'fn') { setSheet({ k: 'fn', pid: x.pid, n: x.n }); return; }
    let g: number | null;
    if (x.k === 'char') {
      const tok = p.zh![x.i];
      const lit = sel?.pid === x.pid && sel.g === tok.g;
      if (HAN.test(tok.c) && (!prefs.al || tok.g == null || lit)) { setSheet({ k: 'dict', ch: prefs.norm && tok.v ? tok.v : tok.c }); return; }
      g = tok.g ?? null;
    } else g = x.g;
    if (!prefs.al || g == null || (sel?.pid === x.pid && sel.g === g)) setSel(null);
    else setSel({ pid: x.pid, g });
  };
  useLayoutEffect(() => { tapRef.current = handleTap; });
  const onTap = useCallback((x: Tap) => tapRef.current(x), []);
  const onLong = useCallback((pid: string) => setSheet({ k: 'act', pid }), []);

  // ------------------------------------------------------------ passage actions
  const link = (pid: string) => Linking.createURL(`/reader/${book.slug}`, { queryParams: { at: pid } });
  const citation = (pid: string) => {
    const p = book.passages[book.PI[pid]], y = book.YM[p.year], r = book.RM[p.reign], d = new Date().toLocaleDateString('vi-VN');
    return `Ngô Sĩ Liên và các sử thần, Đại Việt sử ký toàn thư, Bản kỷ, quyển 1, ${book.title.vi}, ${r.vi}, ${y.title}${y.jul ? ' [' + y.jul + ']' : ''}, tờ ${p.folio}. Bản dịch tiếng Việt: tr. ${p.pp}. Dữ liệu thử riêng tư. ${link(pid)} (truy cập ${d}).`;
  };
  const copy = async (s: string, msg: string) => { try { await Clipboard.setStringAsync(s); say(msg); } catch { say(t('Không chép được', 'Could not copy')); } };
  const entryLabel = (pid: string) => { const p = book.passages[book.PI[pid]]; return `${yearLabel(book.YM[p.year], en)} · ${t('đoạn', 'passage')} ${pid}`; };

  // ------------------------------------------------------------ render
  const size = SIZES[prefs.size] ?? 1;
  const renderItem = useCallback(({ item }: { item: Item }) => {
    if (item.k === 'R') {
      const r = book.RM[item.reign];
      return (
        <View style={[st.rb, { borderColor: c.rule }]}>
          <Text style={{ fontFamily: F.zh, fontSize: 22, color: c.seal }}>{r.zh}</Text>
          <Text style={{ fontFamily: F.viB, fontSize: 20, color: c.ink }}>{en ? r.en : r.vi}</Text>
          <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2 }}>{en ? r.enSub : r.sub}</Text>
        </View>
      );
    }
    if (item.k === 'Y') {
      const y = book.YM[item.year];
      return (
        <View style={[st.yh, { borderColor: c.seal }]} accessibilityRole="header">
          <Text style={{ fontFamily: F.zh, fontSize: 18, color: c.seal }}>{y.gz}</Text>
          <Text style={{ fontFamily: F.viB, fontSize: 19, color: c.ink }}>{en ? y.enLabel || y.title : y.title}</Text>
          {y.jul ? <Text style={{ fontFamily: F.ui, fontSize: 13, color: c.ink2 }}>[{y.jul}]</Text> : null}
          <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2, flexBasis: '100%' }}>{en ? y.enSub || y.sub : y.sub}</Text>
        </View>
      );
    }
    const p = item.p;
    return (
      <PassageView p={p} c={c} prefs={prefs} sel={sel?.pid === p.id ? sel.g : null} saved={isSaved(book.slug, p.id)} flash={flash === p.id}
        onTap={onTap} onLong={onLong} hv={book.lexicon.hanviet} />
    );
  }, [book, c, en, prefs, sel, isSaved, flash, onTap, onLong]);

  const pair = sel && prefs.al ? pairText(book.passages[book.PI[sel.pid]], sel.g, en) : null;
  const dockY = useMemo(() => dock.interpolate({ inputRange: [0, 1], outputRange: [0, DOCK_H + 30 + ins.bottom] }), [dock, ins.bottom]);
  const reign = book.RM[curP.reign];

  const sheetBody = () => {
    if (!sheet) return null;
    if (sheet.k === 'card') return (
      <EntityCard book={book} id={sheet.id} hist={sheet.hist}
        onGo={(id) => setSheet({ k: 'card', id, hist: [...sheet.hist, sheet.id] })}
        onBack={() => setSheet({ k: 'card', id: sheet.hist[sheet.hist.length - 1], hist: sheet.hist.slice(0, -1) })}
        onClose={() => setSheet(null)}
        onChar={(ch) => setSheet({ k: 'dict', ch, back: { id: sheet.id, hist: sheet.hist } })}
        onOcc={(i) => {
          const m = book.mentions[i];
          setSheet(m.tg === 'note' && m.n != null ? { k: 'fn', pid: m.en, n: m.n + 1 } : null);
          if (m.l === 'vi' && prefs.mode === 'zh') setPrefs({ mode: 'both' });
          if (m.l === 'zh' && prefs.mode === 'tr') setPrefs({ mode: 'both' });
          if (m.l === 'vi' && en) setPrefs({ lang: 'vi' });
          setTimeout(() => goPassage(m.en), 250);
        }} />
    );
    if (sheet.k === 'dict') return (
      <DictPanel book={book} ch={sheet.ch} onClose={() => setSheet(null)}
        onBack={sheet.back ? () => setSheet({ k: 'card', ...sheet.back! }) : undefined} />
    );
    if (sheet.k === 'fn') {
      const p = book.passages[book.PI[sheet.pid]];
      const segs = p.notes[sheet.n - 1] || [];
      return (
        <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6, gap: 8 }}>
          <View style={st.sheetHead}>
            <Text style={[st.sheetTitle, { color: c.ink }]}>{t('Chú thích', 'Note')} {sheet.n}</Text>
            <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2 }}>{entryLabel(p.id)}</Text>
          </View>
          <SegText segs={segs} c={c} size={Math.min(size, 1.12)} sel={null} prefs={prefs} pid={p.id} onTap={onTap} style={{ fontSize: 16 * Math.min(size, 1.12), lineHeight: 24 * Math.min(size, 1.12) }} />
        </ScrollView>
      );
    }
    if (sheet.k === 'aa') return <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4 }}><SettingsPanel compact /></ScrollView>;
    if (sheet.k === 'note') return <NoteForm label={entryLabel(sheet.pid)} onCancel={() => setSheet(null)} onSave={(title, body) => {
      addNote({ chapter: book.slug, entry: sheet.pid, title, body }); setSheet(null); say(t('Đã lưu góp ý trên máy này', 'Note saved on this device'));
    }} />;
    // passage actions
    const p = book.passages[book.PI[sheet.pid]];
    const on = isSaved(book.slug, p.id);
    const Row = ({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) => (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.act, { borderColor: c.rule, backgroundColor: pressed ? c.paper2 : 'transparent' }]}>
        <Icon name={icon} size={20} color={c.jade} /><Text style={{ fontFamily: F.uiM, fontSize: 15, color: c.ink }}>{label}</Text>
      </Pressable>
    );
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={st.sheetHead}>
          <Text style={[st.sheetTitle, { color: c.ink }]}>{entryLabel(p.id)}</Text>
          <Text style={{ fontFamily: F.vi, fontSize: 14, color: c.ink2 }} numberOfLines={2}>{en ? p.plain.en : p.plain.vi}</Text>
        </View>
        <Row icon={on ? 'starFill' : 'star'} label={on ? t('Bỏ lưu đoạn này', 'Remove from saved') : t('Lưu đoạn này', 'Save this passage')}
          onPress={() => { const now = toggleSaved(book.slug, p.id); setSheet(null); say(now ? t('Đã lưu', 'Saved') : t('Đã bỏ lưu', 'Removed')); }} />
        <Row icon="quote" label={t('Chép trích dẫn', 'Copy citation')} onPress={() => { setSheet(null); void copy(citation(p.id), t('Đã chép trích dẫn', 'Citation copied')); }} />
        <Row icon="link" label={t('Chép liên kết', 'Copy link')} onPress={() => { setSheet(null); void copy(link(p.id), t('Đã chép liên kết', 'Link copied')); }} />
        {p.par ? <Row icon="swap" label={t('Nguồn song song', 'Parallel sources')} onPress={() => setSheet({ k: 'act', pid: p.id, par: !sheet.par })} /> : null}
        {sheet.par && p.par ? p.par.map((x, i) => (
          <View key={i} style={[st.par, { backgroundColor: c.paper2 }]}>
            <Text style={{ fontFamily: F.uiB, fontSize: 13, color: c.ink }}>{x.t}</Text>
            <Text style={{ fontFamily: F.ui, fontSize: 13, color: c.ink2, lineHeight: 19 }}>{x.d}</Text>
          </View>
        )) : null}
        <Row icon="chat" label={t('Góp ý sửa', 'Suggest a correction')} onPress={() => setSheet({ k: 'note', pid: p.id })} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={['top']}>
      {/* top bar: navigation only */}
      <View style={[st.bar, { borderColor: c.rule }]}>
        <IconBtn name="back" label={t('Thư viện', 'Library')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: F.zh, fontSize: 16, color: c.ink }} numberOfLines={1}>{book.title.zh} · {reign.zh}</Text>
          <Text style={{ fontFamily: F.ui, fontSize: 11.5, color: c.ink2 }} numberOfLines={1}>{en ? book.title.en : book.title.vi} · {en ? reign.en : reign.vi}{curY.title === reign.vi ? '' : ' · ' + yearLabel(curY, en)}</Text>
        </View>
        <IconBtn name="list" label={t('Mục lục', 'Contents')} onPress={() => setToc(true)} />
        <IconBtn name="textSize" label={t('Cỡ chữ và hiển thị', 'Text and display')} onPress={() => setSheet({ k: 'aa' })} />
      </View>
      <View style={[st.chips, { borderColor: c.rule }]}>
      <ScrollView ref={chips} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12, alignItems: 'center', height: 50 }}>
        {book.years.map((y) => {
          const on = y.id === curP.year;
          const first = book.passages.find((p) => p.year === y.id);
          if (!first) return null;
          return (
            <Pressable key={y.id} onLayout={(e) => (chipX.current[y.id] = e.nativeEvent.layout.x)} onPress={() => goPassage(first.id, false)}
              accessibilityRole="button" accessibilityState={{ selected: on }}
              style={[st.chip, { borderColor: on ? c.jade : c.rule, backgroundColor: on ? c.jade : c.leaf }]}>
              <Text style={{ fontFamily: F.uiM, fontSize: 12.5, color: on ? c.jadeInk : c.ink }}>{en ? y.enLabel || y.label : y.label}{y.jul ? <Text style={{ fontSize: 10.5 }}> {y.jul}</Text> : null}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      </View>

      <FlatList
        ref={list}
        data={items}
        keyExtractor={(it) => it.key}
        renderItem={renderItem}
        extraData={[sel, prefs, flash, saved, c]}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 30 }}
        initialNumToRender={6}
        windowSize={9}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onScrollToIndexFailed={(info) => {
          list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          setTimeout(() => list.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 }), 120);
        }}
        ListFooterComponent={<View style={{ height: DOCK_H + 48 + ins.bottom + (pair ? 90 : 0) }} />}
      />

      {/* pair bar + dock */}
      <Animated.View style={[st.dockWrap, { bottom: ins.bottom + 10, transform: [{ translateY: dockY }] }]} pointerEvents="box-none">
        {pair ? (
          <Pressable onPress={() => setSel(null)} accessibilityRole="button" accessibilityHint={t('Bỏ chọn câu', 'Clear the clause')}
            style={[st.pair, { backgroundColor: c.leaf, borderColor: c.rule }]}>
            <Text style={{ fontFamily: F.ui, fontSize: 11, color: c.ink2 }}>{t('Câu đang chọn · chạm lần nữa vào chữ Hán để tra chữ', 'Selected clause · tap a Chinese character again to look it up')}</Text>
            {pair.z ? <Text style={{ fontFamily: F.zh, fontSize: 17, color: c.ink }} numberOfLines={2}>{pair.z}</Text> : null}
            {pair.v ? <Text style={{ fontFamily: F.vi, fontSize: 15, color: c.ink }} numberOfLines={2}>{pair.v}</Text> : null}
          </Pressable>
        ) : null}
        <View style={[st.dock, { backgroundColor: c.leaf, borderColor: c.rule }]}>
          <View style={{ flex: 1 }}><Seg value={prefs.mode} onChange={(m) => { setSel(null); setPrefs({ mode: m }); }} options={[['both', t('Cả hai', 'Both')], ['zh', '中文'], ['tr', t('Việt', 'EN')]]} /></View>
          <View style={{ width: 96 }}><Seg value={prefs.lang} onChange={(l) => { setSel(null); setPrefs({ lang: l }); }} options={[['vi', 'VI'], ['en', 'EN']]} /></View>
          <Pressable onPress={() => setSheet({ k: 'act', pid: cur })} accessibilityRole="button" accessibilityLabel={t('Thao tác cho đoạn đang đọc', 'Actions for this passage')} style={st.more}>
            <Icon name="more" size={22} color={c.ink} />
          </Pressable>
        </View>
      </Animated.View>

      {toast ? <View style={[st.toast, { bottom: ins.bottom + DOCK_H + 30, backgroundColor: c.ink }]} pointerEvents="none"><Text style={{ fontFamily: F.uiM, color: c.paper, fontSize: 13 }}>{toast}</Text></View> : null}

      <Sheet open={!!sheet} onClose={() => setSheet(null)} tall={sheet?.k === 'card'} label={sheet?.k}>{sheetBody()}</Sheet>
      <Contents book={book} open={toc} current={cur} onClose={() => setToc(false)} onPick={(id) => { setToc(false); setTimeout(() => goPassage(id), 150); }} />
    </SafeAreaView>
  );
}

function NoteForm({ label, onSave, onCancel }: { label: string; onSave: (title: string, body: string) => void; onCancel: () => void }) {
  const { c, t } = useStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const input = [st.input, { borderColor: c.rule, color: c.ink, backgroundColor: c.paper }];
  return (
    <View style={{ padding: 16, paddingTop: 4, gap: 10 }}>
      <View style={st.sheetHead}>
        <Text style={[st.sheetTitle, { color: c.ink }]}>{t('Góp ý sửa', 'Suggest a correction')}</Text>
        <Text style={{ fontFamily: F.ui, fontSize: 12, color: c.ink2 }}>{label} · {t('lưu trên máy này cho đến khi có tài khoản', 'kept on this device until accounts exist')}</Text>
      </View>
      <TextInput value={title} onChangeText={setTitle} placeholder={t('Tiêu đề, ví dụ: chữ 也 có thể là 野?', 'Title, e.g. should 也 be 野?')} placeholderTextColor={c.ink2} style={input} />
      <TextInput value={body} onChangeText={setBody} placeholder={t('Nội dung, nguồn đối chiếu…', 'Details, sources…')} placeholderTextColor={c.ink2} multiline style={[input, { minHeight: 100, textAlignVertical: 'top' }]} />
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
        <Pressable onPress={onCancel} style={[st.btn, { borderColor: c.rule }]} accessibilityRole="button"><Text style={{ fontFamily: F.uiM, color: c.ink }}>{t('Hủy', 'Cancel')}</Text></Pressable>
        <Pressable onPress={() => title.trim() && onSave(title.trim(), body.trim())} disabled={!title.trim()} accessibilityRole="button"
          style={[st.btn, { backgroundColor: c.jade, borderColor: c.jade, opacity: title.trim() ? 1 : 0.5 }]}><Text style={{ fontFamily: F.uiB, color: c.jadeInk }}>{t('Lưu', 'Save')}</Text></Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  chips: { height: 51, borderBottomWidth: StyleSheet.hairlineWidth },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, height: 34, justifyContent: 'center' },
  rb: { alignItems: 'center', paddingTop: 22, paddingBottom: 10, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  yh: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8, marginHorizontal: 18, marginTop: 18, paddingBottom: 6, borderBottomWidth: 1.5 },
  dockWrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center', gap: 8 },
  dock: { alignSelf: 'stretch', maxWidth: 520, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, height: DOCK_H, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  more: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pair: { alignSelf: 'stretch', maxWidth: 640, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 12, gap: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  toast: { position: 'absolute', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  sheetHead: { gap: 2, marginBottom: 6, paddingTop: 4 },
  sheetTitle: { fontFamily: F.viB, fontSize: 19 },
  act: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
  par: { borderRadius: 10, padding: 10, gap: 4, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: F.ui, fontSize: 15 },
  btn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center' },
});
