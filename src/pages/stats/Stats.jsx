// 통계 화면 (/stats) - D 담당
// 공통 저장소(useBArchive)에서 works, reviews를 읽어 요약·유형별·장르별 통계를 보여준다.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBArchive } from '../b-shared/archiveContext';
import RecordIcon from '../b-shared/RecordIcon';
import Card from '../../components/Card';
import StarRating from '../../components/StarRating';
import { calcStats } from './statsModel';
import './Stats.css';

function Intro() {
  return (
    <section className="stats-intro">
      <span className="eyebrow">MY ARCHIVE IN NUMBERS</span>
      <h1 className="title-font">차곡차곡 쌓인<br />나만의 취향</h1>
      <p>기록해 온 시간 속에서 나의 감상을 발견해 보세요.</p>
    </section>
  );
}

export default function Stats() {
  const archive = useBArchive();
  const works = archive?.works;
  const reviews = archive?.reviews;
  const stats = useMemo(() => (works && reviews ? calcStats(works, reviews) : null), [works, reviews]);

  if (!archive || archive.isLoading) {
    return <main className="stats-page"><Intro /><p className="stats-message">통계를 불러오는 중이에요.</p></main>;
  }

  if (archive.error && !stats?.reviewCount) {
    return <main className="stats-page"><Intro /><p className="stats-message">{archive.error}</p></main>;
  }

  if (!stats || stats.reviewCount === 0) {
    return (
      <main className="stats-page">
        <Intro />
        <p className="stats-message">
          아직 기록이 없어요.<br />
          <Link className="stats-link" to="/works/new">첫 기록 남기러 가기</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="stats-page">
      <Intro />

      <section className="stats-summary" aria-label="요약">
        <div><b>{stats.workCount}</b><span>전체 작품</span></div>
        <div><b>{stats.reviewCount}</b><span>전체 감상 기록</span></div>
        <div>
          <b>{stats.average === null ? '-' : stats.average.toFixed(1)}</b>
          {stats.average !== null && <StarRating value={Math.round(stats.average * 2) / 2} size={11} showNumber={false} />}
          <span>평균 별점</span>
        </div>
      </section>

      <Card title="콘텐츠 유형별" note="감상 기록 기준" icon={<RecordIcon name="film" />}>
        {stats.byCategory.map(item => (
          <div className="stats-bar-row" key={item.value}>
            <span className="stats-bar-label"><i><RecordIcon name={item.icon} size={16} /></i>{item.label}</span>
            <div className="stats-bar-track"><span style={{ width: `${item.percent}%` }} /></div>
            <b>{item.count}</b>
          </div>
        ))}
      </Card>

      <Card title="장르별 현황" note="감상 기록 기준">
        {stats.byGenre.map(item => (
          <div className="stats-bar-row genre" key={item.label}>
            <span className="stats-bar-label">{item.label}</span>
            <div className="stats-bar-track"><span style={{ width: `${item.percent}%` }} /></div>
            <b>{item.count}</b>
          </div>
        ))}
      </Card>

      {stats.top && (
        <Card className="stats-note">
          <p>
            <strong>가장 많이 기록한 작품</strong>
            「{stats.top.work.title}」 {stats.top.count}번 감상했어요.
          </p>
        </Card>
      )}
    </main>
  );
}
