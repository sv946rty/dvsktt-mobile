// Bottom sheet built on Modal: scrim tap or the system back gesture closes it.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/lib/store';

export function Sheet({ open, onClose, children, tall, label }: { open: boolean; onClose: () => void; children: ReactNode; tall?: boolean; label?: string }) {
  const { c } = useStore();
  const ins = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityLabel="Đóng" accessibilityRole="button" />
        <View style={{ flex: 1 }} pointerEvents="box-none" />
        <View
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[s.sheet, { backgroundColor: c.leaf, paddingBottom: Math.max(ins.bottom, 12), maxHeight: tall ? '88%' : '75%', minHeight: tall ? '60%' : undefined, borderColor: c.rule }]}
        >
          <View style={[s.grip, { backgroundColor: c.rule }]} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden', width: '100%', maxWidth: 640, alignSelf: 'center' },
  grip: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 8, marginBottom: 4 },
});
