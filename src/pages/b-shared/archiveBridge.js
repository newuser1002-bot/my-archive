import { CATEGORIES, isValidDate } from './recordModel.js';
import { figmaSeed } from './figmaSeed.js';

export const ARCHIVE_KEY = 'archive-data-v2';
const categoryByLabel = Object.fromEntries(CATEGORIES.map(item => [item.label, item.value]));
const labelByCategory = Object.fromEntries(CATEGORIES.map(item => [item.value, item.label]));
const toneByCategory = Object.fromEntries(CATEGORIES.map(item => [item.value, item.tone]));
const text = value => typeof value === 'string';
const validId = value => (text(value) && Boolean(value.trim())) || (typeof value === 'number' && Number.isFinite(value));

export function decodeArchive(raw) {
  if (!raw || !Array.isArray(raw.works)) throw new Error('작품 자료의 형식이 올바르지 않아요. 기존 자료는 변경하지 않았어요.');
  if (Array.isArray(raw.memories) && Array.isArray(raw.reviews)) throw new Error('감상 자료 형식이 중복돼 있어요. 연결 형식을 확인해 주세요.');
  const legacy = Array.isArray(raw.memories);
  const rows = legacy ? raw.memories : raw.reviews;
  if (!Array.isArray(rows)) throw new Error('감상 기록 자료를 찾을 수 없어요.');
  const works = raw.works.map(item => {
    if (!item || !validId(item.id) || !text(item.title) || !text(item.genre)) throw new Error('잘못된 작품 자료가 있어요.');
    const category = legacy ? categoryByLabel[item.type] : item.category;
    if (!labelByCategory[category]) throw new Error('알 수 없는 콘텐츠 유형이 있어요.');
    return { id: String(item.id), title: item.title, category, genre: item.genre };
  });
  const workIds = new Set(works.map(item => item.id));
  if (workIds.size !== works.length) throw new Error('작품 ID가 중복돼 있어요.');
  const reviews = rows.map(item => {
    if (!item || !validId(item.id) || !validId(item.workId) || !workIds.has(String(item.workId))) throw new Error('연결된 작품이 없는 기록 또는 잘못된 기록이 있어요.');
    const viewedAt = legacy ? item.date : item.viewedAt;
    if (!text(viewedAt) || !isValidDate(viewedAt)) throw new Error('올바르지 않은 감상 날짜가 있어요.');
    const rating = item.rating ?? null;
    if (rating !== null && (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 0.5 || rating > 5 || !Number.isInteger(rating * 2))) throw new Error('올바르지 않은 별점이 있어요.');
    const shortReview = (legacy ? item.quote : item.shortReview) ?? '';
    const story = (legacy ? item.body : item.story) ?? '';
    const photoUrl = (legacy ? item.photo : item.photoUrl) ?? '';
    if (![shortReview, story, photoUrl].every(text)) throw new Error('감상 기록의 문자열 형식이 올바르지 않아요.');
    return { id: String(item.id), workId: String(item.workId), viewedAt, rating, shortReview, story, photoUrl };
  });
  if (new Set(reviews.map(item => item.id)).size !== reviews.length) throw new Error('기록 ID가 중복돼 있어요.');
  return { works, reviews, legacy };
}

function reviewToWire(draft, legacy) {
  return legacy ? { date: draft.viewedAt, rating: draft.rating, quote: draft.shortReview, body: draft.story, photo: draft.photoUrl } : { ...draft };
}

// Figma 저장 원본을 보존하는 B 연결부. A/C도 같은 Context를 읽을 수 있다.
export function createArchiveBridge({ getStorage, makeId = prefix => `${prefix}-${crypto.randomUUID()}`, initialData = figmaSeed }) {
  let snapshot;
  const listeners = new Set();
  const notify = () => listeners.forEach(listener => listener());
  function read() {
    const storage = getStorage();
    const saved = storage.getItem(ARCHIVE_KEY);
    const raw = saved === null ? initialData : JSON.parse(saved);
    return { raw, ...decodeArchive(raw), storage };
  }
  function refresh() {
    try {
      const data = read();
      snapshot = { works: data.works, reviews: data.reviews, isLoading: false, error: '' };
    } catch {
      snapshot = { works: snapshot?.works || [], reviews: snapshot?.reviews || [], isLoading: false, error: '저장된 자료를 읽지 못했어요. 저장소 접근 권한과 자료 형식을 확인해 주세요. 기존 자료는 변경하지 않았어요.' };
    }
    notify();
  }
  function write(kind, idOrWork, draft) {
    let source;
    try { source = read(); } catch { throw new Error('기존 자료를 읽을 수 없어 저장을 중단했어요. 입력 내용은 유지됩니다.'); }
    const { raw, works, reviews, legacy, storage } = source;
    const rowsKey = legacy ? 'memories' : 'reviews';
    let next = { ...raw, works: [...raw.works], [rowsKey]: [...raw[rowsKey]] };
    let result;
    if (kind === 'create') {
      const workId = makeId('work');
      const reviewId = makeId('review');
      if ([workId, reviewId].some(value => !validId(value)) || works.some(item => item.id === String(workId)) || reviews.some(item => item.id === String(reviewId))) throw new Error('새 기록 ID가 중복돼 저장하지 못했어요. 다시 시도해 주세요.');
      const work = legacy ? { id: String(workId), title: idOrWork.title, type: labelByCategory[idOrWork.category], genre: idOrWork.genre, tone: toneByCategory[idOrWork.category] } : { ...idOrWork, id: String(workId) };
      const review = { ...reviewToWire(draft, legacy), id: String(reviewId), workId: String(workId) };
      next.works.push(work);
      next[rowsKey].push(review);
      result = { workId: String(workId), reviewId: String(reviewId) };
    } else if (kind === 'add') {
      const original = raw.works.find(item => String(item.id) === idOrWork);
      if (!original) throw new Error('작품이 삭제됐거나 존재하지 않아요. 저장하지 않았어요.');
      const reviewId = makeId('review');
      if (!validId(reviewId) || reviews.some(item => item.id === String(reviewId))) throw new Error('기록 ID가 중복됐어요.');
      next[rowsKey].push({ ...reviewToWire(draft, legacy), id: String(reviewId), workId: original.id });
      result = { reviewId: String(reviewId) };
    } else if (kind === 'update') {
      const previous = reviews.find(item => item.id === idOrWork);
      if (!previous) throw new Error('기록이 삭제됐거나 존재하지 않아요. 새 기록으로 만들지 않았어요.');
      next[rowsKey] = raw[rowsKey].map(item => String(item.id) === idOrWork ? { ...item, ...reviewToWire(draft, legacy), id: item.id, workId: item.workId } : item);
    } else throw new Error('알 수 없는 저장 요청이에요.');
    const checked = decodeArchive(next);
    try { storage.setItem(ARCHIVE_KEY, JSON.stringify(next)); }
    catch { throw new Error('저장 공간이 부족하거나 저장이 차단됐어요. 사진 크기를 줄이거나 브라우저 설정을 확인해 주세요. 입력 내용은 유지됩니다.'); }
    snapshot = { works: checked.works, reviews: checked.reviews, isLoading: false, error: '' };
    notify();
    return result;
  }
  refresh();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    refresh,
    createWorkWithReview: (work, review) => write('create', work, review),
    addReview: (workId, review) => write('add', workId, review),
    updateReview: (reviewId, review) => write('update', reviewId, review),
  };
}
