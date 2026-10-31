// 주소에 따라 화면을 선택하는 라우터
import { createBrowserRouter, RouterProvider, Routes, Route } from "react-router-dom";

// 모바일 공통 레이아웃
import Layout from "./layouts/Layout";

// 담당자별 페이지
import Home from "./pages/home/Home";
import WorkCreate from "./pages/work-create/WorkCreate";
import ReviewCreate from "./pages/review-create/ReviewCreate";
import ReviewEdit from "./pages/review-edit/ReviewEdit";
import WorkDetail from "./pages/work-detail/WorkDetail";
import Share from "./pages/share/Share";
import Stats from "./pages/stats/Stats";
import ArchiveBridgeProvider from "./pages/b-shared/ArchiveBridgeProvider";

function AppContent() {
  return (
      <ArchiveBridgeProvider>
      <Layout>
        <Routes>
          {/* 홈 */}
          <Route path="/" element={<Home />} />

          {/* 작품 등록·감상 작성·수정 */}
          <Route path="/works/new" element={<WorkCreate />} />
          <Route
            path="/works/:workId/reviews/new"
            element={<ReviewCreate />}
          />
          <Route
            path="/reviews/:reviewId/edit"
            element={<ReviewEdit />}
          />

          {/* 작품 상세·공유 */}
          <Route path="/works/:workId" element={<WorkDetail />} />
          <Route path="/works/:workId/share" element={<Share />} />

          {/* 통계 */}
          <Route path="/stats" element={<Stats />} />

          {/* 등록되지 않은 주소에 대한 안내 */}
          <Route path="*" element={<p>페이지를 찾을 수 없습니다.</p>} />
        </Routes>
      </Layout>
      </ArchiveBridgeProvider>
  );
}

const router = createBrowserRouter([{ path: '*', element: <AppContent /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
