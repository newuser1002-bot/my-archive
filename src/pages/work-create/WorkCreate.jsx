import { useBArchive } from '../b-shared/archiveContext';
import RecordPage, { RecordNotice } from '../b-shared/RecordPage';

export default function WorkCreate() {
  const archive = useBArchive();
  if (archive?.isLoading) return <RecordNotice title="작품 정보를 불러오고 있어요." loading>잠시만 기다려 주세요.</RecordNotice>;
  if (archive?.error) return <RecordNotice title="자료를 불러오지 못했어요.">입력 전에 공통 저장소 상태를 확인해 주세요.</RecordNotice>;
  return <RecordPage mode="work" archive={archive} />;
}
