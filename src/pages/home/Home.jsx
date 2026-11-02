// 홈 화면 작품,감상 개수와 작품 목록 표시
import { useBArchive } from "../b-shared/archiveContext";   // 공통 데이터를 사용하는 함수 가져오기
import { Link } from "react-router-dom"; // 클릭으로 화면을 이동하는 컴포넌트
import "./Home.css";    // 홈 화면 전용 CSS 불러오기
import logo from "../../assets/logo.png";

export default function Home() {

    // 공통 데이터에서 작품 목록과 감상 기록 목록 가져오기
    const { works, reviews } = useBArchive();

    // 작품중에서 별점이 있는 기록만 고른다.
    const ratedReviews = reviews.filter((review) => review.rating !== null);

    // 별점의 합계를 구한다.
    const totalRating = ratedReviews.reduce((sum, review) => sum + review.rating, 0);

    // 평균 별점을 구한다.
    const averageRating = ratedReviews.length === 0 ? "별점을 매겨주세요" : (totalRating / ratedReviews.length).toFixed(1);

    return (
        <main className="home-page">
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>

            {/* 홈 상단 : 로고 및 프로필 버튼 */}
            <header className="home-header">
                <div className="home-font_header">
                    <img src={logo} className="home-logo"/> 
                    <span>나만의 Archive</span>
                </div>
                <span className="home-profile">나</span>
            </header>

            <div className="home-intro">
            <p className="home-intro-small">MY MEMORY ARCHIVE</p>
            <p className="home-intro-large">오늘도 소중한 시간을 기록해 볼까요?</p>
            <p className="home-intro-middle">작품과 함께한 순간을 차곡차곡 모아두었어요</p>
            </div>


            <p>작품 {works.length}개</p>
            <p>감상 기록 {reviews.length}개</p>
            <p>평균 별점 {averageRating}</p>

            {/* 작품들 제목 출력 */}
            <ul>
                {works.map((work) => (
                    <li key={work.id}>
                        {/* 현재 작품 ID를 이용해 해당 작품 상세 주소로 이동 */}
                        <Link to={"/works/" + work.id}>
                        {work.title}
                        </Link>
                    </li>
                ))}
            </ul>
            </div>
        </main>
    );
}