import { CATEGORIES } from '../b-shared/recordModel.js';

export function describeWork(work, reviews) {
  const ratings = reviews.flatMap(review => review.rating === null ? [] : [review.rating]);
  return {
    title: work.title,
    category: CATEGORIES.find(category => category.value === work.category)?.label ?? '',
    genre: work.genre,
    count: reviews.length,
    rating: ratings.length
      ? Number((ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1))
      : null,
  };
}
