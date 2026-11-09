// 통계 계산 함수 모음. 화면(Stats.jsx)과 분리해 값만 계산한다.
// 입력은 RULES.md 형식의 works / reviews 배열이다.
import { CATEGORIES } from '../b-shared/recordModel.js';

export function calcStats(works, reviews) {
  const workById = new Map(works.map(work => [work.id, work]));
  // 작품이 삭제되어 연결이 끊긴 기록은 통계에서 제외한다.
  const valid = reviews.filter(review => workById.has(review.workId));

  // 평균 별점: 별점이 없는(null) 기록은 계산에서 뺀다.
  const rated = valid.filter(review => review.rating !== null);
  const average = rated.length
    ? rated.reduce((sum, review) => sum + review.rating, 0) / rated.length
    : null;

  // 콘텐츠 유형별 기록 수
  const byCategory = CATEGORIES.map(category => {
    const count = valid.filter(review => workById.get(review.workId).category === category.value).length;
    return { ...category, count, percent: valid.length ? (count / valid.length) * 100 : 0 };
  });

  // 장르별 기록 수 (많은 순)
  const genreMap = new Map();
  valid.forEach(review => {
    const work = workById.get(review.workId);
    const label = `${CATEGORIES.find(c => c.value === work.category)?.label ?? ''} · ${work.genre}`;
    genreMap.set(label, (genreMap.get(label) ?? 0) + 1);
  });
  const byGenre = [...genreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, percent: valid.length ? (count / valid.length) * 100 : 0 }));

  // 가장 많이 기록한 작품. 동점이면 가장 최근에 감상한 작품을 고른다.
  const perWork = works.map(work => {
    const own = valid.filter(review => review.workId === work.id);
    const latest = own.reduce((max, review) => (review.viewedAt > max ? review.viewedAt : max), '');
    return { work, count: own.length, latest };
  }).filter(item => item.count > 0);
  perWork.sort((a, b) => b.count - a.count || (a.latest < b.latest ? 1 : -1));
  const top = perWork[0] ?? null;

  return {
    workCount: works.length,
    reviewCount: valid.length,
    average,
    byCategory,
    byGenre,
    top,
  };
}

// ---- 기간 필터와 월별 집계 ----
// 기간 값: 'all' 전체 / 'year' 올해 / '3months' 이번 달을 포함한 최근 3개월
export const PERIODS = [
  { value: 'all', label: '전체' },
  { value: 'year', label: '올해' },
  { value: '3months', label: '최근 3개월' },
];

const pad = n => String(n).padStart(2, '0');

// 기준 달에서 delta개월 앞뒤의 연·월을 구한다.
function shiftMonth(year, month, delta) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

// 선택한 기간에 해당하는 기록만 남긴다.
// now를 인자로 받아서 테스트에서 날짜를 고정할 수 있다.
// viewedAt은 'YYYY-MM-DD' 문자열이라 문자열 비교로 날짜 순서를 알 수 있다.
export function filterByPeriod(reviews, period, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (period === 'year') return reviews.filter(review => review.viewedAt.startsWith(`${year}-`));
  if (period === '3months') {
    const from = shiftMonth(year, month, -2);
    const start = `${from.year}-${pad(from.month)}-01`;
    return reviews.filter(review => review.viewedAt >= start);
  }
  return reviews;
}

// 월별 기록 수. 올해는 1~12월, 최근 3개월은 3칸, 전체는 최근 12개월을 보여준다.
// ratio는 가장 많은 달을 1로 봤을 때의 비율이라 막대 높이에 바로 쓸 수 있다.
export function calcMonthly(works, reviews, period, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const workIds = new Set(works.map(work => work.id));
  // 작품이 삭제되어 연결이 끊긴 기록은 여기서도 제외한다.
  const valid = reviews.filter(review => workIds.has(review.workId));

  let slots;
  if (period === 'year') {
    slots = Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));
  } else {
    const length = period === '3months' ? 3 : 12;
    slots = Array.from({ length }, (_, i) => shiftMonth(year, month, i - (length - 1)));
  }

  const counts = slots.map(slot => ({
    ...slot,
    count: valid.filter(review => review.viewedAt.startsWith(`${slot.year}-${pad(slot.month)}-`)).length,
  }));
  const max = Math.max(0, ...counts.map(item => item.count));
  const months = counts.map(item => ({ ...item, ratio: max ? item.count / max : 0 }));
  // 가장 많이 기록한 달. 동점이면 더 최근 달을 고른다.
  const peak = max > 0 ? months.reduce((best, item) => (item.count >= best.count ? item : best)) : null;

  return { months, max, peak };
}
