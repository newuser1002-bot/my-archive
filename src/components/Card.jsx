// 공통 카드 컴포넌트 (D 담당)
// title이 있으면 카드 위쪽에 제목 줄을 보여주고, 오른쪽에는 note(보조 설명)를 둔다.
import './common.css';

export default function Card({ title, note, icon, children, className = '' }) {
  return (
    <section className={`common-card ${className}`.trim()}>
      {title && (
        <header className="common-card-head">
          <h2>{icon}{title}</h2>
          {note && <span>{note}</span>}
        </header>
      )}
      {children}
    </section>
  );
}
