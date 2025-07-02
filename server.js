const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 4000;

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const REACT_APP_NAVER_MAP_NCP_KEY_ID = process.env.REACT_APP_NAVER_MAP_NCP_KEY_ID;
const REACT_APP_NAVER_MAP_NCP_KEY_SECRET = process.env.REACT_APP_NAVER_MAP_NCP_KEY_SECRET;

// 환경변수 설정 확인

app.use(cors());

// 현실적인 모킹 응답 생성 함수
function generateMockResponse(query) {
  const mockData = {
    '63빌딩': [
      {
        title: '63빌딩',
        address: '서울특별시 영등포구 여의대로 108',
        roadAddress: '서울특별시 영등포구 여의대로 108',
        mapx: '126.939',
        mapy: '37.519'
      }
    ],
    '강남역': [
      {
        title: '강남역',
        address: '서울특별시 강남구 강남대로 396',
        roadAddress: '서울특별시 강남구 강남대로 396',
        mapx: '127.027',
        mapy: '37.498'
      }
    ],
    '서울역': [
      {
        title: '서울역',
        address: '서울특별시 용산구 한강대로 405',
        roadAddress: '서울특별시 용산구 한강대로 405',
        mapx: '126.970',
        mapy: '37.554'
      }
    ],
    '홍대': [
      {
        title: '홍대입구역',
        address: '서울특별시 마포구 양화로 160',
        roadAddress: '서울특별시 마포구 양화로 160',
        mapx: '126.924',
        mapy: '37.557'
      }
    ],
    '명동': [
      {
        title: '명동',
        address: '서울특별시 중구 명동',
        roadAddress: '서울특별시 중구 명동',
        mapx: '126.985',
        mapy: '37.563'
      }
    ]
  };

  // 정확한 매칭이 있으면 해당 데이터 반환
  if (mockData[query]) {
    return { items: mockData[query] };
  }

  // 부분 매칭 검색
  const matchedItems = [];
  for (const [key, items] of Object.entries(mockData)) {
    if (key.includes(query) || query.includes(key)) {
      matchedItems.push(...items);
    }
  }

  // 매칭된 결과가 있으면 반환
  if (matchedItems.length > 0) {
    return { items: matchedItems };
  }

  // 기본 응답 (검색어가 없을 때)
  return {
    items: [
      {
        title: query,
        address: `서울특별시 강남구 ${query}`,
        roadAddress: `서울특별시 강남구 ${query}`,
        mapx: '127.027',
        mapy: '37.498'
      }
    ]
  };
}

app.get('/api/naver/search', async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });
  
  // API 키가 없거나 401 오류 시 테스트용 모킹 응답
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return res.json(generateMockResponse(query));
  }
  
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10&start=1&sort=random`;
  try {
    const response = await axios.get(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      return res.json(generateMockResponse(query));
    }
    res.status(500).json({ error: 'Naver API request failed', details: err.message });
  }
});

// 경로 검색 API 엔드포인트
app.get('/api/naver/directions', async (req, res) => {
  const { start, goal, mode = 'driving', option = 'traoptimal' } = req.query;
  
  if (!start || !goal) {
    return res.status(400).json({ error: 'Missing start or goal parameter' });
  }

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return res.json(generateMockDirections(start, goal, mode));
  }

  try {
    let apiMode = mode;
    if (apiMode === 'transit') apiMode = 'pubtrans';
    const url = `https://maps.apigw.ntruss.com/map-direction-15/v1/${apiMode}`;
    const response = await axios.get(url, {
      params: {
        start: start,
        goal: goal,
        option: option
      },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': REACT_APP_NAVER_MAP_NCP_KEY_ID,
        'X-NCP-APIGW-API-KEY': REACT_APP_NAVER_MAP_NCP_KEY_SECRET
      }
    });
    const data = response.data;
    res.json(data);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      return res.json(generateMockDirections(start, goal, mode));
    }
    res.status(500).json({ 
      error: 'Directions API request failed', 
      details: err.message,
      fallback: generateMockDirections(start, goal, mode)
    });
  }
});

