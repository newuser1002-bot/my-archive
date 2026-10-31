import { useParams } from 'react-router-dom';
import { useBArchive } from '../b-shared/archiveContext';
import RecordSession from '../b-shared/RecordSession';

export default function ReviewEdit() {
  const { reviewId } = useParams();
  const archive = useBArchive();
  const review = archive?.reviews?.find(item => item.id === reviewId);
  const work = archive?.works?.find(item => item.id === review?.workId);
  return <RecordSession key={reviewId} mode="edit" review={review} work={work} archive={archive} />;
}
