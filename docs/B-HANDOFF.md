# B 기능 인계

기준 main: 3f99e6c07190405e2cedb0194e5320657e6d2257 / 로컬 브랜치: feat/b-record
작업 이슈: https://github.com/newuser1002-bot/my-archive/issues/1
인계 PR: https://github.com/newuser1002-bot/my-archive/pull/2

## 담당 범위
작품 등록+첫 기록, 재감상 추가, 감상 기록 수정, 사진·입력·취소·오류 처리를 구현했다. 홈·상세·타임라인·삭제·공유·통계는 구현하지 않았다. App에 저장 연결 Provider를 추가하고 이동 보호를 위해 createBrowserRouter/RouterProvider로 초기화를 변경했다. 기존 주소·Layout·다른 담당 페이지는 유지했다.

## 실행 및 검사
```text
npm ci --ignore-scripts
npm run dev -- --host 127.0.0.1
npm run lint
npm run build
node --test tests/b-record.test.mjs tests/b-bridge.test.mjs
```

실제 페이지:
- /works/new : 작품+첫 기록
- /works/:workId/reviews/new : 재감상 추가
- /reviews/:reviewId/edit : 기록 수정
- 저장 후 /works/:workId 로 이동. C 상세는 현재 임시 화면이며 B가 대신 구현하지 않았다.

## 제공된 A 자료와 연결한 방식
Figma 원본의 archive-data-v2 저장 형식을 보존하는 archiveBridge.js를 추가하고 ArchiveBridgeProvider로 App에 연결했다. 화면에서만 GitHub RULES 이름으로 변환한다.

| Figma 저장 | 팀 화면 |
| --- | --- |
| id 숫자/문자열 | id 문자열 |
| type 한글 | category: movie/drama/book/game |
| memories | reviews |
| date | viewedAt |
| quote | shortReview |
| body | story |
| photo | photoUrl |

- 기존 숫자 ID·추가 속성·저장 형식은 유지한다. 이미 팀의 works/reviews 형식이면 그 형식으로 저장한다.
- 저장 자료가 없을 때만 원본4작품/10기록 샘플 표시. 기존 자료를 초기화하지 않는다.
- 작품+첫 기록을 한 setItem으로 저장하고 성공 뒤에만 상태를 갱신한다.
- 손상 JSON·중복 ID·연결 없는 기록·접근 차단은 안내하고 덮어쓰지 않는다. 저장 공간 부족 시 입력 보존.
- storage 이벤트와 저장 직전 최신 조회로 다른 탭 변경을 반영한다. 정확히 동시 쓰기의 서버 수준 충돌 제어는 보장하지 않는다.
- 실제 데이터/사진은 브라우저 저장이며 기기 간 동기화가 아니다.
- 같은 origin의 저장 자료만 읽는다. Figma 미리보기 등 다른 주소의 브라우저 자료를 자동으로 가져오지는 않는다.

## C가 사용하는 규격
C 파일 기준 예시:
```jsx
import { useBArchive } from '../b-shared/archiveContext';
const { works, reviews, error, isLoading,
  createWorkWithReview, addReview, updateReview, refresh } = useBArchive();
```

| 함수 | 입력·결과 |
| --- | --- |
| createWorkWithReview(workDraft, reviewDraft) | ID 생성 및 저장, {workId,reviewId} 반환 |
| addReview(workId, reviewDraft) | 작품 복제 없이 추가, {reviewId} 반환 |
| updateReview(reviewId, reviewDraft, expectedReview?) | 기존 id/workId 유지. B는 편집 시작 시 원본을 세 번째 인자로 전달해 다른 탭 변경 시 저장 중단 |
| refresh() | 현재 저장 자료 재조회 |

workDraft = {title,category,genre}.
reviewDraft = {viewedAt,rating,shortReview,story,photoUrl}.
실패 시 Error를 던진다. B 폼은 동기/Promise 모두 처리한다.
C의 기록 추가 버튼은 /works/:workId/reviews/new, 수정 버튼은 /reviews/:reviewId/edit로 연결한다. ID는 encodeURIComponent한다. 저장 후 location.state.recordSaved=true를 전달한다.
C는 Context의 최신 reviews를 읽으면 된다. 삭제는 C 담당으로 구현하지 않았다. A의 별도 공통 저장 모듈이 생기면 같은 Context 규격으로 연결부를 교체할 수 있다.

## 입력 기준
- 작품명·유형·유형별 장르·날짜 필수. 영화 기본 선택, 유형 변경 시 장르 초기화.
- 별점/한줄평/사진/이야기 선택. 별점 미선택 null, 선택 문자열은 빈 문자열.
- 새 별점은1~5점 버튼. 기존4.5 등 반점은 명시적으로 변경하지 않으면 보존.
- 새 한줄평80자 제한. 기존 초과 기록은 자동 자르지 않으며 그대로 유지하거나 한줄평 변경 시80자 이내로 정리.
- 새 날짜는 브라우저의 로컬 날짜, 수정은 원래 날짜. 유효 날짜를 검사하며 미래 날짜는 별도 제한하지 않음.
- 사진1장 JPG/PNG/WebP5MB 이하. 최대 변1600px/JPEG 약1MB 이하로 전처리. 임시 Blob URL만 영구 저장하지 않는다.
- 공백·중복 클릭·없는 ID·로딩/읽기 오류·저장 실패 처리.
- 미저장 글/사진 및 저장·사진 처리 중에는 useBlocker로 앱 내부 이동·라우터 방문 기록 이동을 확인한다. 저장 성공은 확인 없이 상세로 이동하며, 새로고침/닫기는 beforeunload 경고를 사용한다. 앱 외부로 나가는 문서 이동은 브라우저 정책을 따른다.
- RecordSession은 작성 시작 후 저장소 오류·대상 삭제에도 폼과 초안을 유지하고 저장만 차단한다. 새 주소에서 처음부터 없는 대상은 부재 안내다. 열린 세션 보존이며 영구 자동 초안 저장은 아니다.

## 검증
자동35개 테스트 및 lint/build/diff 검사 통과. 10월30일 전체 재검증 내역은 B-VERIFICATION.md 참고.
실제 앱에서 기존4.5점 유지 저장·작품+첫 기록 생성·C 경로 이동·재감상·사진 저장/복원·수정/재조회 확인.
독립 검증으로 실패 복구·사진 교체/제거·취소·연속 클릭·장르/80자 제한·320/390px를 확인했다. 상세는 B-VERIFICATION.md 참고.

개발용 결과 확인 페이지(실제 C 구현이 아님):
- /b-preview.html#/ : 별도 검증 키 archive:b-only-preview:v1
- /b-preview.html?store=shared#/ : 실제 archive-data-v2 연결 결과
배포 빌드의 진입점에는 포함하지 않는다.

## 인계 상태
B 소스·연결·로컬 검증 완료, GitHub 이슈#1 생성 완료.
2026-10-31 사용자 ‘전달’ 지시에 따라 feat/b-record 업로드 및 PR #2 생성을 완료했다. C는 이 브랜치를 기준으로 이어서 작업하거나 팀의 검토·병합 절차를 거쳐 main에서 시작할 수 있다. main 병합·배포는 하지 않았다. 최종 ZIP은 해당 브랜치의 최신 커밋으로 생성한다.
공통 배경/폭은 Layout 유지. D의 공통 별점·아이콘 제공 시 B 전용 UI 교체 가능.
