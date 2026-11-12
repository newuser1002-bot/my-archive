// 통계 화면 맨 아래 '월간 결산' 영역 - D 담당
// 달을 고르면 결산 카드를 보여주고, 이미지로 저장하거나 공유할 수 있다.
import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../../components/Card';
import RecapCard from './RecapCard';
import { calcRecap, pickNickname, pickSummary, recapRange } from './recapModel';
import { shiftMonth } from './statsModel';
import { downloadBlob, fileNameFor, renderCardBlob, shareOrDownload } from './recapImage';
import { THEMES, loadTheme, saveTheme } from './recapTheme';
import './Recap.css';

const monthIndex = ({ year, month }) => year * 12 + (month - 1);

function Icon({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function RecapSection({ works, reviews, now }) {
  const range = useMemo(() => recapRange(works, reviews, now), [works, reviews, now]);
  // 사용자가 고른 달. 아직 고르지 않았다면 가장 최근에 기록이 있는 달을 보여준다.
  const [selected, setSelected] = useState(null);
  const current = selected ?? range.initial;
  const { year, month } = current;
  // 사용자가 고른 카드 디자인. 브라우저에 기억해 둔다.
  const [theme, setTheme] = useState(() => loadTheme());

  const recap = useMemo(() => calcRecap(works, reviews, year, month), [works, reviews, year, month]);
  const nickname = useMemo(() => pickNickname(recap), [recap]);
  const summary = useMemo(() => pickSummary(recap), [recap]);

  const cardRef = useRef(null);
  // 카드 이미지를 미리 만들어 둔다. 공유하기를 누르는 순간 바로 공유 창을 열기 위해서다.
  const pending = useRef(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const cardKey = nickname ? `${theme}|${year}-${month}|${nickname.join('/')}|${summary.join('/')}|${recap.featured.map(item => item.id).join(',')}` : '';
  useEffect(() => {
    pending.current = null;
    if (!cardKey) return undefined;
    // 달을 빠르게 넘기는 동안에는 만들지 않고, 멈춘 뒤에 한 번만 만든다.
    const timer = setTimeout(() => {
      if (cardRef.current) pending.current = renderCardBlob(cardRef.current).catch(() => null);
    }, 1200);
    return () => clearTimeout(timer);
  }, [cardKey]);

  function move(delta) {
    setSelected(shiftMonth(year, month, delta));
    setStatus('');
  }

  async function getBlob() {
    if (pending.current) {
      const ready = await pending.current;
      if (ready) return ready;
    }
    return renderCardBlob(cardRef.current);
  }

  async function run(action) {
    setBusy(true);
    setStatus('');
    try {
      const blob = await getBlob();
      const filename = fileNameFor(year, month);
      if (action === 'save') {
        downloadBlob(blob, filename);
        setStatus('이미지를 저장했어요.');
      } else {
        const result = await shareOrDownload(blob, filename);
        if (result === 'saved') setStatus('이 기기에서는 공유 창을 열 수 없어서 이미지를 저장했어요.');
      }
    } catch {
      setStatus('이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  const canPrev = monthIndex(current) > monthIndex(range.first);
  const canNext = monthIndex(current) < monthIndex(range.last);

  return (
    <Card title="월간 결산" note="한 달 단위 카드" className="recap-section">
      <div className="recap-stepper">
        <button type="button" aria-label="이전 달" disabled={!canPrev} onClick={() => move(-1)}>
          <Icon><path d="m15 18-6-6 6-6" /></Icon>
        </button>
        <span aria-live="polite">{year}년 {month}월</span>
        <button type="button" aria-label="다음 달" disabled={!canNext} onClick={() => move(1)}>
          <Icon><path d="m9 18 6-6-6-6" /></Icon>
        </button>
      </div>

      {!nickname ? (
        <p className="recap-empty">이 달에는 기록이 없어요.<br />다른 달을 선택해 보세요.</p>
      ) : (
        <>
          <div className="recap-stage">
            <div className="recap-scale">
              <RecapCard ref={cardRef} theme={theme} month={month} nickname={nickname} summary={summary} featured={recap.featured} />
            </div>
          </div>

          <div className="recap-themes" role="group" aria-label="카드 디자인 선택">
            {THEMES.map(item => (
              <button
                key={item.value}
                type="button"
                aria-pressed={theme === item.value}
                onClick={() => { setTheme(item.value); saveTheme(item.value); setStatus(''); }}
              >
                <i className={`recap-swatch recap-swatch-${item.value}`} aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="recap-actions">
            <button type="button" className="recap-save" disabled={busy} onClick={() => run('save')}>
              <Icon><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" /></Icon>{busy ? '만드는 중…' : '이미지로 저장'}
            </button>
            <button type="button" className="recap-share" disabled={busy} onClick={() => run('share')}>
              <Icon><path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6" /></Icon>{busy ? '만드는 중…' : '공유하기'}
            </button>
          </div>
          <p className="recap-status" role="status">{status}</p>
          <p className="recap-hint">
            휴대폰에서는 공유 창이 열려요.<br />
            인스타그램 스토리, 카카오톡 등으로 바로 공유해 보세요!<br />
            PC에서는 이미지가 저장돼요.
          </p>
        </>
      )}
    </Card>
  );
}
