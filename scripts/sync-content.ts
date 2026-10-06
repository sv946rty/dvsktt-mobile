// Builds the app's bundled content from a checkout of the web repo (sv946rty/dvsktt).
//
//   DVSKTT_DIR=../dvsktt npm run sync-content
//
// The web repo is the single source of truth: this script reads its JSON content, runs the same
// render model (@dvsktt/core buildPassage) the website uses, and writes a compact, precomputed
// file per chapter to src/data/. The app never edits or re-derives the text itself.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(process.env.DVSKTT_DIR || path.join(__dirname, '../../dvsktt'));
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(__dirname, '../src/data');
const CHAPTERS = [{ slug: 'ky-nha-dinh', dir: 'dvsktt/dinh', work: 'dvsktt' }];

type AnyObj = Record<string, any>;
const read = (p: string): any => JSON.parse(fs.readFileSync(path.join(CONTENT, p), 'utf8'));

// Compact token formats (see src/lib/content.ts for the matching types).
//   Chinese token  { c, h?: Hán-Việt, v?: normalised variant, f?: 1 doubtful, o?: 1 small note, g?: clause group, m?: mention }
//   Text segment   { t, g?, m?, s?: 'ed'|'on' wrapper, b?: 1 bracket } | { fr: n } | { fo: folio }
function zhTokens(nodes: AnyObj[]) {
  const out: AnyObj[] = [];
  const unit = (u: AnyObj, small: boolean) => {
    const k: AnyObj = { c: u.c };
    if (u.kind === 'hz' && u.hv) k.h = u.hv;
    if (u.n) k.v = u.n;
    if (u.flag) k.f = 1;
    if (small) k.o = 1;
    if (u.cl) k.g = u.cl.g;
    if (u.ent) k.m = u.ent.m;
    out.push(k);
  };
  for (const n of nodes) {
    if (n.t === 'u') unit(n.u, false);
    else for (const u of n.units) unit(u, true);
  }
  return out;
}
function segs(nodes: AnyObj[], wrap: 'ed' | 'on' | null = null, bracket = false, out: AnyObj[] = []) {
  for (const n of nodes) {
    if (n.t === 'fo') out.push({ fo: n.folio });
    else if (n.t === 'fr') out.push({ fr: n.n });
    else if (n.t === 'span') segs(n.children, n.cls === 'br' ? wrap : n.cls, n.cls === 'br', out);
    else for (const r of n.runs || [{ text: n.text }]) {
      if (!r.text) continue;
      const s: AnyObj = { t: r.text };
      if (r.cl) s.g = r.cl.g;
      if (r.ent) s.m = r.ent.m;
      if (wrap) s.s = wrap;
      if (bracket) s.b = 1;
      // merge with the previous segment when nothing distinguishes them
      const p = out[out.length - 1];
      if (p && p.t != null && p.g === s.g && p.m === s.m && p.s === s.s && p.b === s.b) p.t += s.t;
      else out.push(s);
    }
  }
  return out;
}

async function main() {
  const core = await import(pathToFileURL(path.join(ROOT, 'packages/core/src/index.ts')).href);
  const lexicon = {
    hanviet: read('lexicon/hanviet.json'),
    glossary: read('lexicon/glossary.json'),
    variants: read('lexicon/variants.json'),
  };
  fs.mkdirSync(OUT, { recursive: true });
  for (const c of CHAPTERS) {
    const work = core.Work.parse(read(`${c.work}/work.json`));
    const chapter = core.Chapter.parse(read(`${c.dir}/chapter.json`));
    const ents = core.ReaderEntities.parse(read(`${c.dir}/entities/reader-entities.json`));
    const passages = chapter.passages.map((id: string) => core.Passage.parse(read(`${c.dir}/passages/${id}.json`)));
    const parallel = core.ParallelSources.parse(read(`${c.dir}/parallel-sources.json`));

    const byEntry = new Map<string, AnyObj[]>();
    ents.mentions.forEach((m: AnyObj, i: number) => {
      const e = ents.entities[m.entityId];
      const name = e ? e.names.vi || e.names.zh || e.id : m.entityId;
      byEntry.set(m.entryId, [...(byEntry.get(m.entryId) || []), { i, m, label: `${m.text}: ${name}` }]);
    });
    const warnings: string[] = [];
    let applied = 0;
    const out = passages.map((p: AnyObj) => {
      const m = core.buildPassage(p, lexicon, byEntry.get(p.id) || [], (w: string) => warnings.push(w));
      applied += m.stats.applied;
      return {
        id: p.id, year: p.year, reign: p.reign, type: p.type, folio: p.folio, pp: p.page,
        zh: m.zh ? zhTokens(m.zh) : null,
        vi: segs(m.vi), en: segs(m.en),
        notes: m.notes.map((n: AnyObj) => segs(n.nodes)),
        plain: { vi: core.plainVi(p.vi), en: p.en, zh: p.zh ? core.plainZh(p.zh) : '' },
        par: parallel[p.id] || undefined,
      };
    });
    if (applied !== ents.mentions.length) throw new Error(`${c.slug}: ${applied}/${ents.mentions.length} entity mentions placed\n${warnings.join('\n')}`);
    const data = {
      slug: c.slug,
      work: { id: work.id, title: work.title, sections: work.sections, en: work.en },
      title: chapter.title, span: chapter.span, sources: chapter.sources,
      reigns: chapter.reigns, years: chapter.years,
      passages: out,
      lexicon,
      entities: ents.entities,
      relations: ents.relations,
      mentions: ents.mentions.map((m: AnyObj) => ({
        e: m.entityId, en: m.entryId, l: m.lang, tg: m.target, t: m.text, c: m.context,
        ...(m.target === 'note' ? { n: m.noteIndex } : {}), ...(m.reviewRequired ? { rv: 1 } : {}),
      })),
      enrichment: { status: ents.enrichment?.status },
    };
    const file = path.join(OUT, `${c.slug}.json`);
    fs.writeFileSync(file, JSON.stringify(data));
    console.log(`${c.slug}: ${out.length} passages, ${applied}/${ents.mentions.length} mentions, ${Object.keys(ents.entities).length} entities -> ${path.relative(process.cwd(), file)} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
