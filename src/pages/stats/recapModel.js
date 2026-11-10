// 월간 결산 계산 함수 모음. 화면(RecapSection.jsx)과 분리해 값만 계산한다.
// 입력은 RULES.md 형식의 works / reviews 배열이다.
// 별명·요약 문구는 '유형·별점·기록 수' 같은 숫자에서만 만든다. (시간대나 장소는 데이터에 없다)
import { CATEGORIES } from '../b-shared/recordModel.js';
import { shiftMonth } from './statsModel.js';

const pad = n => String(n).padStart(2, '0');
const monthIndex = ({ year, month }) => year * 12 + (month - 1);

function inMonth(reviews, year, month) {
  const prefix = `${year}-${pad(month)}-`;
  return reviews.filter(review => review.viewedAt.startsWith(prefix));
}

// 한 달 치 결산 숫자. 별명/요약 문구와 AI에 보낼 값이 모두 여기서 나온다.
export function calcRecap(works, reviews, year, month) {
  const workById = new Map(works.map(work => [work.id, work]));
  // 작품이 삭제되어 연결이 끊긴 기록은 제외한다.
  const valid = reviews.filter(review => workById.has(review.workId));
  const mine = inMonth(valid, year, month);

  const prev = shiftMonth(year, month, -1);
  const prevCount = inMonth(valid, prev.year, prev.month).length;

  // 별점이 없는(null) 기록은 평균과 별점 개수에서 뺀다.
  const rated = mine.filter(review => review.rating !== null);
  const average = rated.length ? rated.reduce((sum, review) => sum + review.rating, 0) / rated.length : null;
  const highRated = rated.filter(review => review.rating >= 4).length;
  const fiveStar = rated.filter(review => review.rating === 5).length;

  const byCategory = CATEGORIES.map(category => ({
    value: category.value,
    label: category.label,
    count: mine.filter(review => workById.get(review.workId).category === category.value).length,
  }));
  const maxCount = Math.max(0, ...byCategory.map(item => item.count));
  // 가장 많이 본 유형. 동점이면 CATEGORIES 순서(영화, 드라마, 책, 게임)로 앞선 것을 고른다.
  const topCategory = maxCount > 0 ? byCategory.find(item => item.count === maxCount) : null;
  const categoryKinds = byCategory.filter(item => item.count > 0).length;

  // 이달의 작품: 이번 달에 가장 많이 감상한 순, 동점이면 더 최근에 본 작품이 먼저.
  const perWork = new Map();
  mine.forEach(review => {
    const entry = perWork.get(review.workId) ?? { work: workById.get(review.workId), count: 0, latest: '' };
    entry.count += 1;
    if (review.viewedAt > entry.latest) entry.latest = review.viewedAt;
    perWork.set(review.workId, entry);
  });
  const featured = [...perWork.values()]
    .sort((a, b) => b.count - a.count || (a.latest < b.latest ? 1 : a.latest > b.latest ? -1 : 0))
    .slice(0, 3)
    .map(entry => ({
      id: entry.work.id,
      title: entry.work.title,
      category: entry.work.category,
      categoryLabel: CATEGORIES.find(category => category.value === entry.work.category)?.label ?? '',
      count: entry.count,
    }));

  return {
    year,
    month,
    count: mine.length,
    workCount: perWork.size,
    prevCount,
    diff: mine.length - prevCount,
    average,
    ratedCount: rated.length,
    highRated,
    fiveStar,
    topWork: featured[0] ?? null,
    byCategory,
    topCategory,
    categoryKinds,
    featured,
  };
}

