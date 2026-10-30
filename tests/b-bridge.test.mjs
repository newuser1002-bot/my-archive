import test from 'node:test';
import assert from 'node:assert/strict';
import { ARCHIVE_KEY, createArchiveBridge, decodeArchive } from '../src/pages/b-shared/archiveBridge.js';
import { figmaSeed } from '../src/pages/b-shared/figmaSeed.js';

function setup(raw = figmaSeed) {
  let saved = raw === null ? null : JSON.stringify(raw);
  let failWrite = false;
  let count = 0;
  const storage = { getItem(key) { assert.equal(key, ARCHIVE_KEY); return saved; }, setItem(key, value) { assert.equal(key, ARCHIVE_KEY); if (failWrite) throw new Error('quota'); saved = value; } };
  const options = { getStorage: () => storage, makeId: prefix => `${prefix}-${++count}` };
  return { bridge: createArchiveBridge(options), options, raw: () => JSON.parse(saved), saved: () => saved, replace: value => { saved = value; }, fail: () => { failWrite = true; } };
}
const draft = { viewedAt: '2026-10-29', rating: null, shortReview: '', story: '', photoUrl: '' };

test('다른 탭이 같은 기록을 수정하면 오래된 입력으로 덮어쓰지 않음', () => {
  const env = setup(); const original = env.bridge.getSnapshot().reviews.find(item => item.id === '2');
  const latest = env.raw(); latest.memories[1].body = '다른 탭의 최신 이야기';
  env.replace(JSON.stringify(latest)); env.bridge.refresh(); const before = env.saved();
  assert.throws(() => env.bridge.updateReview('2', { ...original, story: '오래된 창의 이야기' }, original), /다른 탭/);
  assert.equal(env.saved(), before);
});

test('다른 기록만 변경됐으면 현재 기록 수정을 허용하고 둘 다 유지', () => {
  const env = setup(); const original = env.bridge.getSnapshot().reviews.find(item => item.id === '2');
  const latest = env.raw(); latest.memories[0].body = '다른 기록 수정';
  env.replace(JSON.stringify(latest));
  env.bridge.updateReview('2', { ...original, story: '현재 기록 수정' }, original);
  assert.equal(env.raw().memories[0].body, '다른 기록 수정');
  assert.equal(env.raw().memories[1].body, '현재 기록 수정');
});

test('작성 중 다른 탭에서 작품이 삭제되면 재감상을 저장하거나 작품을 되살리지 않음', () => {
  const env = setup(); const latest = env.raw();
  latest.works = latest.works.filter(item => item.id !== 1);
  latest.memories = latest.memories.filter(item => item.workId !== 1);
  env.replace(JSON.stringify(latest)); const before = env.saved();
  assert.throws(() => env.bridge.addReview('1', draft), /삭제/);
  assert.equal(env.saved(), before);
});

test('수정 중 다른 탭에서 기록이 삭제되면 새 기록으로 복구하지 않음', () => {
  const env = setup(); const latest = env.raw();
  latest.memories = latest.memories.filter(item => item.id !== 2);
  env.replace(JSON.stringify(latest)); const before = env.saved();
  assert.throws(() => env.bridge.updateReview('2', draft), /새 기록으로 만들지/);
  assert.equal(env.saved(), before);
});

test('유효하지 않은 저장 요청은 구독 알림과 저장 자료를 변경하지 않음', () => {
  const env = setup(); const before = env.saved(); let notifications = 0;
  env.bridge.subscribe(() => { notifications += 1; });
  assert.throws(() => env.bridge.updateReview('2', { ...draft, viewedAt: '2026-02-30' }), /날짜/);
  assert.throws(() => env.bridge.addReview('1', { ...draft, rating: 6 }), /별점/);
  assert.equal(env.saved(), before); assert.equal(notifications, 0);
});

