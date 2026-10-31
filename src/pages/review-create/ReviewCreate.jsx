import { useParams } from 'react-router-dom';
import { useBArchive } from '../b-shared/archiveContext';
import RecordSession from '../b-shared/RecordSession';

export default function ReviewCreate() {
  const { workId } = useParams();
  const archive = useBArchive();
  const work = archive?.works?.find(item => item.id === workId);
  return <RecordSession key={workId} mode="review" work={work} archive={archive} />;
}
