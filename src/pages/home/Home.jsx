// 홈 화면 작품,감상 개수와 작품 목록 표시
import { useBArchive } from "../b-shared/archiveContext";   // 공통 데이터를 사용하는 함수 가져오기
import { Link } from "react-router-dom"; // 클릭으로 화면을 이동하는 컴포넌트

export default function Home() {

    // 공통 데이터에서 작품 목록과 감상 기록 목록 가져오기
    const { works, reviews } = useBArchive();

    return (
        <main>
            <h1>나만의 Archive</h1>

            <p>작품 {works.length}개</p>
            <p>감상 기록 {reviews.length}개</p>

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
        </main>
    );
}