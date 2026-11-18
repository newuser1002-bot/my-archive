import { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Link2 } from 'lucide-react';
import StarRating from '../../components/StarRating';
import { useBArchive } from '../b-shared/archiveContext';
import { downloadBlob } from '../stats/recapImage';
import { describeWork } from '../work-detail/workDetailModel';
import { readShareSnapshot } from './shareSnapshot';
import '../work-detail/WorkDetail.css';
import './Share.css';

function ShareCard({ summary, cardRef }) {
  return (
    <article className="c-share-card" ref={cardRef} aria-label="작품 공유 카드">
      <header>
        <p className="c-share-brand">나만의 Archive</p>
        <p className="c-meta">{[summary.category, summary.genre].filter(Boolean).join(' · ')}</p>
        <h2 className="title-font">{summary.title}</h2>
      </header>
      <dl>
        <div><dt>감상 횟수</dt><dd>{summary.count}회</dd></div>
        <div><dt>평균 별점</dt><dd><StarRating value={summary.rating} /></dd></div>
      </dl>
    </article>
  );
}

function SharePreview({ summary, workPath }) {
  const card = useRef(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showLink, setShowLink] = useState(false);
  const url = new URL(`${workPath}/share`, window.location.origin);
  url.searchParams.set('snapshot', JSON.stringify({ v: 1, ...summary }));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url.href);
      setMessage('공유 링크를 복사했어요.');
    } catch {
      setShowLink(true);
      setMessage('아래 주소를 선택해 복사해 주세요.');
    }
  }

  async function saveImage() {
    const element = card.current;
    setSaving(true);
    setMessage('');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: null });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG conversion failed');
      downloadBlob(blob, 'my-archive-work.png');
      setMessage('공유 카드 이미지를 저장했어요.');
    } catch {
      setMessage('이미지를 만들지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="c-page">
      <nav className="c-row" aria-label="공유 화면 이동"><Link to={workPath}><ArrowLeft size={16} aria-hidden="true" /> 작품 상세</Link></nav>
      <h1 className="title-font">작품 공유</h1>
      <ShareCard summary={summary} cardRef={card} />
      <p className="c-muted">링크를 받은 사람은 위 카드의 내용을 볼 수 있어요.</p>
      <div className="c-share-actions">
        <button className="c-button c-primary" type="button" onClick={copyLink}><Link2 size={16} aria-hidden="true" /> 링크 복사</button>
        <button className="c-button" type="button" disabled={saving} onClick={saveImage}>
          <Download size={16} aria-hidden="true" /> {saving ? '이미지 만드는 중…' : 'PNG 저장'}
        </button>
      </div>
      <p className="c-status" role="status">{message}</p>
      {showLink && <input className="c-share-link" aria-label="공유 링크" value={url.href} readOnly onFocus={event => event.target.select()} />}
    </main>
  );
}

export default function Share() {
  const { workId } = useParams();
  const [params] = useSearchParams();
  const archive = useBArchive();
  const workPath = `/works/${encodeURIComponent(workId)}`;

  if (params.has('snapshot')) {
    const summary = readShareSnapshot(params.get('snapshot'));
    return (
      <main className="c-page">
        <h1 className="title-font">공유된 작품</h1>
        {summary ? <ShareCard summary={summary} /> : <p role="alert">공유 링크를 읽을 수 없어요.</p>}
      </main>
    );
  }

  const work = archive?.works.find(item => item.id === workId);
  if (archive && !archive.error && work) {
    const reviews = archive.reviews.filter(review => review.workId === work.id);
    return <SharePreview key={workId} summary={describeWork(work, reviews)} workPath={workPath} />;
  }

  return (
    <main className="c-page">
      <Link to="/"><ArrowLeft size={16} aria-hidden="true" /> 보관함</Link>
      <h1 className="title-font">{archive?.error ? '작품을 불러오지 못했어요.' : '작품을 찾을 수 없어요.'}</h1>
      {archive?.error && <button className="c-button" type="button" onClick={archive.refresh}>다시 불러오기</button>}
    </main>
  );
}
