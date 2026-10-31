export const PHOTO_INPUT_LIMIT = 5 * 1024 * 1024;
export const PHOTO_STORED_LIMIT = 1024 * 1024;

// 실제 저장소가 결정되기 전 B에서 제안하는 기본 제한. 저장은 A가 처리한다.
export async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('JPG, PNG, WebP 사진을 선택해 주세요.');
  }
  if (file.size > PHOTO_INPUT_LIMIT) throw new Error('사진은 5MB 이하로 선택해 주세요.');
  if (!file.size) throw new Error('비어 있는 파일은 사용할 수 없어요.');
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const candidate = new Image();
      const timeout = setTimeout(() => reject(new Error('사진을 읽는 시간이 초과됐어요. 다른 사진을 선택해 주세요.')), 15000);
      candidate.onload = () => { clearTimeout(timeout); resolve(candidate); };
      candidate.onerror = () => { clearTimeout(timeout); reject(new Error('사진을 읽을 수 없어요. 다른 파일을 선택해 주세요.')); };
      candidate.src = source;
    });
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('이 브라우저에서는 사진 처리를 지원하지 않아요.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      const bytes = Math.ceil((result.length - result.indexOf(',') - 1) * 3 / 4);
      if (bytes <= PHOTO_STORED_LIMIT) return result;
    }
    throw new Error('사진이 너무 복잡해 저장 크기를 줄이지 못했어요. 더 작은 사진을 선택해 주세요.');
  } finally { URL.revokeObjectURL(source); }
}
