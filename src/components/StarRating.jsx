// 공통 별점 표시 컴포넌트 (D 담당)
// value: 0.5 단위 숫자 또는 null(별점 없음), 홈·상세·통계 등에서 같이 사용한다.
import RecordIcon from '../pages/b-shared/RecordIcon';
import './common.css';

export default function StarRating({ value, size = 14, showNumber = true }) {
  if (value === null || value === undefined) {
    return <span className="star-rating star-rating-empty">별점 없음</span>;
  }

  return (
    <span className="star-rating" role="img" aria-label={`별점 5점 만점에 ${value}점`}>
      {[1, 2, 3, 4, 5].map(n => {
        // 별 하나가 채워진 비율: 1(가득), 0.5(반), 0(빈 별)
        const fill = value >= n ? 1 : value >= n - 0.5 ? 0.5 : 0;
        return (
          <span className="star" key={n} style={{ width: size, height: size }}>
            <span className="star-bg"><RecordIcon name="star" size={size} /></span>
            <span className="star-fg" style={{ width: `${fill * 100}%` }}>
              <RecordIcon name="star" size={size} />
            </span>
          </span>
        );
      })}
      {showNumber && <b className="star-number">{value.toFixed(1)}</b>}
    </span>
  );
}
