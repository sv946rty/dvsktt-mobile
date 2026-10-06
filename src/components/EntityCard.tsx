// Entity card in a bottom sheet: same content and rules as the web card (Overview, In Toàn Thư,
// Relations, Occurrences, Links). Wikipedia is shown only when the enrichment step verified a match.
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { entName, type Book, type Entity, type Relation } from '@/lib/content';
import { useStore } from '@/lib/store';
import { F, REL } from '@/lib/theme';
import { Icon } from './Icon';

export type CardTab = 'ov' | 'tt' | 'rel' | 'occ' | 'lk';
const WIKI_TYPES: Record<string, 1> = { person: 1, place: 1, polity: 1 };
const TYPE_L: Record<string, [string, string]> = {
  person: ['Person', 'Nhân vật'], place: ['Place', 'Địa danh'], polity: ['Polity', 'Quốc hiệu, chính thể'],
  office: ['Office', 'Chức quan'], title: ['Title', 'Tước hiệu, danh hiệu'], reign_era: ['Reign era', 'Niên hiệu'],
};
/** predicate: [en subject→object, en object→subject, vi →, vi ←, colour] */
const PRED: Record<string, [string, string, string, string, string]> = {
  child_of: ['Child of', 'Parent of', 'Con của', 'Cha mẹ của', 'blue'],
  held_office: ['Held office', 'Office held by', 'Giữ chức', 'Người giữ chức', 'green'],
  held_title: ['Held title', 'Title held by', 'Mang tước hiệu', 'Người mang tước', 'green'],
  jurisdiction: ['Jurisdiction over', 'Under jurisdiction of', 'Quản hạt', 'Thuộc quyền', 'slate'],
  controlled_place: ['Controlled', 'Controlled by', 'Kiểm soát', 'Bị kiểm soát bởi', 'amber'],
  killed: ['Killed', 'Killed by', 'Giết', 'Bị giết bởi', 'red'],
  founded_polity: ['Founded', 'Founded by', 'Lập nước', 'Người lập', 'orange'],
  capital_at: ['Capital', 'Capital of', 'Kinh đô', 'Kinh đô của', 'purple'],
};

type Props = {
  book: Book; id: string; hist: string[];
  onGo: (id: string) => void; onBack: () => void; onClose: () => void;
  onOcc: (mention: number) => void; onChar: (c: string) => void;
};

