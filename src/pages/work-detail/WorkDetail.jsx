import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ellipsis, Pencil, Plus, Share2, Trash2 } from 'lucide-react';
import StarRating from '../../components/StarRating';
import { useBArchive } from '../b-shared/archiveContext';
import { describeWork } from './workDetailModel';
import './WorkDetail.css';

function ReviewPhoto({ src }) {
  const [failed, setFailed] = useState(false);
  if (!src) return null;
  if (failed) return <p className="c-muted">사진을 불러오지 못했어요.</p>;

  return <img className="c-review-photo" src={src} alt="감상 기록에 첨부한 사진" loading="lazy" onError={() => setFailed(true)} />;
}

function WorkTimeline({ archive, work }) {
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const timeline = useRef(null);
  const reviews = archive.reviews.filter(review => review.workId === work.id)
    .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt));
  const summary = describeWork(work, reviews);
  const workPath = `/works/${encodeURIComponent(work.id)}`;

  function requestDelete(review) {
    setPending(review);
    setError('');
    dialog.current.showModal();
  }

  function confirmDelete() {
    try {
      archive.deleteReview(pending);
      dialog.current.close();
      setMessage('감상 기록을 삭제했어요.');
      timeline.current.focus();
    } catch (failure) {
      setError(failure.message);
      archive.refresh();
    }
  }

  return (
    <main className="c-page">
      <nav className="c-row" aria-label="작품 상세 이동">
        <Link to="/"><ArrowLeft size={16} aria-hidden="true" /> 보관함</Link>
        <Link to={`${workPath}/share`}><Share2 size={16} aria-hidden="true" /> 공유하기</Link>
      </nav>
      <header className="c-hero">
        <p className="c-meta">{[summary.category, summary.genre].filter(Boolean).join(' · ')}</p>
        <h1 className="title-font">{work.title}</h1>
        <div className="c-summary">
          <span>감상 {summary.count}회</span>
          <span>평균 {summary.rating === null ? '별점 없음' : `★ ${summary.rating.toFixed(1)}`}</span>
        </div>
      </header>
      <section aria-labelledby="c-timeline-heading">
        <div className="c-row c-section-heading">
          <h2 id="c-timeline-heading" ref={timeline} tabIndex={-1}>감상 기록</h2>
          <Link className="c-button c-primary" to={`${workPath}/reviews/new`}><Plus size={16} aria-hidden="true" /> 기록 추가</Link>
        </div>
        <p className="c-status" role="status">{message}</p>
        {reviews.length === 0 ? <p className="c-panel">아직 감상 기록이 없어요.</p> : (
          <ol className="c-timeline">
            {reviews.map((review, index) => (
              <li key={review.id}>
                <article className="c-panel">
                  <header className="c-row">
                    <h3>{reviews.length - index}회차 <time dateTime={review.viewedAt}>{review.viewedAt.replaceAll('-', '. ')}</time></h3>
                    <details className="c-review-actions">
                      <summary aria-label={`${reviews.length - index}회차 기록 메뉴`}><Ellipsis size={21} aria-hidden="true" /></summary>
                      <div>
                        <Link to={`/reviews/${encodeURIComponent(review.id)}/edit`}><Pencil size={15} aria-hidden="true" /> 수정</Link>
                        <button type="button" onClick={() => requestDelete(review)}><Trash2 size={15} aria-hidden="true" /> 삭제</button>
                      </div>
                    </details>
                  </header>
                  <StarRating value={review.rating} />
                  {review.shortReview && <p className="c-quote">{review.shortReview}</p>}
                  {review.story && <p className="c-story">{review.story}</p>}
                  <ReviewPhoto key={review.photoUrl} src={review.photoUrl} />
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
      <dialog className="c-dialog" ref={dialog} aria-labelledby="c-delete-heading">
        <h2 id="c-delete-heading">감상 기록을 삭제할까요?</h2>
        <p>{pending?.viewedAt} 감상 기록을 삭제합니다. 작품은 보관함에 남아요.</p>
        {error && <p role="alert" className="c-error">{error}</p>}
        <form className="c-dialog-actions" method="dialog">
          <button className="c-button" value="cancel">취소</button>
          <button className="c-button c-danger" type="button" onClick={confirmDelete}><Trash2 size={15} aria-hidden="true" /> 삭제</button>
        </form>
      </dialog>
    </main>
  );
}

export default function WorkDetail() {
  const { workId } = useParams();
  const archive = useBArchive();
  const work = archive?.works.find(item => item.id === workId);

  if (archive && !archive.error && work) return <WorkTimeline key={workId} archive={archive} work={work} />;

  return (
    <main className="c-page">
      <Link to="/"><ArrowLeft size={16} aria-hidden="true" /> 보관함</Link>
      <h1 className="title-font">{archive?.error ? '작품을 불러오지 못했어요.' : '작품을 찾을 수 없어요.'}</h1>
      {archive?.error && <button className="c-button" type="button" onClick={archive.refresh}>다시 불러오기</button>}
    </main>
  );
}
