import test from 'node:test';
import assert from 'node:assert/strict';
import { GENRES, isValidDate, todayValue, initialReview, normalizeReview, validateRecord, safePhotoUrl } from '../src/pages/b-shared/recordModel.js';
import { commitDemo, readDemo, seed, transition } from '../dev/b-preview/demoStore.js';
import { preparePhoto, PHOTO_INPUT_LIMIT } from '../src/pages/b-shared/photo.js';

const work = { title: '작품', category: 'movie', genre: '드라마' };
const review = { ...initialReview(), viewedAt: '2026-10-29' };
test('현재 날짜를 로컬 달력 기준으로 생성', () => assert.equal(todayValue(new Date(2026, 9, 29, 0, 10)), '2026-10-29'));
test('윤년·월·실재 날짜 검증', () => {
  for (const valid of ['2024-02-29', '2026-10-29', '2000-02-29']) assert.equal(isValidDate(valid), true);
  for (const invalid of ['', '2026-02-29', '1900-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-1-01', '0000-01-01']) assert.equal(isValidDate(invalid), false, invalid);
});
test('날짜 외 선택항목 미입력 허용', () => assert.deepEqual(validateRecord(work, review, true), {}));
test('Figma 유형별 장르 이외의 값은 새 작품 등록 시 거절', () => {
  assert.ok(validateRecord({ ...work, category: 'book', genre: '드라마' }, review, true).genre);
  for (const [category, genres] of Object.entries(GENRES)) {
    for (const genre of genres) assert.deepEqual(validateRecord({ ...work, category, genre }, review, true), {});
  }
});
test('한줄평80자 제한과 기존 긴 기록 무손실 보존', () => {
  assert.deepEqual(validateRecord(work, { ...review, shortReview: '가'.repeat(80) }, true), {});
  assert.ok(validateRecord(work, { ...review, shortReview: '가'.repeat(81) }, true).shortReview);
  const original = { ...review, shortReview: '기'.repeat(90), rating: 4.5 };
  assert.deepEqual(validateRecord({}, original, false, original), {});
  assert.ok(validateRecord({}, { ...original, shortReview: '수'.repeat(90) }, false, original).shortReview);
  assert.equal(initialReview(original).rating, 4.5);
});
test('작품 필수값과 공백 검증', () => assert.deepEqual(Object.keys(validateRecord({ title: '  ', category: 'x', genre: '\n' }, review, true)), ['title', 'category', 'genre']));
test('재감상에는 작품 정보 재검증/재입력 없음', () => assert.deepEqual(validateRecord({}, review, false), {}));
test('별점은 null 또는 0.5 간격', () => {
  for (const rating of [null, 0.5, 4.5, 5]) assert.deepEqual(validateRecord(work, { ...review, rating }, true), {});
  for (const rating of [0, 6, NaN, 4.3, '4.5']) assert.ok(validateRecord(work, { ...review, rating }, true).rating);
});
test('선택 문자열은 빈 문자열, 별점 미선택은 null', () => assert.deepEqual(initialReview({ viewedAt: '2026-01-01' }), { viewedAt: '2026-01-01', rating: null, shortReview: '', story: '', photoUrl: '' }));
test('저장용 정리는 입력 객체를 변경하지 않음', () => {
  const input = { ...review, shortReview: ' 메모 ', story: ' 이야기 ' };
  assert.equal(normalizeReview(input).shortReview, '메모'); assert.equal(input.shortReview, ' 메모 ');
});
test('사진 표시 URL은 http(s)와 지원 이미지 data만 허용', () => {
  assert.equal(safePhotoUrl('javascript:alert(1)'), ''); assert.equal(safePhotoUrl('data:image/svg+xml,<svg/>'), ''); assert.equal(safePhotoUrl(''), '');
  assert.equal(safePhotoUrl('data:image/jpeg;base64,YQ=='), 'data:image/jpeg;base64,YQ=='); assert.equal(safePhotoUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
});
let nextId = 0;
const makeId = p => `${p}-${++nextId}`;
test('검증 어댑터: 작품과 첫 기록 원자적 생성·연결', () => {
  const next = transition(seed, 'create', work, review, makeId);
  assert.equal(next.data.works.length, 2); assert.equal(next.data.reviews.length, 2); assert.equal(next.data.reviews.at(-1).workId, next.result.workId); assert.equal(seed.works.length, 1);
});
test('검증 어댑터: 재감상은 작품을 복제하지 않음', () => {
  const next = transition(seed, 'add', 'b-demo-work', review, makeId).data;
  assert.equal(next.works.length, 1); assert.equal(next.reviews.length, 2);
});
test('검증 어댑터: 수정 시 ID·workId 보존, 다른 기록 유지', () => {
  const base = transition(seed, 'add', 'b-demo-work', review, makeId).data;
  const next = transition(base, 'update', 'b-demo-review', { ...review, id: 'bad', workId: 'bad', rating: null, photoUrl: '' }, makeId).data;
  assert.equal(next.reviews[0].id, 'b-demo-review'); assert.equal(next.reviews[0].workId, 'b-demo-work'); assert.equal(next.reviews[0].rating, null); assert.equal(next.reviews[1], base.reviews[1]);
});
test('검증 어댑터: 잘못된 ID는 저장하지 않음', () => {
  assert.throws(() => transition(seed, 'add', 'missing', review, makeId)); assert.throws(() => transition(seed, 'update', 'missing', review, makeId));
});
test('검증 어댑터: 저장 실패는 기존 상태를 변경하지 않음', () => {
  const before = JSON.stringify(seed); assert.throws(() => commitDemo({ setItem() { throw new Error('quota'); } }, seed, 'add', 'b-demo-work', review, makeId), /quota/); assert.equal(JSON.stringify(seed), before);
});
test('검증 어댑터: 새로 읽기와 손상 JSON', () => {
  let text = null; const storage = { getItem: () => text, setItem: (key, value) => { text = value; } };
  assert.equal(readDemo(storage), seed); commitDemo(storage, seed, 'add', 'b-demo-work', review, makeId); assert.equal(readDemo(storage).reviews.length, 2); text = '{broken'; assert.throws(() => readDemo(storage)); text = '{}'; assert.throws(() => readDemo(storage));
});
test('사진: 형식·크기·빈 파일은 디코딩 전에 거부', async () => {
  await assert.rejects(preparePhoto({ type: 'image/svg+xml', size: 100 }), /JPG/);
  await assert.rejects(preparePhoto({ type: 'text/plain', size: 100 }), /JPG/);
  await assert.rejects(preparePhoto({ type: 'image/png', size: PHOTO_INPUT_LIMIT + 1 }), /5MB/);
  await assert.rejects(preparePhoto({ type: 'image/png', size: 0 }), /비어/);
});
test('사진: 디코딩·축소·이미지 실패 시 임시 URL 정리 (브라우저 모의 객체)', async () => {
  const originalImage = globalThis.Image;
  const originalDocument = globalThis.document;
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  let revoked = 0;
  let canvas;
  URL.createObjectURL = () => 'blob:b-unit-test';
  URL.revokeObjectURL = () => { revoked += 1; };
  globalThis.document = { createElement() { canvas = { width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() {} }), toDataURL: () => 'data:image/jpeg;base64,YQ==' }; return canvas; } };
  try {
    globalThis.Image = class { naturalWidth = 3200; naturalHeight = 1600; set src(value) { assert.equal(value, 'blob:b-unit-test'); queueMicrotask(() => this.onload()); } };
    assert.equal(await preparePhoto({ type: 'image/png', size: 200 }), 'data:image/jpeg;base64,YQ==');
    assert.equal(canvas.width, 1600); assert.equal(canvas.height, 800); assert.equal(revoked, 1);
    globalThis.Image = class { set src(value) { assert.equal(value, 'blob:b-unit-test'); queueMicrotask(() => this.onerror()); } };
    await assert.rejects(preparePhoto({ type: 'image/png', size: 200 }), /읽을 수/);
    assert.equal(revoked, 2);
  } finally {
    URL.createObjectURL = create; URL.revokeObjectURL = revoke;
    if (originalImage === undefined) delete globalThis.Image; else globalThis.Image = originalImage;
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  }
});