export function EntityCard({ book, id, hist, onGo, onBack, onClose, onOcc, onChar }: Props) {
  const { c, t, prefs } = useStore();
  const [tab, setTab] = useState<CardTab>('ov');
  const [lastId, setLastId] = useState(id);
  if (lastId !== id) { setLastId(id); setTab('ov'); }
  const e = book.entities[id];
  if (!e) return null;
  const en = prefs.lang === 'en';
  const a = e.aliases || {};
  const al = { vi: (a.vi || []).filter((x) => x !== e.names.vi), zh: (a.zh || []).filter((x) => x !== e.names.zh) };
  const tl = TYPE_L[e.type] || [e.type, e.type];
  const occ = book.occ[e.id] || [];
  const o = e.occurrences || { total: 0, zh: 0, vi: 0 };
  const rows = [
    ...(book.out[e.id] || []).map((r) => ({ r, dir: 0 as const, other: r.object })),
    ...(book.inn[e.id] || []).map((r) => ({ r, dir: 1 as const, other: r.subject })),
  ];
  const w = e.external?.wikipedia?.vi;
  const tabs: [CardTab, string][] = [['ov', t('Tổng quan', 'Overview')], ['tt', t('Trong Toàn Thư', 'In Toàn Thư')], ['rel', t('Quan hệ', 'Relations')], ['occ', `${t('Xuất hiện', 'Occurrences')} (${occ.length})`], ['lk', t('Liên kết', 'Links')]];

  const box = (children: ReactNode, tone?: 'tt' | 'wk') => (
    <View style={[s.box, { borderColor: tone === 'tt' ? c.ttB : tone === 'wk' ? c.wkB : c.rule, backgroundColor: tone === 'tt' ? c.tt : tone === 'wk' ? c.wk : c.leaf }]}>{children}</View>
  );
  const H = ({ children, icon }: { children: ReactNode; icon?: string }) => (
    <Text style={[s.bh, { color: c.ink }]}>{icon ? <Text>{icon} </Text> : null}{children}</Text>
  );
  const Body = ({ children, muted }: { children: ReactNode; muted?: boolean }) => <Text style={[s.body, { color: muted ? c.ink2 : c.ink }]}>{children}</Text>;
  const Z = ({ children }: { children: ReactNode }) => <Text style={{ fontFamily: F.zh }}>{children}</Text>;

  const wikiBox = () => {
    if (!w) {
      if (!WIKI_TYPES[e.type]) return null;
      const ws = e.wikipedia_status, st = book.enrichment.status;
      const why = e.review_required
        ? t('Việc xác định thực thể này còn đang được xem xét trong cơ sở dữ liệu, nên chưa liên kết bài ngoài.', 'The identification of this entity is itself under review in our database, so no external article is linked.')
        : st === 'not_run' || ws === 'not_evaluated'
          ? t('Bước làm giàu dữ liệu Wikipedia chưa chạy cho bản này.', 'The Wikipedia enrichment step has not been run for this build.')
          : ws === 'review'
            ? t('Có bài ứng viên nhưng chưa qua hết các bước kiểm tra danh tính (ví dụ có thể là địa danh hiện đại trùng tên). Đang chờ người duyệt.', 'A candidate article did not pass every identity check (for example, it may be a modern place with the same name). It is waiting for human review.')
            : ws === 'no_match'
              ? t('Không tìm thấy bài có tên chữ Hán hoặc bằng chứng lịch sử khớp.', 'No article with matching Chinese-name or historical evidence was found.')
              : t('Không có bài nào qua được quy tắc kiểm chứng.', 'No article passed the verification rules.');
      return box(<><H icon="Ⓦ">Wikipedia (tiếng Việt)</H><Body muted><Text style={{ fontFamily: F.uiB, color: c.ink }}>{t('Chưa liên kết bài Wikipedia.', 'No Wikipedia article linked.')}</Text> {why}</Body></>, 'wk');
    }
    const d = (w.retrieved_at || '').slice(0, 10);
    return box(
      <>
        <H icon="Ⓦ">Wikipedia (tiếng Việt)</H>
        <Body><Text style={{ fontFamily: F.uiB }}>{w.title}</Text>{w.extract && w.extract.startsWith(w.title) ? w.extract.slice(w.title.length) : w.extract ? '. ' + w.extract : ''}</Body>
        <Text style={[s.small, { color: c.ink2 }]}>{t('Nguồn bên ngoài, hiện đại, không thuộc Đại Việt sử ký toàn thư. Văn bản từ Wikipedia (CC BY-SA 4.0)', 'External, modern source, not part of Đại Việt sử ký toàn thư. Text from Wikipedia (CC BY-SA 4.0)')}{w.revision ? `, rev ${w.revision}` : ''}{d ? `, ${d}` : ''}.</Text>
        <Pressable onPress={() => Linking.openURL(w.url)} accessibilityRole="link"><Text style={[s.link, { color: c.eb }]}>{t('Đọc tiếp trên Wikipedia', 'Read more on Wikipedia')} ↗</Text></Pressable>
      </>, 'wk');
  };

  const reviewNotes = () => {
    const out: ReactNode[] = [];
    if (e.review_required) out.push(t('Việc xác định đang được xem xét trong cơ sở dữ liệu thực thể V4 (ví dụ một đối chiếu địa danh lịch sử chưa ngã ngũ).', 'Identification under review in the V4 entity database (for example, a historical place equivalence that is not yet settled).'));
    (e.variants || []).forEach((v) => out.push(`${t('Dạng trong nguồn', 'Source form')} ${v.surface} (${v.lang}): ${v.kind.replace(/_/g, ' ')}, ${v.status}. ${t('Không coi là tên khác.', 'It is not treated as an alias.')}${v.evidence ? ' ' + v.evidence : ''}`));
    (e.review || []).forEach((r) => { if (r.kind !== 'entity_resolution' || !e.review_required) out.push(`Review ${r.review_id}: ${r.reason}`); });
    return out.length ? <View style={[s.note, { backgroundColor: c.paper2 }]}>{out.map((x, i) => <Text key={i} style={[s.small, { color: c.ink }]}>{x}</Text>)}</View> : null;
  };

  const ttBox = (full: boolean) => {
    const zhs = [e.names.zh, ...al.zh].filter(Boolean) as string[], vis = [e.names.vi, ...al.vi].filter(Boolean) as string[];
    return box(
      <>
        <H icon="📙">{t('Trong Đại Việt sử ký toàn thư', 'In Đại Việt sử ký toàn thư')}</H>
        <Body><Text style={{ color: c.ink2 }}>{t('Tên', 'Names')}: </Text>{zhs.length ? <Z>{zhs.join(' · ')}</Z> : null}{zhs.length && vis.length ? ' · ' : ''}{vis.join(' · ')}</Body>
        <Body><Text style={{ color: c.ink2 }}>{t('Loại', 'Type')}: </Text>{en ? tl[0] : tl[1]}</Body>
        <Body><Text style={{ color: c.ink2 }}>{t('Xuất hiện', 'Appears')}: </Text><Text style={{ fontFamily: F.uiB }}>{o.total} {t('lần', o.total === 1 ? 'time' : 'times')}</Text> {t('trong Kỷ nhà Đinh', 'in Kỷ nhà Đinh')} (中文 {o.zh} · Việt {o.vi})</Body>
        {o.total ? <Pressable onPress={() => setTab('occ')}><Text style={[s.link, { color: c.eb }]}>{t('Xem mọi lần xuất hiện →', 'View all occurrences →')}</Text></Pressable> : null}
        {full ? <Body muted>ID: {e.id}</Body> : null}
        {reviewNotes()}
      </>, 'tt');
  };

  const relRow = (x: { r: Relation; dir: 0 | 1; other: string }, full: boolean, k: number) => {
    const p = PRED[x.r.predicate] || [x.r.predicate, x.r.predicate + ' (inverse)', x.r.predicate, x.r.predicate + ' (ngược)', 'slate'];
    const col = REL[p[4]] || REL.slate;
    const tg = book.entities[x.other];
    const ev = x.r.evidence || {};
    return (
      <View key={k} style={[s.rel, { borderColor: c.rule }]}>
        <View style={s.relTop}>
          <Text style={[s.pill, { backgroundColor: c.dark ? col[2] : col[0], color: c.dark ? col[3] : col[1] }]}>{en ? p[x.dir] : p[2 + x.dir]}</Text>
          <Text style={{ color: c.ink2 }}>→</Text>
          <Pressable disabled={!tg} onPress={() => tg && onGo(x.other)} accessibilityRole="button" style={{ flexShrink: 1 }}>
            <Text style={[s.body, { color: tg ? c.eb : c.ink2, marginBottom: 0 }]}>{tg ? entName(tg) : x.other}{tg?.names.zh ? <Text> (<Z>{tg.names.zh}</Z>)</Text> : null}</Text>
          </Pressable>
        </View>
        {full && (ev.zh || ev.vi) ? <Text style={[s.small, { color: c.ink2 }]}>{ev.zh ? <Z>{ev.zh}</Z> : null}{ev.zh && ev.vi ? ' · ' : ''}{ev.vi || ''}{x.r.confidence != null ? ` · ${t('độ tin cậy', 'confidence')} ${x.r.confidence}` : ''}</Text> : null}
      </View>
    );
  };
  const relBox = (full: boolean) => {
    if (!rows.length && !full) return null;
    const lim = full ? rows.length : 6;
    return box(
      <>
        <H>{t('Quan hệ', 'Relations')} <Text style={{ fontFamily: F.ui, color: c.ink2, fontSize: 12 }}>({t('trong văn bản này', 'in this text')})</Text></H>
        {rows.length ? rows.slice(0, lim).map((x, k) => relRow(x, full, k)) : <Body muted>{t('Chưa có quan hệ nào cho thực thể này trong dữ liệu V4.', 'No relations recorded for this entity in the V4 relation data.')}</Body>}
        {!full && rows.length > lim ? <Pressable onPress={() => setTab('rel')}><Text style={[s.link, { color: c.eb }]}>{t('Tất cả', 'All')} {rows.length} →</Text></Pressable> : null}
      </>);
  };

  const occPane = () => !occ.length ? <Body muted>{t('Chưa có lần xuất hiện nào được đặt vào văn bản.', 'No occurrences of this entity were placed in the Reader text.')}</Body> : (
    <>
      <Body muted>{t(`${o.total} lần trong bản đọc này (中文 ${o.zh} · Việt ${o.vi}), đếm từ dữ liệu V4. Mọi tên của thực thể được tính chung.`, `${o.total} occurrences in this Reader (中文 ${o.zh} · Việt ${o.vi}), counted from the V4 mention data. All names of the entity count together.`)}</Body>
      {occ.map((i) => {
        const m = book.mentions[i], z = m.l === 'zh';
        return (
          <Pressable key={i} onPress={() => onOcc(i)} accessibilityRole="button" style={({ pressed }) => [s.occ, { borderColor: c.rule, backgroundColor: pressed ? c.paper2 : c.leaf }]}>
            <Text style={[s.small, { color: c.ink2 }]}>{m.en} · {z ? 'ZH' : 'VI'}{m.tg === 'note' ? ` · ${t('chú thích', 'footnote')} ${(m.n ?? 0) + 1}` : ''}{m.rv ? ` · ${t('đang xem xét', 'under review')}` : ''}</Text>
            <Text style={[s.body, { color: c.ink, marginBottom: 0, fontFamily: z ? F.zh : F.vi }]}>{m.c[0] ? '…' + m.c[0] : ''}<Text style={{ backgroundColor: c.et, fontFamily: z ? F.zh : F.viB }}>{m.t}</Text>{m.c[1] ? m.c[1] + '…' : ''}</Text>
          </Pressable>
        );
      })}
    </>
  );

  const linksPane = () => (
    <View style={{ gap: 10 }}>
      {w ? <Pressable onPress={() => Linking.openURL(w.url)}><Text style={[s.body, { color: c.eb }]}>Wikipedia (tiếng Việt): {w.title} ↗</Text></Pressable> : null}
      {e.external?.wikidata ? <Pressable onPress={() => Linking.openURL(`https://www.wikidata.org/wiki/${e.external!.wikidata}`)}><Text style={[s.body, { color: c.eb }]}>Wikidata: {e.external.wikidata} ↗</Text></Pressable> : null}
      {!w && WIKI_TYPES[e.type] ? <Body muted>{t('Chưa liên kết bài Wikipedia.', 'No Wikipedia article linked.')}</Body> : null}
      <Body muted>ID: {e.id}</Body>
      <Body muted>{t('Danh tính, tên, quan hệ và số lần xuất hiện lấy từ cơ sở dữ liệu thực thể V4 của Toàn Thư (Schema v1). Wikipedia và Wikidata là tham khảo hiện đại bên ngoài.', 'Identity, names, relations and occurrences come from the V4 Toàn Thư entity database (Schema v1). Wikipedia and Wikidata are external modern references.')}</Body>
    </View>
  );

  const prev: Entity | undefined = hist.length ? book.entities[hist[hist.length - 1]] : undefined;
  return (
    <View style={{ flexShrink: 1 }}>
      <View style={[s.head, { borderColor: c.rule }]}>
        <View style={s.top}>
          {prev ? (
            <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={`${t('Quay lại', 'Back to')} ${entName(prev)}`} style={[s.x, { borderColor: c.rule }]}><Icon name="back" size={16} color={c.ink} /></Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[s.name, { color: c.ink }]} accessibilityRole="header">{entName(e)}</Text>
            {e.names.vi && e.names.zh ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from(e.names.zh).map((ch, i) => (
                  <Pressable key={i} onPress={() => onChar(ch)} accessibilityRole="button" accessibilityLabel={`${t('Tra chữ', 'Look up')} ${ch}`} hitSlop={4}>
                    <Text style={{ fontFamily: F.zh, fontSize: 22, color: c.ink2, paddingRight: 2 }}>{ch}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <Text style={[s.pill, { backgroundColor: c.et, color: c.ebInk }]}>{(en ? tl[0] : tl[1]).toUpperCase()}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('Đóng', 'Close')} style={[s.x, { borderColor: c.rule }]}><Icon name="close" size={16} color={c.ink} /></Pressable>
        </View>
        {al.vi.length || al.zh.length ? <Text style={[s.small, { color: c.ink2 }]}>{t('Còn gọi', 'Also known as')}: {[...al.vi, ...al.zh].join(' · ')}</Text> : null}
        {e.review_required ? <Text style={[s.pill, { alignSelf: 'flex-start', marginTop: 6, backgroundColor: c.tt, color: c.seal }]}>{t('Đang xem xét việc xác định', 'Identification under review')}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 4 }}>
          {tabs.map(([k, l]) => (
            <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}
              style={[s.tab, tab === k && { borderBottomColor: c.jade }]}>
              <Text style={{ fontFamily: tab === k ? F.uiB : F.ui, fontSize: 13, color: tab === k ? c.jade : c.ink2 }}>{l}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {tab === 'ov' ? <>{wikiBox()}{ttBox(false)}{relBox(false)}</> : tab === 'tt' ? ttBox(true) : tab === 'rel' ? relBox(true) : tab === 'occ' ? occPane() : linksPane()}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingTop: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontFamily: F.viB, fontSize: 24, lineHeight: 30 },
  x: { width: 36, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  pill: { fontFamily: F.uiB, fontSize: 10.5, letterSpacing: 0.4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden', marginTop: 6 },
  tab: { paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  box: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  bh: { fontFamily: F.uiB, fontSize: 14, marginBottom: 2 },
  body: { fontFamily: F.ui, fontSize: 13.5, lineHeight: 20 },
  small: { fontFamily: F.ui, fontSize: 12, lineHeight: 17 },
  link: { fontFamily: F.uiM, fontSize: 13, paddingVertical: 4 },
  note: { borderRadius: 8, padding: 8, gap: 4, marginTop: 4 },
  rel: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 8, gap: 4 },
  relTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  occ: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 10, gap: 2 },
});
