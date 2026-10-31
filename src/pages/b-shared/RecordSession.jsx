import { useState } from 'react';
import RecordPage, { RecordNotice } from './RecordPage';

// 첫 조회에 성공한 대상을 유지해 저장소 오류·삭제에도 초안을 제거하지 않는다.
export default function RecordSession({ mode, archive, work, review }) {
  const ready = archive && !archive.isLoading && !archive.error;
  const available = mode === 'work' || (work && (mode !== 'edit' || review));
  const [session, setSession] = useState(() => ready && available ? { work, review } : null);
  if (!session && ready && available) setSession({ work, review });
  if (session) {
    let blockedReason = '';
    if (!archive || archive.error) blockedReason = '저장소를 읽지 못했어요. 작성 내용은 유지됩니다. 저장소 상태가 복구되면 다시 저장해 주세요.';
    else if (archive.isLoading) blockedReason = '자료를 다시 확인하고 있어요. 작성 내용은 유지됩니다.';
    else if (!available) blockedReason = '다른 곳에서 작품이나 기록이 삭제됐어요. 작성 내용은 유지되지만 이 대상에는 저장할 수 없어요. 필요한 내용을 따로 보관해 주세요.';
    return <RecordPage mode={mode} archive={archive} work={session.work} review={session.review} blockedReason={blockedReason} />;
  }
  if (!archive) return <RecordNotice title="저장소 연결이 필요해요.">공통 저장 기능을 연결한 뒤 다시 시도해 주세요.</RecordNotice>;
  if (archive.isLoading) return <RecordNotice title="자료를 불러오고 있어요." loading>잠시만 기다려 주세요.</RecordNotice>;
  if (archive.error) return <RecordNotice title="자료를 불러오지 못했어요.">저장소 상태를 확인한 뒤 다시 시도해 주세요.</RecordNotice>;
  return <RecordNotice title="작품이나 기록을 찾을 수 없어요.">대상이 삭제됐거나 주소가 올바르지 않아요. 홈에서 다시 선택해 주세요.</RecordNotice>;
}
