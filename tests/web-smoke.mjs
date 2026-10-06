// Smoke test of the web build in a phone viewport (the same React Native code as iOS/Android).
//   npm run export:web && npx expo serve --port 8099 &   then   node tests/web-smoke.mjs
// Set CHROMIUM_PATH if Playwright's own browser is not installed. Screenshots go to SHOTS (default tests/shots).
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:8099';
const SHOTS = process.env.SHOTS || 'tests/shots';
fs.mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'vi-VN' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

let pass = 0, fail = 0;
const check = async (name, fn) => {
  try { await fn(); pass++; console.log('ok  ', name); } catch (e) { fail++; console.log('FAIL', name, '-', String(e).split('\n')[0]); }
};
const shot = (n) => page.screenshot({ path: `${SHOTS}/${n}.png` });
const visible = (loc) => loc.first().waitFor({ state: 'visible', timeout: 6000 });
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

await page.goto(BASE + '/');
await check('library shows the work and the chapter', async () => {
  await visible(page.getByText('Đại Việt Sử Ký Toàn Thư'));
  await visible(page.getByText('Kỷ nhà Lý'));
  await visible(page.getByText('Bắt đầu đọc'));
});
await shot('1-library');

await check('continue opens the reader', async () => {
  await page.getByText('Bắt đầu đọc').locator('..').getByRole('button').first().click().catch(async () => page.getByText('đoạn E01').first().click());
  await visible(page.getByText('Mở đầu', { exact: true }));
  await visible(page.getByText(/Họ Đinh, tên húy là/));
});
await page.waitForTimeout(600);
await shot('2-reader');

await check('tap a clause lights the pair and shows the pair bar', async () => {
  await page.getByText('tên húy là', { exact: true }).first().click();
  await visible(page.getByText(/Câu đang chọn/));
});
await shot('3-clause');

await check('tap a Chinese character in the lit clause opens the dictionary', async () => {
  await page.getByText('諱', { exact: true }).first().click(); // 諱 is in the lit clause (tên húy là …)
  await visible(page.getByText('Tra thêm'));
  await visible(page.getByText('thivien ↗'));
});
await shot('4-dictionary');
await page.getByRole('button', { name: 'Đóng' }).last().click();
await page.waitForTimeout(500);

await check('tap a name opens the entity card', async () => {
  await page.getByText('Bộ Lĩnh', { exact: true }).first().click();
  await visible(page.getByText('Đinh Bộ Lĩnh'));
  await visible(page.getByText('Trong Đại Việt sử ký toàn thư'));
});
await shot('5-card');
await check('card relations navigate and go back', async () => {
  await page.getByRole('tab', { name: 'Quan hệ' }).click();
  await page.getByRole('button', { name: /Đinh Công Trứ/ }).first().click();
  await visible(page.getByText('Đinh Công Trứ').first());
  await page.getByRole('button', { name: /Quay lại/ }).click();
  await visible(page.getByRole('tab', { name: 'Tổng quan' }));
});
await check('card occurrences list mentions', async () => {
  await page.getByRole('tab', { name: /Xuất hiện/ }).click();
  await visible(page.getByText(/lần trong bản đọc này/));
});
await shot('5b-card-occ');
await page.getByRole('button', { name: 'Đóng' }).last().click();
await page.waitForTimeout(500);

await check('footnote opens in a sheet', async () => {
  await page.getByRole('button', { name: /^Chú thích \d+/ }).first().click();
  await visible(page.getByText(/^Chú thích \d+$/));
});
await shot('6-footnote');
await page.getByRole('button', { name: 'Đóng' }).last().click();
await page.waitForTimeout(500);

await check('dock: Chinese only, then both', async () => {
  await page.getByRole('radio', { name: '中文' }).click();
  await page.waitForTimeout(300);
  expect(!(await page.getByText(/Họ Đinh, tên húy là/).first().isVisible().catch(() => false)), 'translation still visible');
  await page.getByRole('radio', { name: 'Cả hai' }).click();
  await visible(page.getByText(/Họ Đinh, tên húy là/));
});

