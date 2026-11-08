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