// 결산 카드를 넘겨볼 수 있는 달의 범위와, 처음 보여줄 달을 구한다.
// 범위: 가장 오래된 기록의 달 ~ 이번 달(미래 날짜 기록이 있으면 그 달까지)
export function recapRange(works, reviews, now = new Date()) {
  const workIds = new Set(works.map(work => work.id));
  const months = reviews
    .filter(review => workIds.has(review.workId) && /^\d{4}-\d{2}-\d{2}$/.test(review.viewedAt))
    .map(review => ({ year: Number(review.viewedAt.slice(0, 4)), month: Number(review.viewedAt.slice(5, 7)) }));
  const current = { year: now.getFullYear(), month: now.getMonth() + 1 };
  if (months.length === 0) return { first: current, last: current, initial: current };

  const sorted = [...months].sort((a, b) => monthIndex(a) - monthIndex(b));
  const first = sorted[0];
  const newest = sorted[sorted.length - 1];
  const last = monthIndex(newest) > monthIndex(current) ? newest : current;
  // 처음에는 오늘까지 기록이 있는 가장 최근 달을 보여준다.
  const pastOrNow = sorted.filter(item => monthIndex(item) <= monthIndex(current));
  const initial = pastOrNow.length ? pastOrNow[pastOrNow.length - 1] : last;
  return { first, last, initial };
}

// ---- 기본 별명과 요약 (AI 없이 규칙으로 만든다) ----
const VIP_PLACE = { movie: '영화관', drama: '드라마', book: '서점', game: '게임방' };
const SUBJECT = { movie: '영화가', drama: '드라마가', book: '책이', game: '게임이' };
const LABEL = { movie: '영화', drama: '드라마', book: '책', game: '게임' };
const BY_CATEGORY = {
  movie: [['영화에', '푹 빠진 달'], ['영화가', '일상인 달'], ['스크린 앞', '단골손님']],
  drama: [['정주행 멈출 수', '없는 사람'], ['드라마에', '진심인 달'], ['다음 화 버튼', '못 참는 사람']],
  book: [['책 속에 사는', '독서가'], ['책장 넘기는', '손이 바쁜 달'], ['활자 중독', '한 달']],
  game: [['게임에 푹 빠진', '플레이어'], ['컨트롤러', '놓기 싫은 달'], ['퀘스트 클리어', '하는 달']],
};
const ONLY_CATEGORY = {
  movie: [['영화만 파는', '한 우물러'], ['오직 영화', '한 길 인생']],
  drama: [['드라마에만', '올인한 달'], ['정주행 외길', '인생']],
  book: [['책만 읽은', '진짜 독서가'], ['활자에', '푹 잠긴 달']],
  game: [['게임만 한', '한 달'], ['오직 게임', '한 길 인생']],
};

// 같은 규칙 안에 문구가 여러 개 있으면 달(연·월)로 하나를 골라서, 같은 달은 항상 같은 문구가 나오고 달이 바뀌면 달라진다.
const seedOf = recap => recap.year * 12 + recap.month;
const pickVariant = (list, recap, shift = 0) => list[(seedOf(recap) + shift) % list.length];

// 별명 규칙. 위에 있는 규칙일수록 먼저 적용되고, 처음 맞는 규칙의 문구를 쓴다.
// 각 줄은 9글자 이하로 써야 카드에 잘 들어간다. (시간대·장소 같은 데이터에 없는 내용은 쓰지 않는다)
const NICKNAME_RULES = [
  { id: 'king', when: r => r.count >= 10, variants: () => [['이번 달 기록왕', '등극'], ['감상 폭주', '기관차'], ['쉬지 않는', '감상 머신']] },
  { id: 'surge', when: r => r.prevCount > 0 && r.diff >= 5, variants: () => [['지난달의 나를', '뛰어넘은 달'], ['감상 열정', '폭발한 달']] },
  { id: 'five', when: r => r.ratedCount >= 3 && r.fiveStar >= 3 && r.fiveStar / r.ratedCount >= 0.6, variants: () => [['5점 뿌리는', '별점 부자'], ['별 다섯 개', '남발러'], ['만점 자판기', '가동 중']] },
  { id: 'repeat', when: r => r.topWork && r.topWork.count >= 3, variants: () => [['한 작품만', '파는 사람'], ['같은 작품', '계속 보는 사람'], ['회차 거듭하는', '감상 장인']] },
  { id: 'all4', when: r => r.categoryKinds >= 4, variants: () => [['4종 세트', '완전 정복'], ['영화부터 게임까지', '섭렵한 달']] },
  { id: 'allround', when: r => r.count >= 4 && r.categoryKinds >= 3, variants: () => [['장르 안 가리는', '올라운더'], ['취향 넓은', '탐험가']] },
  { id: 'vip', when: r => r.ratedCount >= 3 && r.average >= 4.3, variants: r => [['별점 퍼주는', `${VIP_PLACE[r.topCategory.value]} VIP`], ['별점 인심 좋은', '후한 평론가'], ['좋은 게', '많았던 달']] },
  { id: 'strict', when: r => r.ratedCount >= 3 && r.average <= 2.8, variants: () => [['별점에 인색한', '냉정한 평론가'], ['눈 높은', '까다로운 감상러'], ['칭찬에 짠', '현실주의자']] },
  { id: 'dip', when: r => r.prevCount >= 3 && r.diff <= -2, variants: () => [['잠시 쉬어가는', '충전 중'], ['숨 고르는', '한 달']] },
  { id: 'single', when: r => r.count >= 3 && r.categoryKinds === 1, variants: r => ONLY_CATEGORY[r.topCategory.value] },
  { id: 'slow', when: r => r.count <= 2, variants: () => [['천천히 음미하는', '슬로우 감상러'], ['적게 보고', '깊게 보는 사람'], ['한 편 한 편', '소중한 달']] },
  { id: 'category', when: () => true, variants: r => BY_CATEGORY[r.topCategory.value] },
];

