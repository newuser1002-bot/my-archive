import { useParams } from 'react-router-dom';
import { useBArchive } from '../b-shared/archiveContext';
import RecordPage, { RecordNotice } from '../b-shared/RecordPage';

export default function ReviewCreate() {
  const { workId } = useParams();
  const archive = useBArchive();
  if (!archive) return <RecordNotice title="저장소 연결이 필요해요.">A의 공통 데이터 기능을 연결하면 기존 작품에 기록할 수 있어요.</RecordNotice>;
  if (archive.isLoading) return <RecordNotice title="작품을 불러오고 있어요." loading>잠시만 기다려 주세요.</RecordNotice>;
  if (archive.error) return <RecordNotice title="자료를 불러오지 못했어요.">공통 저장소 상태를 확인한 뒤 다시 시도해 주세요.</RecordNotice>;
  const work = archive.works?.find(item => item.id === workId);
  if (!work) return <RecordNotice title="작품을 찾을 수 없어요.">삭제된 작품이거나 주소가 올바르지 않아요. 홈에서 작품을 다시 선택해 주세요.</RecordNotice>;
  return <RecordPage key={workId} mode="review" work={work} archive={archive} />;
}
