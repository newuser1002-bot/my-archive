import { Link } from "react-router-dom";

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

            </div>
        </main>
    )
}