// A가 제공한 Figma Make 원본 Icon에서 B에 필요한 경로만 재사용한다.
// D의 공통 아이콘이 제공되면 이 B 전용 컴포넌트를 교체할 수 있다.
export default function RecordIcon({ name, size = 20 }) {
  const paths = {
    arrow: <path d="m15 18-6-6 6-6" />,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" /></>,
    camera: <><path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" /><circle cx="12" cy="12.5" r="3.5" /></>,
    film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" /></>,
    game: <><path d="M8.5 8h7a5.5 5.5 0 0 1 5.2 7.3l-.7 2a2.3 2.3 0 0 1-4 .6L14.5 16h-5l-1.6 1.9a2.3 2.3 0 0 1-4-.6l-.7-2A5.5 5.5 0 0 1 8.5 8Z" /><path d="M7 12v3M5.5 13.5h3M16 12.5h.01M18 14.5h.01" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />,
    tv: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="m8 2 4 4 4-4" /></>,
  };
  return <svg aria-hidden="true" className="b-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
