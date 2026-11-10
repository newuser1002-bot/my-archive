// 결산 카드 디자인(테마) 목록과, 사용자가 고른 디자인을 브라우저에 기억하는 함수 (D 담당)
export const THEMES = [
  { value: 'pastel', label: '파스텔' },
  { value: 'neon', label: '네온' },
  { value: 'retro', label: '레트로' },
  { value: 'sticker', label: '스티커' },
];

const KEY = 'archive-recap-theme-v1';
const DEFAULT_THEME = THEMES[0].value;

export function isTheme(value) {
  return THEMES.some(theme => theme.value === value);
}

function getStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

// 저장된 디자인. 없거나 이상한 값이면 기본 디자인(파스텔)을 쓴다.
export function loadTheme(storage = getStorage()) {
  try {
    const saved = storage?.getItem(KEY);
    return isTheme(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme, storage = getStorage()) {
  if (!isTheme(theme)) return;
  try {
    storage?.setItem(KEY, theme);
  } catch {
    // 저장소를 쓸 수 없어도 이번 화면에서는 고른 디자인을 쓴다.
  }
}
