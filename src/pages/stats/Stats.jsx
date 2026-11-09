// 통계 화면 (/stats) - D 담당
// 공통 저장소(useBArchive)에서 works, reviews를 읽어 기간별 요약·월별 추이·유형별·장르별 통계를 보여준다.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBArchive } from '../b-shared/archiveContext';
import RecordIcon from '../b-shared/RecordIcon';
import Card from '../../components/Card';
import StarRating from '../../components/StarRating';
import { PERIODS, calcMonthly, calcStats, filterByPeriod } from './statsModel';
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
  // 선택한 기간. 바꾸면 아래 계산이 다시 실행되어 화면 전체가 바뀐다.
  const [period, setPeriod] = useState('all');
  // 화면을 연 시점을 기준으로 '올해'와 '최근 3개월'을 계산한다.
  const [now] = useState(() => new Date());

  const view = useMemo(() => {
    if (!works || !reviews) return null;
    const total = calcStats(works, reviews).reviewCount;
    const inPeriod = filterByPeriod(reviews, period, now);
    // 기간을 고르면 그 기간에 기록한 작품만 '작품 수'로 센다.
    const workIds = new Set(inPeriod.map(review => review.workId));
    const periodWorks = period === 'all' ? works : works.filter(work => workIds.has(work.id));
    return {
      total,
      stats: calcStats(periodWorks, inPeriod),
      monthly: calcMonthly(works, reviews, period, now),
    };
  }, [works, reviews, period, now]);

  if (!archive || archive.isLoading) {
    return <main className="stats-page"><Intro /><p className="stats-message">통계를 불러오는 중이에요.</p></main>;
  }

  if (archive.error && !view?.total) {
    return <main className="stats-page"><Intro /><p className="stats-message">{archive.error}</p></main>;
  }

  if (!view || view.total === 0) {
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

  const { stats, monthly } = view;
  const prefix = period === 'all' ? '전체 ' : '';
  const monthlyNote = period === 'year' ? `${now.getFullYear()}년` : period === '3months' ? '최근 3개월' : '최근 12개월';

  return (
    <main className="stats-page">
      <Intro />

      <div className="stats-filter" role="group" aria-label="기간 선택">
        {PERIODS.map(item => (
          <button
            key={item.value}
            type="button"
            aria-pressed={period === item.value}
            onClick={() => setPeriod(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {stats.reviewCount === 0 ? (
        <p className="stats-message">이 기간에는 기록이 없어요.<br />다른 기간을 선택해 보세요.</p>
      ) : (
        <>
          <section className="stats-summary" aria-label="요약">
            <div><b>{stats.workCount}</b><span>{prefix}작품</span></div>
            <div><b>{stats.reviewCount}</b><span>{prefix}감상 기록</span></div>
            <div>
              <b>{stats.average === null ? '-' : stats.average.toFixed(1)}</b>
              {stats.average !== null && <StarRating value={Math.round(stats.average * 2) / 2} size={11} showNumber={false} />}
              <span>평균 별점</span>
            </div>
          </section>

          <Card title="월별 감상 추이" note={monthlyNote}>
            <div className="month-chart" role="group" aria-label="월별 감상 기록 수">
              {monthly.months.map(item => (
                <div
                  className={`month-col${monthly.peak === item ? ' is-peak' : ''}`}
                  key={`${item.year}-${item.month}`}
                >
                  <span className="month-count">{item.count > 0 ? item.count : ''}</span>
                  <span
                    className={`month-bar${item.count === 0 ? ' is-empty' : ''}`}
                    style={{ height: item.count > 0 ? `${Math.max(item.ratio * 100, 6)}px` : '2px' }}
                  />
                  <span className="month-label">{item.month}월</span>
                </div>
              ))}
            </div>
            {monthly.peak && (
              <p className="month-insight">{monthly.peak.month}월에 가장 많이 기록했어요 ({monthly.peak.count}개)</p>
            )}
          </Card>

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
        </>
      )}
    </main>
  );
}
