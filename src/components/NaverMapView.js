import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchRouteFromAPI } from '../services/naverApi';
import { geocodeAddress } from '../services/geocodingService';
import MapContainer from './map/MapContainer';

const NaverMapView = ({ searchRequest, onRouteInfoUpdate, onRouteSearchComplete, selectedOption }) => {
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
          summary: mainRoute ? mainRoute.summary : null
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
    const path = pathArray.map(coord => Array.isArray(coord) && coord.length === 2 ? new window.naver.maps.LatLng(coord[1], coord[0]) : null).filter(Boolean);
    const simplifiedPath = path.length > 100 ? simplifyPath(path, 3) : path;
    clearMap();
    window.currentRoute = new window.naver.maps.Polyline({
      path: simplifiedPath,
      strokeColor: getRouteColor('driving'),
      strokeWeight: 8,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      zIndex: 1000,
      map: mapInstance.current
    });
    if (simplifiedPath.length > 0) {
      window.startMarker = new window.naver.maps.Marker({
        position: simplifiedPath[0],
        map: mapInstance.current,
        zIndex: 1001,
        icon: {
          content: `<div style="background: #fff; color: #03c75a; font-weight: bold; font-size: 15px; border-radius: 6px; padding: 2px 8px; border: 1px solid #03c75a;">출발</div>`,
          size: new window.naver.maps.Size(40, 24),
          anchor: new window.naver.maps.Point(20, 12)
        }
      });
      window.endMarker = new window.naver.maps.Marker({
        position: simplifiedPath[simplifiedPath.length - 1],
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
    simplifiedPath.forEach(coord => bounds.extend(coord));
    mapInstance.current.fitBounds(bounds);
  };

  // 지도에서 기존 경로와 마커들 제거
  const clearMap = () => {
    if (window.currentRoute) {
      window.currentRoute.setMap(null);
      window.currentRoute = null;
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
    mapInstance.current.fitBounds(bounds);
  };

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