// 경로 검색 모킹 응답 생성 함수
function generateMockDirections(start, goal, mode) {
  // 출발지와 목적지에 따라 더 현실적인 경로 생성
  const baseDistance = Math.floor(Math.random() * 15000) + 3000; // 3-18km 기본 거리
  const baseDuration = Math.floor(Math.random() * 2400000) + 600000; // 10-50분 기본 시간
  
  const mockRoutes = {
    driving: {
      code: 0,
      message: 'success',
      route: {
        traoptimal: [{
          summary: {
            distance: baseDistance,
            duration: baseDuration,
            tollFare: 0,
            taxiFare: Math.floor(baseDistance * 0.8) + 3000, // 거리에 비례한 택시요금
            fuelPrice: Math.floor(baseDistance * 0.15) + 1000 // 거리에 비례한 연료비
          },
          path: generateRealisticPath(start, goal, mode)
        }]
      }
    },
    walking: {
      code: 0,
      message: 'success',
      route: {
        traoptimal: [{
          summary: {
            distance: Math.floor(baseDistance * 0.3) + 500, // 도보는 더 짧은 거리
            duration: Math.floor(baseDistance * 0.3 * 12000) + 300000, // 도보 속도로 계산
            tollFare: 0,
            taxiFare: 0,
            fuelPrice: 0
          },
          path: generateRealisticPath(start, goal, mode)
        }]
      }
    },
    transit: {
      code: 0,
      message: 'success',
      route: {
        traoptimal: [{
          summary: {
            distance: baseDistance,
            duration: Math.floor(baseDuration * 1.2) + 300000, // 대중교통은 조금 더 오래 걸림
            tollFare: 0,
            taxiFare: 0,
            fuelPrice: 0
          },
          path: generateRealisticPath(start, goal, mode)
        }]
      }
    }
  };

  return mockRoutes[mode] || mockRoutes.driving;
}

// 현실적인 경로 좌표 생성 함수
function generateRealisticPath(start, goal, mode) {
  // 서울 주요 지역들의 좌표
  const seoulAreas = {
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

  // 출발지와 목적지에서 지역명 추출
  let startCoord = [126.978, 37.566]; // 기본값: 서울시청
  let endCoord = [126.985, 37.563];   // 기본값: 명동

  for (const [area, coord] of Object.entries(seoulAreas)) {
    if (start.includes(area)) startCoord = coord;
    if (goal.includes(area)) endCoord = coord;
  }

  // 경로 중간점들 생성 (더 자연스러운 곡선 경로)
  const path = [startCoord];
  
  // 중간점 개수 (교통수단에 따라 다름)
  const numPoints = mode === 'walking' ? 2 : mode === 'transit' ? 4 : 6;
  
  for (let i = 1; i < numPoints; i++) {
    const ratio = i / (numPoints + 1);
    
    // 베지어 곡선을 사용한 더 자연스러운 경로
    const t = ratio;
    const lat = startCoord[1] + (endCoord[1] - startCoord[1]) * t;
    const lng = startCoord[0] + (endCoord[0] - startCoord[0]) * t;
    
    // 약간의 곡선 효과 추가 (교통수단에 따라 다름)
    let curveOffset = 0;
    if (mode === 'driving') {
      curveOffset = Math.sin(t * Math.PI) * 0.005; // 자동차는 더 곡선적
    } else if (mode === 'transit') {
      curveOffset = Math.sin(t * Math.PI) * 0.003; // 대중교통은 중간
    } else {
      curveOffset = Math.sin(t * Math.PI) * 0.001; // 도보는 직선적
    }
    
    path.push([lng + curveOffset, lat + curveOffset]);
  }
  
  path.push(endCoord);
  
  return path;
}

app.listen(PORT, () => {
  // Proxy server running on http://localhost:${PORT}
}); 