import { useRef, useState } from 'react';
import { HashRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import Layout from '../../src/layouts/Layout';
import WorkCreate from '../../src/pages/work-create/WorkCreate';
import ReviewCreate from '../../src/pages/review-create/ReviewCreate';
import ReviewEdit from '../../src/pages/review-edit/ReviewEdit';
import { BArchiveContext, useBArchive } from '../../src/pages/b-shared/archiveContext';
import { commitDemo, readDemo, seed } from './demoStore';
import '../../src/index.css';
import './preview.css';

export function DemoResult({ data }) {
  const { workId } = useParams();
  const work = data.works.find(item => item.id === workId);
  return <section className="b-demo-result"><h1>{work?.title || '작품 없음'}</h1><p>아래는 B 저장 결과를 확인하기 위한 검증 화면입니다. C의 상세·타임라인 구현물이 아닙니다.</p>
    {work && <Link to={`/works/${encodeURIComponent(workId)}/reviews/new`}>이 작품에 재감상 기록 추가</Link>}
    {data.reviews.filter(item => item.workId === workId).map(review => <article key={review.id}><p>{review.viewedAt} · {review.rating === null ? '별점 없음' : `${review.rating}점`}</p><h2>{review.shortReview || '한줄평 없음'}</h2><p style={{ whiteSpace: 'pre-wrap' }}>{review.story || '이야기 없음'}</p>{review.photoUrl && <img src={review.photoUrl} alt="저장된 테스트 사진" />}<Link to={`/reviews/${encodeURIComponent(review.id)}/edit`}>이 기록 수정</Link></article>)}<p><Link to="/">검증 목록으로</Link></p></section>;
}

// 실제 앱과 같은 저장 연결부를 읽는 검증용 화면. C 페이지는 변경하지 않는다.
export function SharedDemo() {
  const data = useBArchive();
  return <HashRouter><Layout><aside className="b-demo-bar"><strong>실제 저장 연결 검증 · archive-data-v2 · C 화면 아님</strong></aside><Routes>
    <Route path="/" element={<section className="b-demo-result"><h1>연결된 작품 목록</h1><Link to="/works/new">작품 등록</Link>{data.error && <p role="alert">{data.error}</p>}{data.works.map(work => <p key={work.id}><Link to={`/works/${encodeURIComponent(work.id)}`}>{work.title}</Link></p>)}</section>} />
    <Route path="/works/new" element={<WorkCreate />} /><Route path="/works/:workId/reviews/new" element={<ReviewCreate />} /><Route path="/reviews/:reviewId/edit" element={<ReviewEdit />} /><Route path="/works/:workId" element={<DemoResult data={data} />} />
  </Routes></Layout></HashRouter>;
}

export default function Demo() {
  const [loaded] = useState(() => {
    try { return { data: readDemo(window.localStorage), error: '' }; }
    catch { return { data: seed, error: '저장된 검증 자료를 읽지 못했습니다. 아래 초기화 버튼으로 B 검증 데이터만 초기화할 수 있습니다.' }; }
  });
  const [data, setData] = useState(loaded.data);
  const [failure, setFailure] = useState(false);
  const [slow, setSlow] = useState(false);
  const [sourceState, setSourceState] = useState('ready');
  const [loadError] = useState(loaded.error);
  const current = useRef(data);
  const makeId = prefix => `${prefix}-${crypto.randomUUID()}`;
  async function write(action, id, draft) {
    if (slow) await new Promise(resolve => setTimeout(resolve, 1200));
    if (failure) throw new Error('검증용 저장 실패입니다. 입력 내용이 유지되는지 확인하세요.');
    const next = commitDemo(window.localStorage, current.current, action, id, draft, makeId);
    current.current = next.data;
    setData(next.data);
    return next.result;
  }
  const archive = {
    ...data, isLoading: sourceState === 'loading', error: sourceState === 'error' ? '검증용 읽기 오류' : loadError,
    createWorkWithReview: (work, review) => write('create', work, review),
    addReview: (workId, review) => write('add', workId, review),
    updateReview: (reviewId, review) => write('update', reviewId, review),
  };
  return <HashRouter><BArchiveContext.Provider value={archive}><Layout>
    <aside className="b-demo-bar"><strong>B 전용 검증 모드 · 실제 A/C 기능 아님</strong><label><input type="checkbox" checked={failure} onChange={e => setFailure(e.target.checked)} />저장 실패 시험</label><label><input type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)} />느린 저장 시험</label><label>읽기 상태<select value={sourceState} onChange={e => setSourceState(e.target.value)}><option value="ready">정상</option><option value="loading">로딩</option><option value="error">읽기 오류</option></select></label>{loadError && <p>{loadError}</p>}</aside>
    <Routes><Route path="/" element={<section className="b-demo-result"><h1>B 입력 기능 검증</h1><p>A의 공통 저장 함수가 연결되기 전 B를 독립적으로 확인하는 공간입니다.</p><Link to="/works/new">새 작품과 첫 기록 작성</Link>{data.works.map(work => <p key={work.id}><Link to={`/works/${encodeURIComponent(work.id)}`}>{work.title} 저장 결과 보기</Link></p>)}<p><Link to="/works/missing/reviews/new">없는 작품 예외 확인</Link></p><p><Link to="/reviews/missing/edit">없는 기록 예외 확인</Link></p></section>} /><Route path="/works/new" element={<WorkCreate />} /><Route path="/works/:workId/reviews/new" element={<ReviewCreate />} /><Route path="/reviews/:reviewId/edit" element={<ReviewEdit />} /><Route path="/works/:workId" element={<DemoResult data={data} />} /></Routes>
  </Layout></BArchiveContext.Provider></HashRouter>;
}
