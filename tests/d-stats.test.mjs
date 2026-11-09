import test from 'node:test';
import assert from 'node:assert/strict';
import { calcMonthly, calcStats, filterByPeriod } from '../src/pages/stats/statsModel.js';

const works = [
  { id: 'w1', title: '영화A', category: 'movie', genre: '드라마' },
  { id: 'w2', title: '게임B', category: 'game', genre: 'RPG' },
];
const r = (id, workId, viewedAt, rating) => ({ id, workId, viewedAt, rating, shortReview: '', story: '', photoUrl: '' });

test('평균 별점은 별점이 없는 기록을 제외하고 계산', () => {
  const s = calcStats(works, [r('1', 'w1', '2026-01-01', 5), r('2', 'w1', '2026-01-02', 4), r('3', 'w2', '2026-01-03', null)]);
  assert.equal(s.average, 4.5);
  assert.equal(s.reviewCount, 3);
});

test('별점이 하나도 없으면 평균은 null', () => {
  assert.equal(calcStats(works, [r('1', 'w1', '2026-01-01', null)]).average, null);
});

test('작품이 없는 기록은 통계에서 제외', () => {
  const s = calcStats(works, [r('1', 'w1', '2026-01-01', 3), r('2', 'gone', '2026-01-02', 5)]);
  assert.equal(s.reviewCount, 1);
  assert.equal(s.average, 3);
});

test('유형별 기록 수와 비율', () => {
  const s = calcStats(works, [r('1', 'w1', '2026-01-01', 3), r('2', 'w2', '2026-01-02', 3), r('3', 'w2', '2026-01-03', 3), r('4', 'w2', '2026-01-04', 3)]);
  assert.equal(s.byCategory.find(c => c.value === 'game').count, 3);
  assert.equal(s.byCategory.find(c => c.value === 'game').percent, 75);
  assert.equal(s.byCategory.find(c => c.value === 'book').count, 0);
});

test('가장 많이 기록한 작품: 동점이면 최근 감상한 작품', () => {
  const s = calcStats(works, [r('1', 'w1', '2026-01-01', 3), r('2', 'w1', '2026-01-02', 3), r('3', 'w2', '2026-02-01', 3), r('4', 'w2', '2026-02-02', 3)]);
  assert.equal(s.top.work.id, 'w2');
  assert.equal(s.top.count, 2);
});

test('기록이 없으면 top은 null', () => {
  assert.equal(calcStats(works, []).top, null);
});

// ---- 기간 필터와 월별 집계 (기준일: 2026-11-09) ----
const NOW = new Date(2026, 10, 9);
const sample = [
  r('1', 'w1', '2025-12-31', 4),
  r('2', 'w1', '2026-01-05', 4),
  r('3', 'w1', '2026-08-31', 4),
  r('4', 'w2', '2026-09-01', 5),
  r('5', 'w2', '2026-10-15', 5),
  r('6', 'w2', '2026-11-02', 3),
];

test('기간 필터: 전체는 모든 기록', () => {
  assert.equal(filterByPeriod(sample, 'all', NOW).length, 6);
});

test('기간 필터: 올해는 올해 기록만', () => {
  assert.deepEqual(filterByPeriod(sample, 'year', NOW).map(x => x.id), ['2', '3', '4', '5', '6']);
});

test('기간 필터: 최근 3개월은 9월 1일부터', () => {
  assert.deepEqual(filterByPeriod(sample, '3months', NOW).map(x => x.id), ['4', '5', '6']);
});

test('월별 집계: 올해는 1~12월 12칸', () => {
  const m = calcMonthly(works, sample, 'year', NOW);
  assert.equal(m.months.length, 12);
  assert.equal(m.months[0].count, 1);
  assert.equal(m.months[8].count, 1);
  assert.equal(m.months[11].count, 0);
});

test('월별 집계: 최근 3개월은 9~11월 3칸', () => {
  const m = calcMonthly(works, sample, '3months', NOW);
  assert.deepEqual(m.months.map(x => x.month), [9, 10, 11]);
});

test('월별 집계: 전체는 해가 바뀌어도 최근 12개월', () => {
  const m = calcMonthly(works, [r('1', 'w1', '2025-02-10', 4), r('2', 'w1', '2026-01-10', 4)], 'all', new Date(2026, 0, 15));
  assert.equal(m.months.length, 12);
  assert.deepEqual([m.months[0].year, m.months[0].month], [2025, 2]);
  assert.deepEqual([m.months[11].year, m.months[11].month], [2026, 1]);
  assert.equal(m.months[0].count, 1);
  assert.equal(m.months[11].count, 1);
});

test('월별 집계: 가장 많이 기록한 달은 동점이면 더 최근 달', () => {
  const m = calcMonthly(works, sample, 'year', NOW);
  assert.equal(m.peak.month, 11);
  assert.equal(m.max, 1);
});

test('월별 집계: 막대 비율은 가장 많은 달이 1', () => {
  const m = calcMonthly(works, [r('1', 'w1', '2026-03-01', 4), r('2', 'w1', '2026-03-02', 4), r('3', 'w1', '2026-04-01', 4)], 'year', NOW);
  assert.equal(m.months[2].ratio, 1);
  assert.equal(m.months[3].ratio, 0.5);
});

test('월별 집계: 작품이 없는 기록은 제외, 기록이 없으면 peak은 null', () => {
  const m = calcMonthly(works, [r('1', 'gone', '2026-03-01', 4)], 'year', NOW);
  assert.equal(m.max, 0);
  assert.equal(m.peak, null);
});
