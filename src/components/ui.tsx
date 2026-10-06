// Small shared UI pieces.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';
import { Icon, type IconName } from './Icon';

export function IconBtn({ name, onPress, label, size = 20, style, active }: { name: IconName; onPress: () => void; label: string; size?: number; style?: StyleProp<ViewStyle>; active?: boolean }) {
  const { c } = useStore();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => [u.ib, { borderColor: c.rule, backgroundColor: active ? c.jade : c.leaf, opacity: pressed ? 0.6 : 1 }, style]}>
      <Icon name={name} size={size} color={active ? c.jadeInk : c.ink} />
    </Pressable>
  );
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { c } = useStore();
  return <Text style={[u.sl, { color: c.ink2 }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useStore();
  return <View style={[u.card, { backgroundColor: c.leaf, borderColor: c.rule }, style]}>{children}</View>;
}

/** Segmented control. */
export function Seg<T extends string>({ value, options, onChange, small }: { value: T; options: [T, string][]; onChange: (v: T) => void; small?: boolean }) {
  const { c } = useStore();
  return (
    <View style={[u.seg, { backgroundColor: c.paper2 }]} accessibilityRole="radiogroup">
      {options.map(([k, l]) => {
        const on = k === value;
        return (
          <Pressable key={k} onPress={() => onChange(k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={[u.segB, small && u.segS, on && { backgroundColor: c.leaf, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }]}>
            <Text numberOfLines={1} style={{ fontFamily: on ? F.uiB : F.ui, fontSize: 13, color: on ? c.ink : c.ink2 }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Pill({ children, bg, fg }: { children: ReactNode; bg: string; fg: string }) {
  return <Text style={[u.pill, { backgroundColor: bg, color: fg }]}>{children}</Text>;
}

export const u = StyleSheet.create({
  ib: { width: 44, height: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  sl: { fontFamily: F.uiB, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  seg: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 2 },
  segB: { flex: 1, minHeight: 38, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segS: { flex: 0, minHeight: 38, paddingHorizontal: 10 },
  pill: { fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
});
