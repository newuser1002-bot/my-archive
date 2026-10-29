// B 검증 전용 저장소다. 실제 A 저장 모듈을 대체하거나 main 앱에서 사용하지 않는다.
export const DEMO_KEY = 'archive:b-only-preview:v1';
export const seed = {
  works: [{ id: 'b-demo-work', title: '리틀 포레스트', category: 'movie', genre: '드라마' }],
  reviews: [{ id: 'b-demo-review', workId: 'b-demo-work', viewedAt: '2026-10-20', rating: 4.5, shortReview: '돌아갈 곳이 있다는 것.', story: '친구와 영화를 보고 따뜻한 저녁을 먹었다.', photoUrl: '' }],
};

export function readDemo(storage) {
  const text = storage.getItem(DEMO_KEY);
  if (!text) return seed;
  const value = JSON.parse(text);
  if (!Array.isArray(value.works) || !Array.isArray(value.reviews)) throw new Error('검증용 저장 자료의 형식이 올바르지 않아요.');
  return value;
}

export function transition(data, action, id, draft, makeId) {
  if (action === 'create') {
    const workId = makeId('work');
    const reviewId = makeId('review');
    return { data: { works: [...data.works, { ...id, id: workId }], reviews: [...data.reviews, { ...draft, id: reviewId, workId }] }, result: { workId, reviewId } };
  }
  if (action === 'add') {
    if (!data.works.some(item => item.id === id)) throw new Error('작품을 찾을 수 없어요.');
    return { data: { ...data, reviews: [...data.reviews, { ...draft, id: makeId('review'), workId: id }] } };
  }
  if (action === 'update') {
    const original = data.reviews.find(item => item.id === id);
    if (!original || !data.works.some(item => item.id === original.workId)) throw new Error('수정할 기록을 찾을 수 없어요.');
    return { data: { ...data, reviews: data.reviews.map(item => item.id === id ? { ...item, ...draft, id: item.id, workId: item.workId } : item) } };
  }
  throw new Error('알 수 없는 작업이에요.');
}

export function commitDemo(storage, data, action, id, draft, makeId) {
  const next = transition(data, action, id, draft, makeId);
  storage.setItem(DEMO_KEY, JSON.stringify(next.data));
  return next;
}
