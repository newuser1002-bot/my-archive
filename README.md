# 나만의 Archive

React로 구현하는 모바일 중심 작품·감상 기록 웹앱.
백엔드 없이 더미 데이터를 사용합니다.

## 실행 방법

npm install
npm run dev

PowerShell에서 npm 실행이 차단되면 npm.cmd를 사용합니다.

## 담당

- A: 공통 Layout, 라우터, 저장 기능, 홈
- B: 작품 등록, 감상 기록 작성·수정
- C: 작품 상세, 기록 타임라인, 삭제, 공유
- D: 통계, 공통 카드·별점

## 페이지 주소

- / : 홈
- /works/new : 작품 등록
- /works/:workId : 작품 상세
- /works/:workId/reviews/new : 감상 작성
- /reviews/:reviewId/edit : 감상 수정
- /works/:workId/share : 공유
- /stats : 통계

## 공통 작업 규칙

- 각자 담당 페이지 폴더에서 작업합니다.
- 모바일 최대 너비와 전체 배경은 Layout에서 관리합니다.
- 페이지별 CSS는 해당 페이지 폴더에 작성합니다.
- 여러 화면에서 사용하는 부품은 src/components에 작성합니다.
- 공통 파일의 사용 방법을 변경할 때는 팀원과 공유합니다.

## 현재 상태

- 모바일 공통 Layout 적용
- 페이지별 임시 화면 및 라우터 연결