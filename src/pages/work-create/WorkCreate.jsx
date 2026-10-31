import { useBArchive } from '../b-shared/archiveContext';
import RecordSession from '../b-shared/RecordSession';

export default function WorkCreate() {
  const archive = useBArchive();
  return <RecordSession mode="work" archive={archive} />;
}
