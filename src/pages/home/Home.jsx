// 홈 화면 작품,감상 개수와 작품 목록 표시
import { useBArchive } from "../b-shared/archiveContext";   // 공통 데이터를 사용하는 함수 가져오기
import { Link } from "react-router-dom"; // 클릭으로 화면을 이동하는 컴포넌트
import "./Home.css";    // 홈 화면 전용 CSS 불러오기
import logo from "../../assets/logo.png";
import { CATEGORIES } from "../b-shared/recordModel";   //공통 콘텐츠 유형 목록 가져오기
import RecordIcon from "../b-shared/RecordIcon";

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* 홈 상단 : 로고 및 프로필 버튼 */}
                <header className="home-header">
                    <div className="home-font_header">
                        <img src={logo} className="home-logo" />
                        <span>나만의 Archive</span>
                    </div>
                    <span className="home-profile">나</span>
                </header>

                {/* 소개 영역 */}
                <div className="home-intro">
                    <p className="home-intro-small">MY MEMORY ARCHIVE</p>
                    <p className="home-intro-large">오늘도 소중한 시간을 기록해 볼까요?</p>
                    <p className="home-intro-middle">작품과 함께한 순간을 차곡차곡 모아두었어요</p>
                </div>

                {/* 나의 기록 카드 영역 */}
                <section className="home-my_record_card">
                    {/* 상단 영역 */}
                    <div className="home-my_record_card_header">
                        <h2>나의 기록</h2>
                        <Link to="/stats">통계 보기 &gt;</Link>
                    </div>

                    {/* 하단 영역 */}
                    <div className="home-my_record_card_body">
                        <div className="home-my_record_stat">
                            <strong>{works.length}</strong>
                            <span>작품</span>
                        </div>

                        <div className="home-my_record_stat">
                            <strong>{reviews.length}</strong>
                            <span>감상 기록</span>
                        </div>

                        <div className="home-my_record_stat">
                            <strong>{averageRating}</strong>
                            <span>평균 별점</span>
                        </div>
                    </div>
                </section>


                {/* 나의 작품 영역 */}
                <section className="home-works">
                    {/* 제목과 전체 작품 수 */}
                    <div className="home-works-header">
                        <h2>나의 작품</h2>
                        <span>총 {works.length}개</span>
                    </div>

                    {/* 작품 카테고리 */}
                    <div className="home-works-filters">
                        {/* 전체는 콘텐츠 유형이 아니라 따로 표시 */}
                        <button type="button">전체</button>

                        {/* 공통 유형 목록으로 버튼 생성 */}
                        {CATEGORIES.map((category) => (
                            <button type="button" key={category.value}>{category.label}</button>
                        ))}
                    </div>

                    {/* 작품 카드 목록 */}
                    <div className="home-work-grid">
                        {works.map((work) => {
                            const category = CATEGORIES.find((item) => item.value === work.category);

                            return (
                                <Link key={work.id} to={"/works/" + work.id} className="home-work-card">
                                    {/* 작품 표지 */}
                                    <div className={"home-work-cover home-work-cover-" + work.category}>
                                        <span>{work.title}</span>

                                        {/* 유형 정보가 있으면 아이콘과 이름 표시 */}
                                        {category && (
                                            <span className="home-work-badge">
                                                <RecordIcon name={category.icon} size={15}/>
                                                {category.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* 작품 표지 아래 정보 */}
                                    <div className="home-work-info">
                                        <strong>{work.title}</strong>
                                        <span>{work.genre} · {reviews.filter((review) => review.workId === work.id).length}번의 기록</span>
                                    </div>

                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* 홈 화면 하단 작품 기록 버튼 */}
                <div className="home-work-record-add">
                        <Link to="/works/new"> 🞢 새 작품 기록하기</Link>
                </div>

                
                



            </div>
        </main>
    );
}