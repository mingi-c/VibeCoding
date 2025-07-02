import React, { useEffect, useRef } from 'react';
import { MAP_CONFIG } from '../../utils/constants';

const MapContainer = ({ onMapReady, children }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    // 네이버 지도 API 스크립트 로드
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.REACT_APP_NAVER_MAP_NCP_KEY_ID}&submodules=geocoder`;
    script.async = true;
    
    script.onload = () => {
      // 지도 생성
      const mapOptions = {
        center: new window.naver.maps.LatLng(
          MAP_CONFIG.DEFAULT_CENTER.lat, 
          MAP_CONFIG.DEFAULT_CENTER.lng
        ),
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.RIGHT_BOTTOM
        },
        disableDoubleClickZoom: true,
        tileTransition: false, // 타일 전환 애니메이션 비활성화
        logoControl: false, // 네이버 로고 비활성화
        mapDataControl: false, // 지도 데이터 저작권 비활성화
        scaleControl: false, // 축척 비활성화
        mapTypeControl: false, // 지도/위성 전환 비활성화
        background: '#fff' // 배경색 고정
      };
      
      mapInstance.current = new window.naver.maps.Map(mapRef.current, mapOptions);
      

      
      // 지도 준비 완료 콜백
      if (onMapReady) {
        onMapReady(mapInstance.current);
      }
    };

    script.onerror = () => {
      console.error('네이버 지도 API 로드 실패');
    };

    document.head.appendChild(script);

    // 컴포넌트 언마운트 시 스크립트 제거
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []); // onMapReady 의존성 제거

  return (
    <div className="map-container">
      <div 
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      {children}
    </div>
  );
};

export default MapContainer; 