test('Figma 자료4작품10기록을 문자열 ID와 팀 필드로 읽고 반점 보존', () => {
  const { works, reviews } = decodeArchive(figmaSeed);
  assert.equal(works.length, 4); assert.equal(reviews.length, 10); assert.equal(works[0].id, '1'); assert.equal(works[0].category, 'movie');
  assert.equal(reviews[1].rating, 4.5); assert.equal(reviews[1].workId, '1'); assert.equal(reviews[1].viewedAt, '2024-11-02');
});
test('원본 추가 속성과 숫자 ID를 보존하며 기존 기록만 수정', () => {
  const raw = structuredClone(figmaSeed); raw.ownerNote = 'preserve'; raw.memories[1].custom = 'keep';
  const env = setup(raw); env.bridge.updateReview('2', { ...draft, rating: 4.5, photoUrl: 'data:image/jpeg;base64,YQ==' });
  const stored = env.raw(); assert.equal(stored.ownerNote, 'preserve'); assert.equal(stored.memories.length, 10); assert.equal(stored.memories[1].id, 2); assert.equal(stored.memories[1].workId, 1); assert.equal(stored.memories[1].custom, 'keep'); assert.equal(stored.memories[1].rating, 4.5); assert.equal(stored.memories[1].photo, 'data:image/jpeg;base64,YQ=='); assert.equal(stored.reviews, undefined);
  assert.deepEqual(stored.memories[0], raw.memories[0]);
});
test('작품+첫 기록을 한 저장 단위로 생성하고 새 인스턴스에서 복원', () => {
  const env = setup(null); assert.equal(env.saved(), null);
  const result = env.bridge.createWorkWithReview({ title: '새 책', category: 'book', genre: '에세이' }, draft);
  assert.equal(env.raw().works.length, 5); assert.equal(env.raw().memories.length, 11);
  const readAgain = createArchiveBridge(env.options).getSnapshot();
  assert.equal(readAgain.works.at(-1).id, result.workId); assert.equal(readAgain.works.at(-1).category, 'book'); assert.equal(readAgain.reviews.at(-1).workId, result.workId);
});
test('기존 작품 재감상은 작품 수·숫자 workId를 유지', () => {
  const env = setup(); env.bridge.addReview('1', draft);
  assert.equal(env.raw().works.length, 4); assert.equal(env.raw().memories.length, 11); assert.equal(env.raw().memories.at(-1).workId, 1);
});
test('저장 실패 시 상태·원본·작품/기록 수가 바뀌지 않음', () => {
  const env = setup(); const before = env.saved(); const snapshot = env.bridge.getSnapshot(); env.fail();
  assert.throws(() => env.bridge.createWorkWithReview({ title: '실패', category: 'movie', genre: '드라마' }, draft), /저장 공간/);
  assert.equal(env.saved(), before); assert.equal(env.bridge.getSnapshot(), snapshot);
});
test('손상 JSON/중복 ID/접근 차단은 자료 초기화·덮어쓰기 없이 중단', () => {
  const env = setup(); env.replace('{invalid'); env.bridge.refresh(); assert.ok(env.bridge.getSnapshot().error); assert.throws(() => env.bridge.addReview('1', draft), /읽을 수/); assert.equal(env.saved(), '{invalid');
  const duplicate = structuredClone(figmaSeed); duplicate.works.push({ ...duplicate.works[0], id: '1' }); assert.throws(() => decodeArchive(duplicate), /중복/);
  const denied = createArchiveBridge({ getStorage() { throw new Error('denied'); } }); assert.ok(denied.getSnapshot().error);
});
test('없는 기록·작품과 중복 생성 ID는 저장하지 않음', () => {
  const env = setup(); const before = env.saved(); assert.throws(() => env.bridge.addReview('missing', draft)); assert.throws(() => env.bridge.updateReview('missing', draft)); assert.equal(env.saved(), before);
  const bad = createArchiveBridge({ getStorage: env.options.getStorage, makeId: () => '1' }); assert.throws(() => bad.createWorkWithReview({ title: '중복', category: 'movie', genre: '드라마' }, draft), /중복/);
});
test('팀 reviews 저장 형식도 변환·유실 없이 유지', () => {
  const source = decodeArchive(figmaSeed); const env = setup({ works: source.works, reviews: source.reviews, extra: true });
  env.bridge.updateReview('2', { ...draft, story: '수정' }); assert.equal(env.raw().reviews[1].story, '수정'); assert.equal(env.raw().extra, true); assert.equal(env.raw().memories, undefined);
});
test('다른 탭의 최신 저장 내용을 읽은 뒤 추가하고 구독 해제 동작', () => {
  const env = setup(); let updates = 0; const stop = env.bridge.subscribe(() => { updates += 1; });
  const latest = env.raw(); latest.works[0].title = '다른 탭 수정'; env.replace(JSON.stringify(latest));
  env.bridge.addReview('1', draft); assert.equal(env.bridge.getSnapshot().works[0].title, '다른 탭 수정'); assert.equal(updates, 1);
  stop(); env.bridge.refresh(); assert.equal(updates, 1);
});
