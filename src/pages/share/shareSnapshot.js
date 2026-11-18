// The URL carries only the fields displayed on the card.
export function readShareSnapshot(value) {
  try {
    const { v, title, category, genre, count, rating } = JSON.parse(value);
    if (v !== 1 || ![title, category, genre].every(field => typeof field === 'string')
      || !title.trim() || !Number.isSafeInteger(count) || count < 0
      || (rating !== null && (!Number.isFinite(rating) || rating < 0.5 || rating > 5 || count === 0))) {
      return null;
    }
    return { title, category, genre, count, rating };
  } catch {
    return null;
  }
}
