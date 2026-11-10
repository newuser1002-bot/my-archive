import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, isTheme, loadTheme, saveTheme } from '../src/pages/stats/recapTheme.js';

function fakeStorage(initial) {
  const data = new Map(initial ? [['archive-recap-theme-v1', initial]] : []);
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('디자인은 4가지', () => {
  assert.deepEqual(THEMES.map(theme => theme.value), ['pastel', 'neon', 'retro', 'sticker']);
});

test('저장한 디자인을 다시 불러온다', () => {
  const storage = fakeStorage();
  saveTheme('neon', storage);
  assert.equal(loadTheme(storage), 'neon');
});

test('저장된 값이 없거나 이상하면 파스텔', () => {
  assert.equal(loadTheme(fakeStorage()), 'pastel');
  assert.equal(loadTheme(fakeStorage('<script>')), 'pastel');
  assert.equal(loadTheme(null), 'pastel');
  assert.equal(loadTheme({ getItem: () => { throw new Error('막힘'); } }), 'pastel');
});

test('목록에 없는 디자인은 저장하지 않는다', () => {
  const storage = fakeStorage('retro');
  saveTheme('hacker', storage);
  assert.equal(loadTheme(storage), 'retro');
  assert.equal(isTheme('hacker'), false);
});
