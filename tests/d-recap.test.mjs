import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAiPayload, calcRecap, nicknameRule, pickNickname, pickSummary, recapRange } from '../src/pages/stats/recapModel.js';

const works = [
  { id: 'w1', title: '리틀 포레스트', category: 'movie', genre: '드라마' },
  { id: 'w2', title: '시그널', category: 'drama', genre: '스릴러' },
  { id: 'w3', title: '불편한 편의점', category: 'book', genre: '소설' },
  { id: 'w4', title: '동물의 숲', category: 'game', genre: '시뮬레이션' },
];
let n = 0;
const r = (workId, viewedAt, rating) => {
  n += 1;
  return { id: `r${n}`, workId, viewedAt, rating, shortReview: '', story: '', photoUrl: '' };
};

test('월 집계: 기록 수, 작품 수, 평균 별점(별점 없는 기록 제외)', () => {
  const reviews = [r('w1', '2026-10-01', 5), r('w1', '2026-10-05', 4), r('w2', '2026-10-09', null), r('w1', '2026-09-30', 1)];
  const recap = calcRecap(works, reviews, 2026, 10);
  assert.equal(recap.count, 3);
  assert.equal(recap.workCount, 2);
  assert.equal(recap.average, 4.5);
  assert.equal(recap.ratedCount, 2);
  assert.equal(recap.highRated, 2);
});

test('지난달과 비교: 1월은 전년 12월과 비교', () => {
  const reviews = [r('w1', '2025-12-30', 3), r('w1', '2025-12-31', 3), r('w1', '2026-01-02', 3)];
  const recap = calcRecap(works, reviews, 2026, 1);
  assert.equal(recap.prevCount, 2);
  assert.equal(recap.diff, -1);
});

test('작품이 삭제된 기록은 제외', () => {
  const recap = calcRecap(works, [r('w1', '2026-10-01', 3), r('gone', '2026-10-02', 5)], 2026, 10);
  assert.equal(recap.count, 1);
});

test('가장 많이 본 유형이 동점이면 영화가 먼저', () => {
  const recap = calcRecap(works, [r('w2', '2026-10-01', 3), r('w1', '2026-10-02', 3)], 2026, 10);
  assert.equal(recap.topCategory.value, 'movie');
});

test('이달의 작품은 많이 본 순, 동점이면 최근에 본 작품 먼저, 최대 3개', () => {
  const reviews = [
    r('w1', '2026-10-01', 3), r('w1', '2026-10-03', 3),
    r('w2', '2026-10-05', 3), r('w3', '2026-10-08', 3), r('w4', '2026-10-09', 3),
  ];
  const { featured } = calcRecap(works, reviews, 2026, 10);
  assert.deepEqual(featured.map(item => item.id), ['w1', 'w4', 'w3']);
  assert.equal(featured[0].count, 2);
});

test('기록이 없는 달: 별명과 요약은 null', () => {
  const recap = calcRecap(works, [r('w1', '2026-09-01', 3)], 2026, 10);
  assert.equal(recap.count, 0);
  assert.equal(recap.topCategory, null);
  assert.equal(pickNickname(recap), null);
  assert.equal(pickSummary(recap), null);
});

// 2026년 10월 기록을 만드는 도우미. 규칙 하나씩 확인할 때 쓴다.
const day = i => `2026-10-${String(i).padStart(2, '0')}`;
const month10 = list => list.map(([workId, rating], i) => r(workId, day(i + 1), rating));
const ruleOf = (list, prevList = []) => {
  const prev = prevList.map(([workId, rating], i) => r(workId, `2026-09-${String(i + 1).padStart(2, '0')}`, rating));
  return nicknameRule(calcRecap(works, [...prev, ...month10(list)], 2026, 10))?.id;
};

test('별명 규칙: 기록 10개 이상이면 기록왕이 가장 먼저', () => {
  assert.equal(ruleOf(Array.from({ length: 10 }, () => ['w1', 5])), 'king');
});

test('별명 규칙: 지난달보다 5개 이상 늘면 폭발한 달', () => {
  assert.equal(ruleOf([['w1', 3], ['w2', 3], ['w3', 3], ['w4', 3], ['w1', 3], ['w2', 3]], [['w1', 3]]), 'surge');
});

test('별명 규칙: 5점이 많으면 별점 부자, 같은 작품을 3번 이상 보면 한 작품만', () => {
  assert.equal(ruleOf([['w1', 5], ['w2', 5], ['w3', 5], ['w4', 4]]), 'five');
  assert.equal(ruleOf([['w1', 3], ['w1', 3], ['w1', 3]]), 'repeat');
});

test('별명 규칙: 유형 4가지를 모두 보면 정복, 3가지 이상을 4개 이상 보면 올라운더', () => {
  assert.equal(ruleOf([['w1', 3], ['w2', 3], ['w3', 3], ['w4', 3]]), 'all4');
  assert.equal(ruleOf([['w1', 3], ['w2', 3], ['w3', 3], ['w3', 3]]), 'allround');
});

test('별명 규칙: 평균 별점이 높으면 VIP, 낮으면 냉정한 평론가', () => {
  assert.equal(ruleOf([['w1', 4.5], ['w2', 4.5], ['w1', 4]]), 'vip');
  assert.equal(ruleOf([['w1', 2], ['w2', 2.5], ['w1', 3]]), 'strict');
});

