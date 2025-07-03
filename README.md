# Vibe Coding 네비게이션

React + Naver Maps 기반의 실시간 교통상황 기반 경로 탐색 및 음성 인식 우회 경로 안내 웹 애플리케이션입니다.

## 🚀 주요 기능

### 📍 경로 탐색 및 교통 시각화
- **다중 경로 옵션**: traoptimal, trafast, tracomfort, trarecommend 등 다양한 경로 제공
- **실시간 교통 혼잡도**: 구간별 혼잡도 색상 표시 및 테이블 제공
- **인터랙티브 지도**: 구간 hover 시 지도 강조 효과 (그림자/입체 효과)
- **커스텀 마커**: 출발지/도착지 커스텀 마커 및 풀스크린 지도 UI
- **검색 자동완성**: 네이버 검색 API 기반 주소 자동완성

### 🎤 음성 인식 (STT) 연동
- **실시간 음성 녹음**: MediaRecorder API를 활용한 브라우저 내 녹음
- **음성 파일 업로드**: 기존 음성 파일 업로드 지원
- **Naver CLOVA Speech API**: 업로드 즉시 STT 처리 및 결과 반환
- **파일 재업로드**: 같은 파일 재선택 시에도 정상 작동

### 🚧 스마트 우회 경로 안내
- **상황 인식**: 도로명 + 상황 키워드 동시 감지 시 우회 안내
- **6가지 상황 분류**:
  - 🚨 **사고**: 사고, 추돌, 충돌, 접촉, 사고 발생 등
  - 🏛️ **집회/시위**: 집회, 시위, 행진, 집회 예정 등
  - 🚫 **도로통제**: 통제, 진입 금지, 차단, 일부 구간 통제 등
  - 🎉 **행사**: 행사, 마라톤, 퍼레이드, 이벤트 등
  - 🚧 **공사**: 공사, 보수, 차로 축소, 공사 구간 등
  - 🚗 **혼잡**: 지연, 지체, 정체 발생, 교통량 증가 등

- **자동 우회 경로 탐색**: 여러 waypoint 후보로 Directions API 반복 호출
- **UI/UX**: 로딩 스피너, 팝업 안내, 실패 시 전용 팝업

## 🛠️ 기술 스택

### Frontend
- **React 18**: 함수형 컴포넌트 및 Hooks
- **Naver Maps API**: 지도 렌더링 및 경로 표시
- **CSS3**: 반응형 디자인 및 애니메이션
- **MediaRecorder API**: 브라우저 내 음성 녹음

### Backend
- **Node.js**: Express.js 기반 프록시 서버
- **Naver Cloud Platform APIs**:
  - Naver Maps API (지도, 경로 검색)
  - Naver Search API (주소 검색)
  - Naver CLOVA Speech API (음성 인식)

### 개발 도구
- **Git**: 버전 관리
- **npm**: 패키지 관리

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/mingi-c/VibeCoding.git
cd VibeCoding
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Naver Cloud Platform API Keys
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Naver CLOVA Speech API Keys (선택사항)
CLOVA_SPEECH_API_KEY=your_clova_speech_api_key
CLOVA_SPEECH_API_URL=https://naveropenapi.apigw.ntruss.com/recog/v1/stt
```

### 4. 서버 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 🔑 API 키 설정

### Naver Cloud Platform 설정
1. [Naver Cloud Platform](https://www.ncloud.com/) 가입
2. Application 등록
3. 다음 서비스 활성화:
   - **Maps**: 지도 및 경로 검색
   - **Search**: 주소 검색
   - **CLOVA Speech**: 음성 인식 (선택사항)

### API 키 발급
- **Client ID**: Application 등록 시 자동 발급
- **Client Secret**: Application 등록 시 자동 발급

## 📁 프로젝트 구조

```
vibecoding/
├── public/
│   ├── index.html
│   └── solomon_logo.png
├── src/
│   ├── components/
│   │   ├── map/
│   │   │   └── MapContainer.js
│   │   ├── navigation/
│   │   │   ├── RouteInfo.js
│   │   │   └── SearchInput.js
│   │   ├── NaverMapView.js
│   │   └── NavigationControl.js
│   ├── services/
│   │   ├── geocodingService.js
│   │   └── naverApi.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── audio/          # 업로드된 음성 파일 저장
│   ├── stt/            # STT 결과 텍스트 저장
│   ├── App.js
│   ├── App.css
│   └── index.js
├── server.js           # Express 프록시 서버
├── package.json
└── README.md
```

## 🎯 주요 컴포넌트

### App.js
- 전체 애플리케이션 상태 관리
- 음성 업로드 및 STT 처리
- 우회 경로 안내 로직
- 팝업 및 로딩 상태 관리

### NaverMapView.js
- Naver Maps 렌더링
- 경로 표시 및 커스텀 마커
- 구간별 혼잡도 시각화
- hover 효과 및 애니메이션

### NavigationControl.js
- 출발지/도착지 검색
- 경로 옵션 선택
- 구간별 정보 테이블
- 실시간 교통 정보

## 🔧 주요 기능 상세

### 음성 인식 우회 경로 안내
1. **음성 입력**: 녹음 또는 파일 업로드
2. **STT 처리**: Naver CLOVA Speech API로 텍스트 변환
3. **상황 분석**: 도로명 + 상황 키워드 동시 감지
4. **우회 경로 탐색**: 여러 waypoint 후보로 경로 재탐색
5. **결과 표시**: 새로운 경로로 지도 갱신

### 실시간 교통 혼잡도 시각화
- **색상 코딩**: 혼잡도에 따른 구간별 색상 표시
- **테이블 정보**: 구간명, 거리, 예상 소요시간, 혼잡도
- **인터랙티브**: hover 시 지도 강조 효과

## 🚀 배포

### 로컬 개발 서버
```bash
npm start
```

### 프로덕션 빌드
```bash
npm run build
```

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**Vibe Coding 네비게이션** - 실시간 교통상황 기반 스마트 경로 안내 시스템
