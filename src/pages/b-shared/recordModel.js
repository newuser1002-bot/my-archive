// RULES.md의 이름을 그대로 사용한다. ID 생성과 실제 저장은 A의 책임이다.
export const CATEGORIES = [
  { value: 'movie', label: '영화', icon: 'film', tone: 'forest' },
  { value: 'drama', label: '드라마', icon: 'tv', tone: 'sunset' },
  { value: 'book', label: '책', icon: 'book', tone: 'blue' },
  { value: 'game', label: '게임', icon: 'game', tone: 'island' },
];

// 제공된 Figma 원본의 유형별 목록. 저장 필드명은 GitHub RULES를 유지한다.
export const GENRES = {
  movie: ['드라마', '액션', '코미디', '로맨스', '스릴러', '공포', 'SF·판타지', '애니메이션'],
  drama: ['로맨스', '코미디', '범죄·스릴러', '액션', '판타지', '시대극', '가족·일상'],
  book: ['소설', '에세이', '자기계발', '인문·철학', '경제·경영', '과학·기술', '역사', '만화'],
  game: ['RPG', '액션', '어드벤처', '시뮬레이션', '전략', '퍼즐', '스포츠·레이싱', '캐주얼'],
};

export const SHORT_REVIEW_LIMIT = 80;

export function todayValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function initialReview(review) {
  return {
    viewedAt: review?.viewedAt ?? todayValue(),
    rating: review?.rating ?? null,
    shortReview: review?.shortReview ?? '',
    story: review?.story ?? '',
    photoUrl: review?.photoUrl ?? '',
  };
}

export function normalizeReview(review) {
  return {
    viewedAt: review.viewedAt,
    rating: review.rating === null ? null : Number(review.rating),
    shortReview: review.shortReview.trim(),
    story: review.story.trim(),
    photoUrl: review.photoUrl,
  };
}

export function validateRecord(work, review, includeWork, originalReview) {
  const errors = {};
  if (includeWork) {
    if (!work.title.trim()) errors.title = '작품명을 입력해 주세요.';
    if (!CATEGORIES.some(item => item.value === work.category)) errors.category = '콘텐츠 유형을 선택해 주세요.';
    if (!GENRES[work.category]?.includes(work.genre)) errors.genre = '콘텐츠 유형에 맞는 장르를 선택해 주세요.';
  }
  if (!isValidDate(review.viewedAt)) errors.viewedAt = '올바른 감상 날짜를 입력해 주세요.';
  if (review.shortReview.length > SHORT_REVIEW_LIMIT && review.shortReview !== originalReview?.shortReview) {
    errors.shortReview = '한줄평은 80자 이내로 작성해 주세요. 자세한 내용은 그날의 이야기에 남길 수 있어요.';
  }
  if (review.rating !== null && (typeof review.rating !== 'number' || !Number.isFinite(review.rating) || review.rating < 0.5 || review.rating > 5 || !Number.isInteger(review.rating * 2))) {
    errors.rating = '별점은 0.5~5점 또는 미선택으로 입력해 주세요.';
  }
  return errors;
}

export function safePhotoUrl(value) {
  if (typeof value !== 'string') return '';
  if (/^data:image\/(jpeg|png|webp);base64,[a-z\d+/=\s]+$/i.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : '';
  } catch { return ''; }
}
