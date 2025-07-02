import React, { useState, useEffect, useRef } from 'react';
import { searchWithNaverLocal } from '../services/naverApi';
import { getPlaceIcon, extractRegion } from '../utils/helpers';
import SearchInput from './navigation/SearchInput';
import RouteInfo from './navigation/RouteInfo';

const NavigationControl = ({ onRouteSearch, routeInfo, selectedOption, onOptionChange }) => {
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [selectedStartSuggestion, setSelectedStartSuggestion] = useState(null);
  const [selectedEndSuggestion, setSelectedEndSuggestion] = useState(null);
  const searchTimeoutRef = useRef(null);

  // 네이버 지도 API 검색 기능 초기화
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.REACT_APP_NAVER_MAP_NCP_KEY_ID}&submodules=geocoder`;
    script.async = true;
    
    script.onload = () => {
      // 네이버 지도 API 로드 완료
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 주소 검색 함수
  const searchAddress = (query, setSuggestions) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // 디바운싱 적용
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const suggestions = [];
      
      // 1. 네이버 로컬 API로 장소 검색 (더 정확한 결과)
      try {
        const naverResults = await searchWithNaverLocal(query);
        naverResults.forEach(place => {
          suggestions.push({
            address: place.address,
            roadAddress: place.roadAddress,
            jibunAddress: place.address,
            x: place.x,
            y: place.y,
            type: 'naver',
            icon: getPlaceIcon(place.type),
            placeName: place.place_name,
            region: place.region
          });
        });
      } catch (error) {
        console.error('네이버 API 오류:', error);
      }
      
      // 2. 네이버 지도 Geocoder로 추가 검색
      if (window.naver && window.naver.maps && window.naver.maps.Service) {
        try {
          const geocoderResult = await new Promise((resolve) => {
            window.naver.maps.Service.geocode({
              query: query
            }, (status, response) => {
              resolve({ status, response });
            });
          });
          
          if (geocoderResult.status === window.naver.maps.Service.Status.OK && geocoderResult.response.v2.addresses.length > 0) {
            geocoderResult.response.v2.addresses.forEach(addr => {
              const suggestion = {
                address: addr.roadAddress || addr.jibunAddress,
                roadAddress: addr.roadAddress,
                jibunAddress: addr.jibunAddress,
                x: addr.x,
                y: addr.y,
                type: 'naver',
                icon: '📍',
                region: extractRegion(addr.roadAddress || addr.jibunAddress)
              };
              
              // 중복 제거 (주소가 동일한 경우)
              if (!suggestions.some(s => s.address === suggestion.address)) {
                suggestions.push(suggestion);
              }
            });
          }
        } catch (error) {
          console.error('Geocoder 오류:', error);
        }
      }
      
      // 3. 검색 결과가 없을 때 안내 메시지
      if (suggestions.length === 0) {
        suggestions.push({
          address: `"${query}"에 대한 검색 결과가 없습니다. 더 구체적인 주소를 입력해주세요.`,
          roadAddress: '',
          jibunAddress: '',
          x: '',
          y: '',
          isError: true
        });
      }
      
      setSuggestions(suggestions);
    }, 300);
  };

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 입력 필드나 자동완성 영역 클릭 시에는 닫지 않음
      if (event.target.closest('.input-container') || event.target.closest('.suggestions')) {
        return;
      }
      setShowStartSuggestions(false);
      setShowEndSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 출발지 입력 처리
  const handleStartPointChange = (e) => {
    const value = e.target.value;
    setStartPoint(value);
    setShowStartSuggestions(true);
    searchAddress(value, setStartSuggestions);
  };

  // 목적지 입력 처리
  const handleEndPointChange = (e) => {
    const value = e.target.value;
    setEndPoint(value);
    setShowEndSuggestions(true);
    searchAddress(value, setEndSuggestions);
  };

  // 출발지 선택
  const handleStartPointSelect = (suggestion) => {
    // 에러 메시지인 경우 선택하지 않음
    if (suggestion.isError) {
      return;
    }
    
    // 키워드 값(placeName)을 표시하도록 수정
    setStartPoint(suggestion.placeName || suggestion.address);
    setSelectedStartSuggestion(suggestion);
    setStartSuggestions([]);
    setShowStartSuggestions(false);
  };

  // 목적지 선택
  const handleEndPointSelect = (suggestion) => {
    // 에러 메시지인 경우 선택하지 않음
    if (suggestion.isError) {
      return;
    }
    
    // 키워드 값(placeName)을 표시하도록 수정
    setEndPoint(suggestion.placeName || suggestion.address);
    setSelectedEndSuggestion(suggestion);
    setEndSuggestions([]);
    setShowEndSuggestions(false);
  };

  const handleSearch = () => {
    if (!startPoint.trim() || !endPoint.trim()) {
      alert('출발지와 목적지를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    // 선택된 키워드에 해당하는 상세 주소 찾기
    let startAddress = startPoint;
    let endAddress = endPoint;
    
    // 출발지 상세 주소 찾기
    if (selectedStartSuggestion) {
      startAddress = selectedStartSuggestion.address;
    }
    
    // 목적지 상세 주소 찾기
    if (selectedEndSuggestion) {
      endAddress = selectedEndSuggestion.address;
    }
    
    // 경로 검색 함수 호출 (상세 주소 사용)
    onRouteSearch(startAddress, endAddress);
    
    // 로딩 상태 해제 (실제로는 API 응답 후에 해제)
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="navigation-control">
      <h2>경로 검색</h2>
      <div className="input-group">
        <SearchInput
          id="startPoint"
          value={startPoint}
          onChange={handleStartPointChange}
          onKeyPress={handleKeyPress}
          placeholder="출발지를 입력하세요"
          label="출발지"
          showSuggestions={showStartSuggestions}
          suggestions={startSuggestions}
          onSuggestionSelect={handleStartPointSelect}
          onFocus={() => setShowStartSuggestions(true)}
        />
        <SearchInput
          id="endPoint"
          value={endPoint}
          onChange={handleEndPointChange}
          onKeyPress={handleKeyPress}
          placeholder="목적지를 입력하세요"
          label="목적지"
          showSuggestions={showEndSuggestions}
          suggestions={endSuggestions}
          onSuggestionSelect={handleEndPointSelect}
          onFocus={() => setShowEndSuggestions(true)}
        />
      </div>
      <button 
        className="search-button"
        onClick={handleSearch}
        disabled={isLoading}
      >
        {isLoading ? '검색 중...' : '경로 검색'}
      </button>

      {/* 경로 정보 표시 */}
      <RouteInfo 
        routeInfo={routeInfo}
        selectedOption={selectedOption}
        onOptionChange={onOptionChange}
      />
    </div>
  );
};

export default NavigationControl; 