// 어떤 규칙이 적용됐는지(테스트와 설명용)
export function nicknameRule(recap) {
  if (recap.count === 0) return null;
  return NICKNAME_RULES.find(rule => rule.when(recap));
}

// 별명 두 줄
export function pickNickname(recap) {
  const rule = nicknameRule(recap);
  return rule ? pickVariant(rule.variants(recap), recap) : null;
}

// 요약 두 줄. 숫자를 나열하지 않고 한마디로 풀어 쓴다.
export function pickSummary(recap) {
  if (recap.count === 0) return null;
  const top = recap.topCategory.value;
  const praised = recap.ratedCount >= 3 && recap.highRated / recap.ratedCount >= 0.7;

  let firstList;
  if (recap.topWork && recap.topWork.count >= 3) {
    firstList = [`「${recap.topWork.title}」를 ${recap.topWork.count}번이나 봤어요.`];
  } else if (recap.ratedCount >= 3 && recap.fiveStar >= 3) {
    firstList = [`5점 만점을 ${recap.fiveStar}번이나 줬어요.`];
  } else if (praised) {
    firstList = [`별점 4점 이상을 ${recap.highRated}번이나 줬어요.`, `마음에 든 작품이 ${recap.highRated}개나 있었어요.`];
  } else {
    firstList = [`이번 달은 ${SUBJECT[top]} 제일 많이 보였어요.`, `이번 달 최애는 ${LABEL[top]}였어요.`];
  }

  let secondList;
  if (recap.prevCount === 0) secondList = ['지난달엔 쉬어갔는데 이번 달 시동이 걸렸어요.', '쉬었다가 다시 달리기 시작한 한 달.'];
  else if (recap.diff > 0) secondList = [`지난달보다 ${recap.diff}개 더 부지런했던 한 달.`, `지난달보다 ${recap.diff}개 늘어난 알찬 한 달.`];
  else if (recap.diff < 0) secondList = [`지난달보다 ${-recap.diff}개 줄었지만 알차게 보냈어요.`, `지난달보다 ${-recap.diff}개 적게, 대신 깊게 봤어요.`];
  else secondList = ['지난달과 똑같은 페이스를 지켰어요.', '꾸준함이 돋보이는 한 달.'];

  return [pickVariant(firstList, recap), pickVariant(secondList, recap, 1)];
}

// AI에 보낼 값. 월별 집계 숫자만 담고 작품 제목, 감상평, 사진은 보내지 않는다.
export function buildAiPayload(recap) {
  return {
    year: recap.year,
    month: recap.month,
    count: recap.count,
    workCount: recap.workCount,
    prevCount: recap.prevCount,
    average: recap.average === null ? null : Math.round(recap.average * 10) / 10,
    ratedCount: recap.ratedCount,
    highRated: recap.highRated,
    categories: recap.byCategory.filter(item => item.count > 0).map(item => ({ label: item.label, count: item.count })),
  };
}
