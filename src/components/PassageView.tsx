// One passage: Chinese above the translation. Rendered from the precomputed model, so clause
// groups (g) and entity mentions (m) are the same as on the website.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isText, type Passage, type Seg } from '@/lib/content';
import type { Prefs } from '@/lib/store';
import { F, SIZES, type Colors } from '@/lib/theme';

export type Tap =
  | { k: 'ent'; pid: string; m: number }
  | { k: 'clause'; pid: string; g: number | null }
  | { k: 'char'; pid: string; i: number }
  | { k: 'fn'; pid: string; n: number };

type Props = {
  p: Passage; c: Colors; prefs: Prefs; sel: number | null; saved: boolean; flash: boolean;
  onTap: (t: Tap) => void; onLong: (pid: string) => void;
  hv: Record<string, string>;
};

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n: number) => String(n).split('').map((d) => SUP[+d]).join('');

export function SegText({ segs, c, size, sel, prefs, onTap, pid, onLong, style }: {
  segs: Seg[]; c: Colors; size: number; sel: number | null; prefs: Pick<Prefs, 'hideEd' | 'hideOn' | 'al'>;
  onTap: (t: Tap) => void; pid: string; onLong?: () => void; style?: object;
}) {
  return (
    <Text style={[{ fontFamily: F.vi, fontSize: 17 * size, lineHeight: 27 * size, color: c.ink }, style]} onLongPress={onLong}>
      {segs.map((s, i) => {
        if ('fo' in s) return <Text key={i} style={{ fontFamily: F.ui, fontSize: 10 * size, color: c.ink2 }}>{` tờ ${s.fo} `}</Text>;
        if ('fr' in s) return (
          <Text key={i} onPress={() => onTap({ k: 'fn', pid, n: s.fr })} accessibilityRole="button" accessibilityLabel={`Chú thích ${s.fr}`}
            style={{ fontFamily: F.uiB, color: c.jade, fontSize: 15 * size }}>{sup(s.fr)}</Text>
        );
        if (!isText(s)) return null;
        if ((s.s === 'ed' && prefs.hideEd) || (s.s === 'on' && prefs.hideOn)) return null;
        const lit = prefs.al && sel != null && s.g === sel;
        const ent = s.m != null;
        return (
          <Text
            key={i}
            onPress={() => onTap(ent ? { k: 'ent', pid, m: s.m! } : { k: 'clause', pid, g: s.g ?? null })}
            style={[
              s.s === 'ed' && { color: c.ink2 },
              s.s === 'on' && { color: c.ink2, fontSize: 14.5 * size },
              lit && { backgroundColor: c.lit },
              ent && { textDecorationLine: 'underline', textDecorationColor: c.eu, color: c.dark ? c.ebInk : c.ink },
            ]}
          >{s.t}</Text>
        );
      })}
    </Text>
  );
}

function PassageViewImpl({ p, c, prefs, sel, saved, flash, onTap, onLong, hv }: Props) {
  const size = SIZES[prefs.size] ?? 1;
  const segs = prefs.lang === 'en' ? p.en : p.vi;
  const showZh = prefs.mode !== 'tr';
  const showTr = prefs.mode !== 'zh';
  const long = () => onLong(p.id);
  const comment = p.type === 'comment' || p.type === 'assess';

  const zh = !p.zh ? (
    showZh ? <Text style={{ fontFamily: F.ui, fontSize: 13, color: c.ink2, fontStyle: 'italic' }}>{prefs.lang === 'en' ? 'No Chinese text for this passage yet' : 'Chưa có nguyên văn Hán cho đoạn này'}</Text> : null
  ) : !showZh ? null : prefs.ruby ? (
    <View style={st.grid} accessibilityLanguage="zh-Hant">
      {p.zh.map((t, i) => {
        if (t.o && prefs.hideOn) return null;
        const lit = prefs.al && sel != null && t.g === sel;
        const ch = prefs.norm && t.v ? t.v : t.c;
        const r = t.h || hv[t.c];
        return (
          <Pressable key={i} onPress={() => onTap(t.m != null ? { k: 'ent', pid: p.id, m: t.m } : { k: 'char', pid: p.id, i })} onLongPress={long}
            style={[st.cell, r ? null : st.punct, lit && { backgroundColor: c.lit }, t.m != null && { borderBottomWidth: 1.5, borderBottomColor: c.eu }]}>
            <Text style={{ fontFamily: F.zh, fontSize: (t.o ? 15 : 21) * size, lineHeight: (t.o ? 20 : 28) * size, color: t.f ? c.seal : t.o ? c.ink2 : c.ink }}>{ch}</Text>
            {r ? <Text style={{ fontFamily: F.ui, fontSize: 9.5 * size, color: c.ink2 }} numberOfLines={1}>{r}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  ) : (
    <Text style={{ fontFamily: F.zh, fontSize: 21 * size, lineHeight: 36 * size, color: c.ink }} onLongPress={long} accessibilityLanguage="zh-Hant">
      {p.zh.map((t, i) => {
        if (t.o && prefs.hideOn) return null;
        const lit = prefs.al && sel != null && t.g === sel;
        return (
          <Text key={i}
            onPress={() => onTap(t.m != null ? { k: 'ent', pid: p.id, m: t.m } : { k: 'char', pid: p.id, i })}
            style={[
              t.o && { fontSize: 15 * size, color: c.ink2 },
              t.f && { color: c.seal },
              lit && { backgroundColor: c.lit },
              t.m != null && { textDecorationLine: 'underline', textDecorationColor: c.eu },
            ]}>{prefs.norm && t.v ? t.v : t.c}</Text>
        );
      })}
    </Text>
  );

  return (
    <Pressable onLongPress={long} delayLongPress={450} accessibilityHint="Nhấn giữ để mở thao tác cho đoạn này"
      style={[st.entry, { borderColor: c.rule }, comment && { borderLeftWidth: 3, borderLeftColor: c.seal2, paddingLeft: 14 }, flash && { backgroundColor: c.flash }]}>
      {(saved || comment) ? (
        <View style={st.meta}>
          {comment ? <Text style={{ fontFamily: F.uiM, fontSize: 11, color: c.seal, letterSpacing: 0.5 }}>{prefs.lang === 'en' ? 'COMMENT' : 'NHẬN XÉT'}</Text> : <View />}
          {saved ? <Text style={{ color: c.seal, fontSize: 14 }} accessibilityLabel="Đã lưu">★</Text> : null}
        </View>
      ) : null}
      {zh}
      {showZh && showTr && p.zh ? <View style={[st.rule, { backgroundColor: c.rule }]} /> : null}
      {showTr ? <SegText segs={segs} c={c} size={size} sel={sel} prefs={prefs} onTap={onTap} pid={p.id} onLong={long} /> : null}
    </Pressable>
  );
}
export const PassageView = memo(PassageViewImpl);

const st = StyleSheet.create({
  entry: { paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rule: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { minWidth: 34, alignItems: 'center', paddingVertical: 2, paddingHorizontal: 1, borderRadius: 4 },
  punct: { minWidth: 14 },
});
