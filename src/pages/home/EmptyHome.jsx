import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import archiveemptyimage from "../../assets/archive-empty-image.png";
import "./EmptyHome.css";
import "./Home.css";


/* 초기 화면 */
export default function EmptyHome() {
    return (
        <main className="home-page">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* 홈 상단 : 로고 및 프로필 버튼 */}
                <header className="home-header">
                    <div className="home-font_header">
                        <img src={logo} className="home-logo" />
                        <span>나만의 Archive</span>
                    </div>
                </header>

                <div>
                    <img src={archiveemptyimage} className="home-preview-image" />
                </div>

                 {/* 소개 영역 */}
                <div className="home-intro">
                    <p className="home-intro-small">YOUR STORY STARTS HERE</p>
                    <p className="home-intro-large">아직 기록한 작품이 없어요</p>
                    <p className="home-intro-middle">마음에 오래 남은 작품이 있나요?</p>
                    <p className="home-intro-middle">그 작품과 함께한 당신의 시간을 남겨보세요.</p>
                </div>

                {/* 초기 홈 화면 하단 작품 기록 버튼 */}
                <div className="home-first-work-record-add">
                    <Link to="/works/new"> 🞢 첫 작품 기록하기</Link>
                </div>

                {/* 초기 화면 미리보기 */}
                <div className="home-preview-empty">
                    <Link to="/">샘플 Archive 둘러보기</Link>
                </div>
            </div>
        </main>
    )
}