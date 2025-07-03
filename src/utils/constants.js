// API 관련 상수
export const API_ENDPOINTS = {
  NAVER_SEARCH: '/api/naver/search',
  NAVER_DIRECTIONS: '/api/naver/directions',
  LOCAL_SERVER: 'http://localhost:4000'
};

// 네이버 지도 관련 상수
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 37.5665, lng: 126.9780 }, // 서울 시청
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 7,
  MAX_ZOOM: 18,
  ROUTE_COLORS: {
    driving: '#03c75a',
    walking: '#ff6b6b',
    transit: '#4ecdc4'
  }
};

// 검색 관련 상수
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  MAX_SUGGESTIONS: 10,
  PLACE_ICONS: {
    '01': '🚇', // 지하철역
    '02': '🏢', // 건물
    '03': '🍽️', // 음식점
    '04': '☕', // 카페
    '05': '🏥', // 병원
    '06': '🏪', // 편의점
    '07': '🏢', // 사무실
    '08': '🎓', // 학교
    '09': '🌳', // 공원
    '10': '🎭', // 관광지
    '11': '🏛️', // 문화시설
    '12': '🏛️', // 공공기관
    '13': '🏢', // 주거시설
    '14': '🚇', // 교통시설
  }
};

// 서울 주요 지역 좌표
export const SEOUL_AREAS = {
  '강남': [127.027, 37.498],
  '홍대': [126.924, 37.557],
  '명동': [126.985, 37.563],
  '잠실': [127.100, 37.513],
  '용산': [126.970, 37.554],
  '여의도': [126.939, 37.519],
  '종로': [126.978, 37.566],
  '마포': [126.908, 37.563],
  '송파': [127.105, 37.514],
  '동자동': [126.970, 37.554], // 용산역 근처
  '롯데': [127.100, 37.513]   // 잠실 롯데월드 근처
}; 