await check('passage actions: save', async () => {
  await page.getByRole('button', { name: 'Thao tác cho đoạn đang đọc' }).click();
  await page.getByRole('button', { name: 'Lưu đoạn này' }).click();
  await visible(page.getByText('Đã lưu', { exact: true }).last());
});
await check('passage actions: correction note', async () => {
  await page.getByRole('button', { name: 'Thao tác cho đoạn đang đọc' }).click();
  await page.getByRole('button', { name: 'Góp ý sửa' }).click();
  await page.getByPlaceholder(/Tiêu đề/).fill('Thử góp ý');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await visible(page.getByText('Đã lưu góp ý trên máy này'));
});

await check('contents jumps to a year', async () => {
  await page.getByRole('button', { name: 'Mục lục' }).click();
  await visible(page.getByText('Mục lục', { exact: true }));
  await shot('7-contents');
  await page.getByRole('button', { name: /^Tên húy là Toàn/ }).first().click();
  await page.waitForTimeout(1200);
  await visible(page.getByText('Ở ngôi 8 tháng', { exact: true }));
});
await shot('7b-after-jump');

await check('EN switch changes the translation and labels', async () => {
  await page.getByRole('radio', { name: 'EN', exact: true }).click();
  await visible(page.getByRole('radio', { name: 'Both' }));
});
await shot('8-english');
await page.getByRole('radio', { name: 'VI', exact: true }).click();

await check('year chip scrolls', async () => {
  await page.getByRole('button', { name: /Mậu Thìn/ }).first().click();
  await page.waitForTimeout(700);
});

await check('Aa sheet shows settings', async () => {
  await page.getByRole('button', { name: 'Cỡ chữ và hiển thị' }).click();
  await visible(page.getByText('Sáng cả câu tương ứng'));
  await page.getByRole('switch', { name: 'Âm Hán-Việt dưới chữ Hán' }).click();
  await page.mouse.click(195, 60); // tap the scrim above the sheet
  await page.waitForTimeout(500);
});
await shot('9-ruby-grid');
await page.getByRole('button', { name: 'Cỡ chữ và hiển thị' }).click();
await page.waitForTimeout(600);
await page.getByRole('switch', { name: 'Âm Hán-Việt dưới chữ Hán' }).click();
await page.mouse.click(195, 60); // tap the scrim above the sheet

await page.goto(BASE + '/search');
await check('search is accent-insensitive and finds entities and text', async () => {
  await page.getByPlaceholder(/Tìm tên/).fill('hoa lu');
  await visible(page.getByText(/Thực thể · \d+/));
  await visible(page.getByText(/Văn bản · \d+ kết quả/));
});
await shot('10-search');
await check('search Chinese', async () => {
  await page.getByPlaceholder(/Tìm tên/).fill('丁部領');
  await visible(page.getByText(/Thực thể · \d+/));
});
await check('entity result opens the card in the reader', async () => {
  await page.getByText(/^PERSON$/).first().click();
  await visible(page.getByText('Trong Đại Việt sử ký toàn thư'));
});

await page.goto(BASE + '/saved');
await check('saved lists the passage and the note (persisted)', async () => {
  await visible(page.getByText(/Đoạn đã lưu · 1/));
  await visible(page.getByText('Thử góp ý'));
});
await shot('11-saved');

await page.goto(BASE + '/settings');
await check('settings: dark theme', async () => {
  await page.getByRole('radio', { name: 'Tối' }).click();
  await page.waitForTimeout(300);
});
await shot('12-settings-dark');
await page.goto(BASE + '/reader/ky-nha-dinh?at=E05');
await page.waitForTimeout(1500);
await check('deep link opens at the passage', async () => {
  await visible(page.getByText('Năm thứ 1 · Tống Khai Bảo 1'));
  await visible(page.getByRole('radio', { name: 'Cả hai' }));
});
await shot('13-reader-dark');

const real = errors.filter((e) => !/favicon|DevTools|Download the React/.test(e));
console.log(`\n${pass} passed, ${fail} failed; ${real.length} console errors`);
real.slice(0, 10).forEach((e) => console.log('  console:', e.slice(0, 300)));
await browser.close();
process.exit(fail || real.length ? 1 : 0);
