// Palette and type, taken from the web reader (reader.css) so both feel like one product.
import { Platform } from 'react-native';

export const light = {
  paper: '#EEF1EA', paper2: '#E2E8DF', leaf: '#F8FAF5', ink: '#18252C', ink2: '#52616B', rule: '#CBD3C9',
  seal: '#A5382F', seal2: '#E2BDB7', jade: '#1B6862', jadeInk: '#FFFFFF', lit: '#F2D86F', flash: '#F6E9A6',
  eb: '#2563C9', ebInk: '#1D4FA3', et: '#EAF1FC', eu: '#8FB0E6', tt: '#FCF7EC', ttB: '#EFE3C6', wk: '#F3F7FD', wkB: '#DCE7F7',
  scrim: 'rgba(20,35,40,0.35)', dark: false,
};
export const dark: typeof light = {
  paper: '#10181E', paper2: '#18232B', leaf: '#162029', ink: '#E6EBE5', ink2: '#9DACB4', rule: '#2B3A44',
  seal: '#D9776C', seal2: '#5A3A38', jade: '#63BDB4', jadeInk: '#0E1A1A', lit: '#77661F', flash: '#58511F',
  eb: '#7EA8F0', ebInk: '#A9C5F7', et: '#1B2A3F', eu: '#46638F', tt: '#211F18', ttB: '#3A3423', wk: '#172231', wkB: '#26364C',
  scrim: 'rgba(0,0,0,0.55)', dark: true,
};
export type Colors = typeof light;

export const REL: Record<string, [string, string, string, string]> = {
  // colour: light bg, light ink, dark bg, dark ink
  blue: ['#DCE8FB', '#1F4E9E', '#1F3150', '#A9C5F7'], green: ['#DDF1E3', '#1E6B3A', '#1B3426', '#9AD8AE'],
  orange: ['#FCE5D3', '#9A4A12', '#3A2717', '#F2B88A'], purple: ['#E8E0FA', '#5B3AA3', '#2B2340', '#C7B5F2'],
  red: ['#F8DEDC', '#9B2C25', '#3A1F1E', '#F0A9A3'], amber: ['#F7EBC9', '#7A5A0B', '#352C14', '#E8CB7C'],
  slate: ['#E3E8EE', '#3E4C5B', '#232C36', '#B9C5D2'],
};

export const F = {
  ui: 'BeVietnamPro_400Regular', uiM: 'BeVietnamPro_500Medium', uiB: 'BeVietnamPro_600SemiBold',
  vi: 'Newsreader_400Regular', viM: 'Newsreader_500Medium', viB: 'Newsreader_600SemiBold', viI: 'Newsreader_400Regular_Italic',
  zh: Platform.select({ ios: 'Songti TC', android: 'serif', default: '"Noto Serif TC","Songti TC","Noto Serif CJK TC",serif' }) as string,
};

/** Reading sizes (multiplier), same steps as the web. */
export const SIZES = [0.9, 1, 1.12, 1.25, 1.4];
