// 모든 페이지에서 사용하는 공통 화면 틀
// children에는 홈, 작품 등록, 상세 등의 페이지 내용이 들어간다.

export default function Layout({ children }) {
  return <div className="app-layout">{children}</div>;
}