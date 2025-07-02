# VibeCoding: Naver Maps 기반 경로 탐색/교통 시각화 웹앱

## 주요 기능
- **네이버 지도 기반 경로 탐색** (자동차 모드, Directions API)
- **출발지/도착지 검색 자동완성**
- **다양한 경로 옵션**(최적, 빠름, 편안) 제공 및 선택
- **실시간 교통 혼잡도 시각화** (구간별 색상)
- **구간별 상세 정보 테이블** (도로명, 거리, 혼잡도, 속도)
- **테이블 hover 시 지도 구간 강조** (그림자/입체 효과)
- **출발/도착 커스텀 마커** (이모지, 그라데이션, 그림자)
- **풀스크린 반응형 지도 UI, 줌/내비게이션 컨트롤**
- **Node.js 프록시 서버로 API 키 보안**

## 사용법
1. `npm install`
2. `.env` 파일에 네이버 API 키 설정
   - 예시:
     ```env
     REACT_APP_NAVER_CLIENT_ID=발급받은_ID
     REACT_APP_NAVER_CLIENT_SECRET=발급받은_SECRET
     ```
3. `npm start` (클라이언트: 3000번, 프록시 서버: 5000번)
4. 웹에서 출발지/도착지 검색 → 경로 옵션 선택 → 지도/테이블에서 교통 정보 확인

## 주요 기술 스택
- React
- Naver Maps JavaScript API, Directions API
- Node.js(Express) 프록시 서버
- CSS 모듈/직접 스타일링

## 폴더 구조
```
vibecoding/
  ├─ public/
  ├─ src/
  │   ├─ components/         # 지도, 경로, 검색, UI 컴포넌트
  │   │   ├─ map/
  │   │   ├─ navigation/
  │   │   └─ ...
  │   ├─ services/           # 네이버 API/지오코딩 서비스
  │   ├─ utils/              # 상수, 헬퍼 함수
  │   └─ ...
  ├─ server.js               # Node.js 프록시 서버
  └─ ...
```

## 개발/배포
- 개발: `npm start` (리액트 개발 서버 + 프록시 서버 동시 실행)
- 배포: `npm run build` 후 정적 파일 배포
- GitHub Actions 등 CI/CD 연동 가능

## 기타
- 네이버 API 키는 외부에 노출되지 않도록 주의하세요.
- 문의/기여: PR 또는 이슈 등록
