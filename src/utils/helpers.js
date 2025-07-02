import { SEOUL_AREAS, SEARCH_CONFIG } from './constants';

// 주소에서 지역 추출
export const extractRegion = (address) => {
  if (!address) return '';
  const match = address.match(/서울특별시\s+([가-힣]+구)/);
  return match ? match[1] : '';
};

// 카테고리에 따른 아이콘 반환
export const getPlaceIcon = (categoryCode) => {
  return SEARCH_CONFIG.PLACE_ICONS[categoryCode] || '📍';
};

// HTML 태그 제거
export const removeHtmlTags = (text) => {
  return text.replace(/<[^>]+>/g, '');
};

// 좌표 기반 거리 계산 (간단한 유클리드 거리)
export const calculateDistance = (coord1, coord2) => {
  const lat1 = coord1[1];
  const lng1 = coord1[0];
  const lat2 = coord2[1];
  const lng2 = coord2[0];
  
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 주소에서 좌표 찾기
export const findCoordinatesFromAddress = (address) => {
  for (const [area, coord] of Object.entries(SEOUL_AREAS)) {
    if (address.includes(area)) {
      return coord;
    }
  }
  return null;
};

// 경로 중간점 생성 (베지어 곡선 기반)
export const generatePathPoints = (startCoord, endCoord, mode, numPoints = 6) => {
  const path = [startCoord];
  
  for (let i = 1; i < numPoints; i++) {
    const ratio = i / (numPoints + 1);
    const t = ratio;
    
    const lat = startCoord[1] + (endCoord[1] - startCoord[1]) * t;
    const lng = startCoord[0] + (endCoord[0] - startCoord[0]) * t;
    
    // 교통수단에 따른 곡선 효과
    let curveOffset = 0;
    if (mode === 'driving') {
      curveOffset = Math.sin(t * Math.PI) * 0.005;
    } else if (mode === 'transit') {
      curveOffset = Math.sin(t * Math.PI) * 0.003;
    } else {
      curveOffset = Math.sin(t * Math.PI) * 0.001;
    }
    
    path.push([lng + curveOffset, lat + curveOffset]);
  }
  
  path.push(endCoord);
  return path;
};

// 거리 포맷팅 (미터를 km로 변환)
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

// 시간 포맷팅 (밀리초를 분으로 변환)
export const formatDuration = (milliseconds) => {
  const minutes = Math.round(milliseconds / 60000);
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}시간 ${remainingMinutes}분`;
};

// 요금 포맷팅
export const formatPrice = (price) => {
  return price.toLocaleString() + '원';
}; 