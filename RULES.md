# 공통 데이터 형식

각 화면은 아래 이름과 형식에 맞춰 더미 데이터를 사용합니다.

## 작품

목록 이름: works / 개별 항목: work

```js
{
  id: "work-1",            // 작품 ID: 문자열
  title: "리틀 포레스트",   // 작품명
  category: "movie",       // movie / drama / book / game
  genre: "드라마"           // 장르
}
```

## 감상 기록

목록 이름: reviews / 개별 항목: review

```js
{
  id: "review-1",              // 기록 ID: 문자열
  workId: "work-1",            // 연결된 작품 ID
  viewedAt: "2025-03-16",      // 감상 날짜: YYYY-MM-DD
  rating: 4.5,                // 별점: 숫자, 미선택은 null
  shortReview: "따뜻한 영화.",  // 한줄평
  story: "친구와 함께 봤다.",   // 그날의 이야기
  photoUrl: ""                 // 사진 주소
}
```

- 선택 입력인 문자열은 값이 없으면 ""을 사용합니다.