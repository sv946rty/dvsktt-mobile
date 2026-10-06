import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type Name = ComponentProps<typeof SymbolView>['name'];
const N = {
  book: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  star: { ios: 'star', android: 'star', web: 'star' },
  starFill: { ios: 'star.fill', android: 'star', web: 'star' },
  gear: { ios: 'gearshape', android: 'settings', web: 'settings' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  list: { ios: 'list.bullet', android: 'toc', web: 'toc' },
  textSize: { ios: 'textformat.size', android: 'format_size', web: 'format_size' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  ext: { ios: 'arrow.up.right', android: 'north_east', web: 'north_east' },
  quote: { ios: 'quote.opening', android: 'format_quote', web: 'format_quote' },
  link: { ios: 'link', android: 'link', web: 'link' },
  chat: { ios: 'bubble.left', android: 'chat_bubble', web: 'chat_bubble' },
  swap: { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
} as const;
export type IconName = keyof typeof N;

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: ColorValue }) {
  return <SymbolView name={N[name] as unknown as Name} size={size} tintColor={color} />;
}