test('별명 규칙: 지난달보다 줄었으면 충전 중, 2개 이하면 슬로우', () => {
  assert.equal(ruleOf([['w1', 3], ['w2', 3]], [['w1', 3], ['w1', 3], ['w1', 3], ['w1', 3]]), 'dip');
  assert.equal(ruleOf([['w3', 3]]), 'slow');
});

test('별명 규칙: 아무 규칙도 안 맞으면 가장 많이 본 유형의 별명', () => {
  assert.equal(ruleOf([['w3', 3], ['w3', 3], ['w1', 3]]), 'category');
  assert.ok(pickNickname(calcRecap(works, month10([['w3', 3], ['w3', 3], ['w1', 3]]), 2026, 10)));
});

test('별명 규칙: 한 유형만 3개 이상(작품은 서로 다름) 보면 한 우물', () => {
  const movies = [
    { id: 'w1', title: '영화A', category: 'movie', genre: '드라마' },
    { id: 'm2', title: '영화B', category: 'movie', genre: '액션' },
    { id: 'm3', title: '영화C', category: 'movie', genre: '코미디' },
  ];
  const reviews = [r('w1', day(1), 3), r('m2', day(2), 3), r('m3', day(3), 3)];
  assert.equal(nicknameRule(calcRecap(movies, reviews, 2026, 10)).id, 'single');
});

test('별명: 모든 문구는 두 줄이고 줄마다 9글자 이하', () => {
  const sets = [
    month10(Array.from({ length: 10 }, () => ['w1', 5])),
    month10([['w1', 4.5], ['w2', 4.5], ['w1', 4]]),
    month10([['w3', 3]]),
    month10([['w1', 3], ['w2', 3], ['w3', 3], ['w4', 3]]),
  ];
  for (const list of sets) {
    for (let m = 1; m <= 12; m += 1) {
      // 월만 바꿔서 문구 후보가 모두 나오게 한다.
      const moved = list.map(review => ({ ...review, viewedAt: `2026-${String(m).padStart(2, '0')}-${review.viewedAt.slice(8)}` }));
      const nick = pickNickname(calcRecap(works, moved, 2026, m));
      assert.equal(nick.length, 2);
      nick.forEach(line => assert.ok(line.length >= 1 && line.length <= 9, `${line} (${line.length})`));
    }
  }
});

test('별명: 같은 달은 항상 같은 문구, 달이 바뀌면 문구가 달라질 수 있다', () => {
  const list = [['w1', 3], ['w2', 3]];
  const at = (m) => calcRecap(works, list.map(([id, rt], i) => r(id, `2026-${String(m).padStart(2, '0')}-0${i + 1}`, rt)), 2026, m);
  assert.deepEqual(pickNickname(at(10)), pickNickname(at(10)));
  const seen = new Set([1, 2, 3, 4, 5, 6].map(m => pickNickname(at(m)).join('/')));
  assert.ok(seen.size > 1);
});

test('요약: 지난달 대비 문구', () => {
  const base = [['w1', 3], ['w2', 3], ['w3', 3]];
  const second = (list, prevList) => {
    const prev = prevList.map(([id, rt], i) => r(id, `2026-09-0${i + 1}`, rt));
    return pickSummary(calcRecap(works, [...prev, ...month10(list)], 2026, 10))[1];
  };
  assert.match(second(base, []), /시동|다시 달리/);
  assert.match(second(base, [['w1', 3]]), /2개/);
  assert.match(second(base, [['w1', 3], ['w2', 3], ['w3', 3]]), /똑같은|꾸준/);
});

test('요약: 같은 작품을 3번 이상 보면 작품 이름이 나온다', () => {
  const summary = pickSummary(calcRecap(works, month10([['w1', 3], ['w1', 3], ['w1', 3]]), 2026, 10));
  assert.match(summary[0], /리틀 포레스트/);
});

test('AI에 보내는 값에는 작품 제목이 없다', () => {
  const reviews = [r('w1', '2026-10-01', 5), r('w2', '2026-10-02', 4)];
  const payload = buildAiPayload(calcRecap(works, reviews, 2026, 10));
  assert.equal(payload.count, 2);
  assert.deepEqual(payload.categories, [{ label: '영화', count: 1 }, { label: '드라마', count: 1 }]);
  const text = JSON.stringify(payload);
  assert.ok(!text.includes('리틀 포레스트') && !text.includes('시그널'));
});

test('월 이동 범위: 가장 오래된 기록 달 ~ 이번 달, 처음에는 가장 최근 기록 달', () => {
  const now = new Date(2026, 10, 9);
  const reviews = [r('w1', '2026-03-05', 3), r('w1', '2026-07-01', 3)];
  const range = recapRange(works, reviews, now);
  assert.deepEqual(range.first, { year: 2026, month: 3 });
  assert.deepEqual(range.last, { year: 2026, month: 11 });
  assert.deepEqual(range.initial, { year: 2026, month: 7 });
});

test('월 이동 범위: 기록이 없으면 이번 달', () => {
  const range = recapRange(works, [], new Date(2026, 10, 9));
  assert.deepEqual(range.initial, { year: 2026, month: 11 });
});
