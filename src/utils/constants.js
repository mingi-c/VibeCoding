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
    'SW8': '🚇', // 지하철역
    'AD5': '🏢', // 건물
    'FD6': '🍽️', // 음식점
    'CE7': '☕', // 카페
    'HP8': '🏥', // 병원
    'PM9': '🏪', // 편의점
    'OL7': '🏢', // 사무실
    'PS3': '🎓', // 학교
    'PK6': '🌳', // 공원
    'AT4': '🎭', // 관광지
    'CT1': '🏛️', // 문화시설
    'AG2': '🏛️', // 공공기관
    'AD5': '🏢', // 주거시설
    'SW8': '🚇', // 교통시설
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