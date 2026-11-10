// 월간 결산 카드. 인스타그램 스토리 크기(9:16)로 저장되는 그림이라 크기는 360×640으로 고정한다.
// 이미지 파일 없이 CSS만으로 그린다. 글씨는 props로 받아서 바뀌어도 그림을 다시 만들 필요가 없다.
import { forwardRef } from 'react';
import './Recap.css';

// 별명 줄이 길면 글자 크기를 줄여서 카드 폭 안에 들어가게 한다.
function nicknameSize(lines) {
  const longest = Math.max(...lines.map(line => line.length));
  if (longest <= 6) return 46;
  if (longest <= 7) return 40;
  if (longest <= 8) return 35;
  return 30;
}

function Spark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" />
    </svg>
  );
}

const RecapCard = forwardRef(function RecapCard({ month, nickname, summary, featured, theme = 'pastel' }, ref) {
  return (
    <div className={`recap-card recap-theme-${theme}`} ref={ref}>
      <span className="recap-glow recap-glow-a" aria-hidden="true" />
      <span className="recap-glow recap-glow-b" aria-hidden="true" />
      <Spark className="recap-spark recap-spark-lg" />
      <Spark className="recap-spark recap-spark-sm" />

      <span className="recap-pill">{month}월의 나</span>

      <h3 className="recap-nick" style={{ fontSize: `${nicknameSize(nickname)}px` }}>
        {nickname[0]}
        <br />
        <span>{nickname[1]}</span>
      </h3>

      <p className="recap-summary">
        {summary[0]}
        <br />
        {summary[1]}
      </p>

      <ul className="recap-works">
        {featured.map(work => (
          <li key={work.id} className={`recap-work recap-work-${work.category}`}>
            <span className="recap-tag">{work.categoryLabel}</span>
            <b>{work.title}</b>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default RecapCard;
