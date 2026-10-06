// App state kept on this device (AsyncStorage): reading preferences, last position, saved passages
// and correction notes. Accounts and syncing come later (phase 2 on the web).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, type Colors } from './theme';

export type Prefs = {
  lang: 'vi' | 'en';
  mode: 'both' | 'zh' | 'tr';
  size: number;           // index into SIZES
  theme: 'auto' | 'light' | 'dark';
  al: boolean;            // light up both sides of a clause
  ruby: boolean;          // Hán-Việt reading under each character
  norm: boolean;          // show normalised variant characters
  hideEd: boolean;        // hide translator additions [ ]
  hideOn: boolean;        // hide small original notes ( )
};
export const DEFAULT_PREFS: Prefs = { lang: 'vi', mode: 'both', size: 1, theme: 'auto', al: true, ruby: false, norm: false, hideEd: false, hideOn: false };
export type Note = { id: string; chapter: string; entry: string; title: string; body: string; ts: number };
export type LastRead = { chapter: string; id: string; ts: number };
type Saved = { chapter: string; id: string; ts: number };

type State = { prefs: Prefs; saved: Saved[]; notes: Note[]; last: LastRead | null };
const KEY = 'dvsktt.app.v1';

type Ctx = State & {
  ready: boolean;
  c: Colors;
  t: (vi: string, en: string) => string;
  setPrefs: (p: Partial<Prefs>) => void;
  toggleSaved: (chapter: string, id: string) => boolean;
  isSaved: (chapter: string, id: string) => boolean;
  addNote: (n: Omit<Note, 'id' | 'ts'>) => void;
  removeNote: (id: string) => void;
  setLast: (chapter: string, id: string) => void;
};
const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<State>({ prefs: DEFAULT_PREFS, saved: [], notes: [], last: null });
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);
  const scheme = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v) {
          const s = JSON.parse(v) as Partial<State>;
          setSt((o) => ({ ...o, ...s, prefs: { ...DEFAULT_PREFS, ...s.prefs } }));
        }
      })
      .catch(() => {})
      .finally(() => { loaded.current = true; setReady(true); });
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const k = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(st)).catch(() => {}); }, 250);
    return () => clearTimeout(k);
  }, [st]);

  const setPrefs = useCallback((p: Partial<Prefs>) => setSt((o) => ({ ...o, prefs: { ...o.prefs, ...p } })), []);
  const isSaved = useCallback((chapter: string, id: string) => st.saved.some((x) => x.chapter === chapter && x.id === id), [st.saved]);
  const toggleSaved = useCallback((chapter: string, id: string) => {
    const on = !st.saved.some((x) => x.chapter === chapter && x.id === id);
    setSt((o) => ({ ...o, saved: on ? [{ chapter, id, ts: Date.now() }, ...o.saved] : o.saved.filter((x) => !(x.chapter === chapter && x.id === id)) }));
    return on;
  }, [st.saved]);
  const addNote = useCallback((n: Omit<Note, 'id' | 'ts'>) =>
    setSt((o) => ({ ...o, notes: [{ ...n, id: Math.random().toString(36).slice(2, 10), ts: Date.now() }, ...o.notes] })), []);
  const removeNote = useCallback((id: string) => setSt((o) => ({ ...o, notes: o.notes.filter((x) => x.id !== id) })), []);
  const setLast = useCallback((chapter: string, id: string) =>
    setSt((o) => (o.last?.chapter === chapter && o.last.id === id ? o : { ...o, last: { chapter, id, ts: Date.now() } })), []);

  const effDark = st.prefs.theme === 'auto' ? scheme === 'dark' : st.prefs.theme === 'dark';
  const lang = st.prefs.lang;
  const value = useMemo<Ctx>(() => ({
    ...st, ready, c: effDark ? dark : light,
    t: (vi: string, en: string) => (lang === 'en' ? en : vi),
    setPrefs, toggleSaved, isSaved, addNote, removeNote, setLast,
  }), [st, ready, effDark, lang, setPrefs, toggleSaved, isSaved, addNote, removeNote, setLast]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() {
  const v = useContext(C);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
