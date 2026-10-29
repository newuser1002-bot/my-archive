// 제공된 Figma Make의 기본 자료. 저장된 자료가 없을 때만 사용한다.
// 실제 브라우저 자료를 초기화하거나 덮어쓰는 코드가 아니다.
export const figmaSeed = {
  works: [
    { id: 1, title: '리틀 포레스트', type: '영화', genre: '드라마', tone: 'forest' },
    { id: 2, title: '나의 해방일지', type: '드라마', genre: '가족·일상', tone: 'sunset' },
    { id: 3, title: '불편한 편의점', type: '책', genre: '소설', tone: 'blue' },
    { id: 4, title: '모여봐요 동물의 숲', type: '게임', genre: '시뮬레이션', tone: 'island' },
  ],
  memories: [
    { id: 1, workId: 1, date: '2025-03-16', rating: 5, quote: '다시 돌아가고 싶은, 따뜻한 봄날 같은 영화.', body: '오랜만에 수진이와 작은 독립 영화관에 갔다. 영화가 끝난 뒤에도 한동안 자리를 뜨지 못했다. 우리도 잠시 쉬어가도 괜찮다는 이야기를 오래 나눴다.', photo: 'https://images.unsplash.com/photo-1721733258290-cac1a9204564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080' },
    { id: 2, workId: 1, date: '2024-11-02', rating: 4.5, quote: '계절이 바뀔 때마다 문득 생각나는 장면들.', body: '비가 조금씩 내리던 토요일. 집에서 따뜻한 차를 마시며 혼자 다시 봤다. 예전에는 보이지 않던 혜원의 마음이 이번에는 조금 더 선명하게 느껴졌다.', photo: '' },
    { id: 3, workId: 1, date: '2023-05-20', rating: 4, quote: '천천히 살아도 괜찮다고 말해준 첫 만남.', body: '학교 과제를 끝내고 우연히 보게 된 영화. 지친 마음에 작은 쉼표가 되어주었다.', photo: '' },
    { id: 4, workId: 2, date: '2025-02-08', rating: 5, quote: '견디는 마음을 조용히 안아준 이야기.', body: '늦은 밤 마지막 회를 보고 한참 동안 여운이 남았다.', photo: '' },
    { id: 5, workId: 2, date: '2024-08-11', rating: 4, quote: '평범한 하루를 다시 바라보게 됐다.', body: '대사 하나하나를 천천히 되새기며 다시 봤다.', photo: '' },
    { id: 6, workId: 3, date: '2025-01-12', rating: null, quote: '동네 편의점처럼 다정한 이야기.', body: '여행길 기차 안에서 끝까지 읽었다.', photo: '' },
    { id: 7, workId: 4, date: '2026-03-15', rating: 5, quote: '처음으로 섬을 꾸미기 시작한 날.', body: '작은 텐트 하나에서 시작한 섬 생활이 무척 설렜다.', photo: '' },
    { id: 8, workId: 4, date: '2025-06-20', rating: 4, quote: '오랜만에 접속해서 친구와 함께 놀았던 날.', body: '친구의 섬에 놀러 가서 사진을 많이 남겼다.', photo: '' },
    { id: 9, workId: 4, date: '2025-01-01', rating: 4, quote: '섬에서 함께 맞은 새해.', body: '주민들과 불꽃놀이를 보며 새해를 시작했다.', photo: '' },
    { id: 10, workId: 4, date: '2024-10-03', rating: null, quote: '아무 목적 없이 천천히 걸었던 저녁.', body: '파도 소리를 들으며 섬을 한 바퀴 돌았다.', photo: '' },
  ],
};
