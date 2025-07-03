import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchRouteFromAPI } from '../services/naverApi';
import { geocodeAddress } from '../services/geocodingService';
import MapContainer from './map/MapContainer';

// 혼잡도 색상
const congestionColors = ['#03c75a', '#ffe066', '#ff9900', '#ff4444'];

// hex 색상을 더 어둡게 만드는 함수
function darkenColor(hex, amount = 0.5) {
  // hex: '#rrggbb', amount: 0~1 (0=원본, 1=완전검정)
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.round(r * (1 - amount));
  g = Math.round(g * (1 - amount));
  b = Math.round(b * (1 - amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const NaverMapView = ({ searchRequest, onRouteInfoUpdate, onRouteSearchComplete, selectedOption, hoveredSectionIndex }) => {
  const mapInstance = useRef(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // 지도 준비 완료 시 호출
  const handleMapReady = useCallback((map) => {
    mapInstance.current = map;
  }, []);

  // 경로 검색 함수
  const searchRoute = useCallback(async (start, end, option = 'traoptimal') => {
    if (!mapInstance.current) return;
    if (!window.naver) return;
    setIsLoadingRoute(true);
    try {
      const startCoord = await geocodeAddress(start);
      const endCoord = await geocodeAddress(end);
      if (!startCoord || !endCoord) {
        alert('주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.');
        setIsLoadingRoute(false);
        if (onRouteSearchComplete) onRouteSearchComplete();
        return;
      }
      const startStr = `${startCoord.lng()},${startCoord.lat()}`;
      const endStr = `${endCoord.lng()},${endCoord.lat()}`;
      const apiData = await fetchRouteFromAPI(startStr, endStr, 'driving', option);
      // option에 해당하는 경로만 지도에 그림
      const mainRoute = apiData?.[option]?.[0] || apiData?.traoptimal?.[0] || apiData?.trafast?.[0] || apiData?.tracomfort?.[0] || apiData?.trarecommend?.[0];
      if (mainRoute) {
        drawDetailedRoute(mainRoute, startCoord, endCoord);
      } else {
        drawRoute(startCoord, endCoord);
      }
      // RouteInfo에 요약 정보 전달
      if (onRouteInfoUpdate) {
        onRouteInfoUpdate({
          start,
          end,
          startCoord,
          endCoord,
          mode: 'driving',
          summary: mainRoute ? mainRoute.summary : null,
          sections: mainRoute && Array.isArray(mainRoute.section) ? mainRoute.section : []
        });
      }
    } catch (error) {
      alert('경로 검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingRoute(false);
      if (onRouteSearchComplete) onRouteSearchComplete();
    }
  }, [onRouteInfoUpdate, onRouteSearchComplete]);

  // 경로 좌표 샘플링 함수(간소화)
  function simplifyPath(path, step = 3) {
    if (!Array.isArray(path) || path.length < 2) return path;
    const result = [];
    for (let i = 0; i < path.length; i += step) {
      result.push(path[i]);
    }
    if (result[result.length - 1] !== path[path.length - 1]) {
      result.push(path[path.length - 1]);
    }
    return result;
  }

  // 상세 경로 그리기 (Directions API 결과 사용, 자동차 전용)
  const drawDetailedRoute = (routeData, startCoord, endCoord) => {
    if (!mapInstance.current || !routeData) return;
    let pathArray = Array.isArray(routeData.path) ? routeData.path : [];
    // section이 있을 때는 원본 path 사용, 없을 때만 샘플링
    const hasSection = Array.isArray(routeData.section) && routeData.section.length > 0;
    const path = pathArray.map(coord => Array.isArray(coord) && coord.length === 2 ? new window.naver.maps.LatLng(coord[1], coord[0]) : null).filter(Boolean);
    const simplifiedPath = !hasSection && path.length > 100 ? simplifyPath(path, 3) : path;
    clearMap();

    if (hasSection) {
      // 기존 구간 Polyline 배열 초기화
      window.routeSections = [];
      const covered = Array(path.length).fill(false);
      routeData.section.forEach((sec) => {
        const startIdx = sec.pointIndex;
        const endIdx = startIdx + sec.pointCount;
        const sectionPath = path.slice(startIdx, endIdx + 1);
        if (sectionPath.length < 2) return;
        for (let i = startIdx; i <= endIdx && i < path.length; i++) covered[i] = true;
        const poly = new window.naver.maps.Polyline({
          path: sectionPath,
          strokeColor: congestionColors[sec.congestion] || '#03c75a',
          strokeWeight: 8,
          strokeOpacity: 1,
          strokeStyle: 'solid',
          zIndex: 1000,
          map: mapInstance.current
        });
        poly.congestion = sec.congestion;
        poly.congestionColor = congestionColors[sec.congestion] || '#03c75a';
        window.routeSections.push(poly);
      });
      // section이 커버하지 않는 path 구간(혼잡도 정보 없는 구간)도 기본색으로 그림
      let start = null;
      for (let i = 0; i < path.length; i++) {
        if (!covered[i]) {
          if (start === null) start = i;
        } else {
          if (start !== null && i - start > 0) {
            const subPath = path.slice(start, i + 1);
            if (subPath.length > 1) {
              const poly = new window.naver.maps.Polyline({
                path: subPath,
                strokeColor: '#03c75a',
                strokeWeight: 8,
                strokeOpacity: 1,
                strokeStyle: 'solid',
                zIndex: 999,
                map: mapInstance.current
              });
              poly.congestion = 0;
              poly.congestionColor = '#03c75a';
              window.routeSections.push(poly);
            }
            start = null;
          }
        }
      }
      if (start !== null && path.length - start > 1) {
        const subPath = path.slice(start, path.length);
        if (subPath.length > 1) {
          const poly = new window.naver.maps.Polyline({
            path: subPath,
            strokeColor: '#03c75a',
            strokeWeight: 8,
            strokeOpacity: 1,
            strokeStyle: 'solid',
            zIndex: 999,
            map: mapInstance.current
          });
          poly.congestion = 0;
          poly.congestionColor = '#03c75a';
          window.routeSections.push(poly);
        }
      }
    } else {
      // section 정보가 없으면 전체를 기본색으로 그림 (샘플링 적용)
      window.currentRoute = new window.naver.maps.Polyline({
        path: simplifiedPath,
        strokeColor: getRouteColor('driving'),
        strokeWeight: 8,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        zIndex: 1000,
        map: mapInstance.current
      });
    }

    if (path.length > 0) {
      window.startMarker = new window.naver.maps.Marker({
        position: path[0],
        map: mapInstance.current,
        zIndex: 1001,
        icon: {
          content: `<div style="background: #fff; color: #03c75a; font-weight: bold; font-size: 15px; border-radius: 6px; padding: 2px 8px; border: 1px solid #03c75a;">출발</div>`,
          size: new window.naver.maps.Size(40, 24),
          anchor: new window.naver.maps.Point(20, 12)
        }
      });
      window.endMarker = new window.naver.maps.Marker({
        position: path[path.length - 1],
        map: mapInstance.current,
        zIndex: 1001,
        icon: {
          content: `<div style="background: #fff; color: #ff4444; font-weight: bold; font-size: 15px; border-radius: 6px; padding: 2px 8px; border: 1px solid #ff4444;">도착</div>`,
          size: new window.naver.maps.Size(40, 24),
          anchor: new window.naver.maps.Point(20, 12)
        }
      });
    }
    const bounds = new window.naver.maps.LatLngBounds();
    path.forEach(coord => bounds.extend(coord));
    // 헤더(상단 100), 왼쪽 검색창(400), 하단/우측 40씩 패딩
    mapInstance.current.fitBounds(bounds, { top: 100, left: 400, bottom: 40, right: 40 });
  };

  // 지도에서 기존 경로와 마커들 제거
  const clearMap = () => {
    if (window.currentRoute) {
      window.currentRoute.setMap(null);
      window.currentRoute = null;
    }
    if (window.routeSections && Array.isArray(window.routeSections)) {
      window.routeSections.forEach(poly => poly.setMap(null));
      window.routeSections = [];
    }
    if (window.routeSectionsShadow && Array.isArray(window.routeSectionsShadow)) {
      window.routeSectionsShadow.forEach(shadow => shadow && shadow.setMap(null));
      window.routeSectionsShadow = [];
    }
    if (window.startMarker) {
      window.startMarker.setMap(null);
      window.startMarker = null;
    }
    if (window.endMarker) {
      window.endMarker.setMap(null);
      window.endMarker = null;
    }
  };

  // 교통수단별 경로 색상 반환 (자동차만)
  const getRouteColor = () => '#03c75a';

  // 경로를 지도에 그리는 함수 (직선 경로 - 폴백용)
  const drawRoute = (startCoord, endCoord) => {
    if (!mapInstance.current) return;
    clearMap();
    const path = [startCoord, endCoord];
    window.currentRoute = new window.naver.maps.Polyline({
      path: path,
      strokeColor: getRouteColor('driving'),
      strokeWeight: 5,
      strokeOpacity: 0.8,
      map: mapInstance.current
    });
    window.startMarker = new window.naver.maps.Marker({
      position: startCoord,
      map: mapInstance.current,
      icon: {
        content: '<div style="background: #fff; color: #03c75a; font-weight: bold; font-size: 15px; border-radius: 6px; padding: 2px 8px; border: 1px solid #03c75a;">출발</div>',
        size: new window.naver.maps.Size(40, 24),
        anchor: new window.naver.maps.Point(20, 12)
      }
    });
    window.endMarker = new window.naver.maps.Marker({
      position: endCoord,
      map: mapInstance.current,
      icon: {
        content: '<div style="background: #fff; color: #ff4444; font-weight: bold; font-size: 15px; border-radius: 6px; padding: 2px 8px; border: 1px solid #ff4444;">도착</div>',
        size: new window.naver.maps.Size(40, 24),
        anchor: new window.naver.maps.Point(20, 12)
      }
    });
    const bounds = new window.naver.maps.LatLngBounds(startCoord, endCoord);
    // 헤더(상단 100), 왼쪽 검색창(400), 하단/우측 40씩 패딩
    mapInstance.current.fitBounds(bounds, { top: 100, left: 400, bottom: 40, right: 40 });
  };

  // 구간 hover 시 스타일 강조 + 그림자 효과
  useEffect(() => {
    if (!window.routeSections || !Array.isArray(window.routeSections)) return;
    // 기존 그림자 Polyline 제거
    if (window.routeSectionsShadow && Array.isArray(window.routeSectionsShadow)) {
      window.routeSectionsShadow.forEach(shadow => shadow && shadow.setMap(null));
    }
    window.routeSectionsShadow = [];
    window.routeSections.forEach((poly, idx) => {
      if (hoveredSectionIndex === idx) {
        // 그림자 Polyline 추가 (혼잡도 색상의 어두운 버전)
        const path = poly.getPath();
        const shadow = new window.naver.maps.Polyline({
          path: path,
          strokeColor: darkenColor(poly.congestionColor, 0.5),
          strokeWeight: 24,
          strokeOpacity: 0.35,
          strokeStyle: 'solid',
          zIndex: 1999,
          map: mapInstance.current,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
        });
        window.routeSectionsShadow[idx] = shadow;
        // 강조 Polyline
        poly.setOptions({
          strokeWeight: 14,
          strokeOpacity: 1,
          zIndex: 2000,
          strokeColor: poly.congestionColor,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
        });
      } else {
        poly.setOptions({
          strokeWeight: 8,
          strokeOpacity: 1,
          zIndex: 1000,
          strokeColor: poly.congestionColor,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
        });
      }
    });
  }, [hoveredSectionIndex]);

  useEffect(() => {
    if (searchRequest && searchRequest.start && searchRequest.end && mapInstance.current) {
      const optionToUse = searchRequest.option || selectedOption;
      searchRoute(searchRequest.start, searchRequest.end, optionToUse);
    }
  }, [searchRequest, selectedOption, searchRoute]);

  return (
    <MapContainer onMapReady={handleMapReady}>
      {isLoadingRoute && (
        <div className="loading-overlay">
          <div className="loading-spinner">경로 검색 중...</div>
        </div>
      )}
    </MapContainer>
  );
};

export default NaverMapView; 