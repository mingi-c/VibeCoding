import React, { useState } from 'react';
import './App.css';
import NaverMapView from './components/NaverMapView';
import NavigationControl from './components/NavigationControl';

function App() {
  const [routeInfo, setRouteInfo] = useState(null);
  const [searchRequest, setSearchRequest] = useState(null);
  const [selectedOption, setSelectedOption] = useState('traoptimal');
  const [hoveredSectionIndex, setHoveredSectionIndex] = useState(null);

  const handleRouteSearch = (start, end) => {
    setSelectedOption('traoptimal');
    setSearchRequest({ start, end, option: 'traoptimal' });
  };

  // NaverMapView에서 경로 정보가 업데이트될 때 호출
  const handleRouteInfoUpdate = (info) => {
    setRouteInfo(info);
  };

  // NaverMapView에서 경로 검색이 끝나면 searchRequest를 null로 초기화
  const handleRouteSearchComplete = () => {
    setSearchRequest(null);
  };

  // 옵션 버튼 클릭 시
  const handleOptionChange = (option) => {
    setSelectedOption(option);
    // 출발/도착 정보가 있을 때만 재검색
    if (routeInfo && routeInfo.start && routeInfo.end) {
      setSearchRequest({ start: routeInfo.start, end: routeInfo.end, option });
    }
  };

  // 구간 hover 콜백
  const handleSectionHover = (idx) => setHoveredSectionIndex(idx);
  const handleSectionLeave = () => setHoveredSectionIndex(null);

  return (
    <div className="App">
      <header className="App-header">
        <h1>네이버 지도 네비게이션</h1>
        <p>출발지와 목적지를 입력하여 경로를 확인하세요</p>
      </header>
      
      <main className="App-main">
        <NavigationControl 
          onRouteSearch={handleRouteSearch} 
          routeInfo={routeInfo}
          selectedOption={selectedOption}
          onOptionChange={handleOptionChange}
          onSectionHover={handleSectionHover}
          onSectionLeave={handleSectionLeave}
        />
        <NaverMapView 
          searchRequest={searchRequest}
          onRouteInfoUpdate={handleRouteInfoUpdate}
          onRouteSearchComplete={handleRouteSearchComplete}
          selectedOption={selectedOption}
          hoveredSectionIndex={hoveredSectionIndex}
        />
      </main>
    </div>
  );
}

export default App;
