// 결산 카드를 PNG 이미지로 만들고, 저장하거나 공유하는 함수 모음.
import { toBlob } from 'html-to-image';

// 인스타그램 스토리 크기: 360×640 카드를 3배로 그려서 1080×1920 이미지를 만든다.
// skipFonts: 웹 글꼴(Pretendard)을 이미지 안에 넣는 작업이 매우 느려서 건너뛰고,
// 카드는 기기에 있는 글꼴(애플 SD 산돌고딕, 맑은 고딕 등)로 그린다. (Recap.css의 font-family 참고)
const OPTIONS = { width: 360, height: 640, pixelRatio: 3, skipFonts: true };

let warmedUp = false;

// DOM 요소를 PNG Blob으로 바꾼다.
// 아이폰 사파리는 첫 번째 변환에서 이미지가 빈칸으로 나올 때가 있어서, 맨 처음에만 한 번 미리 돌린다.
export async function renderCardBlob(node) {
  if (!warmedUp) {
    await toBlob(node, OPTIONS);
    warmedUp = true;
  }
  const blob = await toBlob(node, OPTIONS);
  if (!blob) throw new Error('이미지를 만들지 못했어요.');
  return blob;
}

export function fileNameFor(year, month) {
  return `my-archive-${year}-${String(month).padStart(2, '0')}.png`;
}

// 이미지 파일을 기기에 내려받는다.
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 공유 창(Web Share API)이 이미지 파일 공유를 지원하는지 확인한다.
export function canShareImage(blob, filename) {
  if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) return false;
  const file = new File([blob], filename, { type: 'image/png' });
  return navigator.canShare({ files: [file] });
}

// 공유 창을 열고 'shared', 지원하지 않으면 이미지를 저장하고 'saved', 사용자가 닫으면 'canceled'를 돌려준다.
export async function shareOrDownload(blob, filename) {
  if (!canShareImage(blob, filename)) {
    downloadBlob(blob, filename);
    return 'saved';
  }
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    await navigator.share({ files: [file], title: '나의 월간 아카이브' });
    return 'shared';
  } catch (error) {
    // 사용자가 공유 창을 그냥 닫은 경우는 오류가 아니다.
    if (error?.name === 'AbortError') return 'canceled';
    throw error;
  }
}
