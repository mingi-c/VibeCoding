import React, { useState, useRef } from 'react';
import './App.css';
import NaverMapView from './components/NaverMapView';
import NavigationControl from './components/NavigationControl';
import { fetchRouteFromAPI } from './services/naverApi';

function App() {
  const [routeInfo, setRouteInfo] = useState(null);
  const [searchRequest, setSearchRequest] = useState(null);
  const [selectedOption, setSelectedOption] = useState('traoptimal');
  const [hoveredSectionIndex, setHoveredSectionIndex] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showDetourPopup, setShowDetourPopup] = useState(false);
  const [detourRoadName, setDetourRoadName] = useState('');
  const [isDetourLoading, setIsDetourLoading] = useState(false);
  const [showDetourFailPopup, setShowDetourFailPopup] = useState(false);

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

  // 서버로 파일 업로드
  const handleAudioUpload = async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile, audioFile.name || 'voice.wav');
    try {
      const res = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 1000);
        if (data.stt) {
          // 경로 section에서 실제 도로명 목록 추출
          const sectionRoadNames = (routeInfo && routeInfo.sections)
                                 ? routeInfo.sections.map(sec => sec.name).filter(Boolean)
                                 : [];
          // STT 결과에서 sectionRoadNames 중 언급된 도로명 찾기
          const found = sectionRoadNames.find(road => data.stt.replaceAll(' ', '').includes(road));
          if (found) {
            setDetourRoadName(found);
            setShowDetourPopup(true);
          }
        }
      } else {
        alert('업로드 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (err) {
      alert('업로드 중 오류 발생: ' + err.message);
    }
  };

  // 우회 경로 안내 버튼 클릭 시 (자동 우회 로직)
  const handleDetourConfirm = async () => {
    setShowDetourPopup(false);
    setIsDetourLoading(true);
    
    if (routeInfo && routeInfo.start && routeInfo.end && detourRoadName && routeInfo.sections && routeInfo.summary) {
      const dangerSection = routeInfo.sections.find(sec => (sec.name || '') === detourRoadName);
      
      if (!dangerSection) {
        setIsDetourLoading(false);
        setShowDetourFailPopup(true);
        return;
      }
      
      // 시작점과 끝점 좌표
      const startCoord = routeInfo.startCoord;
      const endCoord = routeInfo.endCoord;
      
      if (!startCoord || !endCoord) {
        setIsDetourLoading(false);
        setShowDetourFailPopup(true);
        return;
      }
      
      // 우회점 후보 생성 (시작점과 끝점 사이의 중간 지점들)
      const waypointCandidates = [];
      
      // 방법 1: 시작점에서 약간 벗어난 지점들
      const startLng = startCoord.lng();
      const startLat = startCoord.lat();
      const endLng = endCoord.lng();
      const endLat = endCoord.lat();
      
      // 시작점에서 1km, 2km, 3km 떨어진 지점들 생성
      for (let i = 1; i <= 3; i++) {
        const ratio = i * 0.1; // 전체 거리의 10%, 20%, 30%
        const waypointLng = startLng + (endLng - startLng) * ratio;
        const waypointLat = startLat + (endLat - startLat) * ratio;
        waypointCandidates.push([waypointLng, waypointLat]);
      }
      
      // 방법 2: 위험 구간 이전 지점 추정 (pointIndex 기반)
      if (dangerSection.pointIndex > 0) {
        const totalPoints = routeInfo.sections.reduce((sum, sec) => sum + sec.pointCount, 0);
        const dangerRatio = dangerSection.pointIndex / totalPoints;
        const waypointLng = startLng + (endLng - startLng) * (dangerRatio - 0.1);
        const waypointLat = startLat + (endLat - startLat) * (dangerRatio - 0.1);
        waypointCandidates.push([waypointLng, waypointLat]);
      }
      
      let foundRoute = null;
      let usedWaypoint = null;
      
      for (const waypoint of waypointCandidates) {
        // waypoint: [lng, lat] → "lng,lat" 문자열로 변환
        const waypointStr = Array.isArray(waypoint) ? `${waypoint[0]},${waypoint[1]}` : '';
        try {
          console.log('[FRONT] 우회 경로 탐색 시도, waypoint:', waypointStr);
          const apiData = await fetchRouteFromAPI(
            `${startLng},${startLat}`,
            `${endLng},${endLat}`,
            'driving',
            selectedOption,
            waypointStr
          );
          // traoptimal 경로의 section에 detourRoadName이 포함되어 있지 않으면 채택
          const mainRoute = apiData?.[selectedOption]?.[0];
          const hasDanger = mainRoute && Array.isArray(mainRoute.section) && mainRoute.section.some(sec => (sec.name || '').includes(detourRoadName));
          if (!hasDanger) {
            foundRoute = apiData;
            usedWaypoint = waypointStr;
            break;
          }
        } catch (err) {
          console.log('[FRONT] 우회 경로 탐색 실패:', err);
          // 무시하고 다음 후보 시도
        }
      }
      
      if (foundRoute && usedWaypoint) {
        // 우회 경로로 재탐색
        setSearchRequest({
          start: routeInfo.start,
          end: routeInfo.end,
          option: selectedOption,
          waypoint: usedWaypoint
        });
      } else {
        setIsDetourLoading(false);
        setShowDetourFailPopup(true);
        return;
      }
    }
    
    setIsDetourLoading(false);
  };

  // 우회 경로 실패 팝업 닫기
  const handleDetourFailClose = () => {
    setShowDetourFailPopup(false);
  };

  // 그대로 진행 버튼 클릭 시
  const handleDetourCancel = () => {
    setShowDetourPopup(false);
  };

  // 마이크 녹음 시작/종료
  const handleMicClick = async () => {
    if (!isRecording) {
      // 녹음 시작
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new window.MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          handleAudioUpload(audioBlob);
        };
        mediaRecorder.start();
        setIsRecording(true);
      }
    } else {
      // 녹음 종료
      mediaRecorderRef.current && mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 음성 파일 업로드 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleAudioUpload(file);
      // 파일 input의 value를 초기화하여 같은 파일을 다시 선택할 수 있도록 함
      e.target.value = '';
    }
  };

  return (
    <div className="App">
      <div className="solomon-header">
        <div className="solomon-logo-bg">
          <img src="/solomon_logo.png" alt="solomon tech logo" className="solomon-logo" />
        </div>
        <header className="App-header">
          <h1>Vibe Coding 네비게이션</h1>
          <p>출발지와 목적지를 입력하여 경로를 확인하세요</p>
        </header>
        <div className="header-actions">
          {showSavedMessage && (
            <span className="audio-saved-message">음성 파일 저장</span>
          )}
          <button className={`mic-btn${isRecording ? ' recording' : ''}`} onClick={handleMicClick} title="음성 녹음" disabled={!routeInfo}>
            {isRecording ? '⏹️ 녹음중' : '🎤 마이크'}
          </button>
          <label className={`upload-btn${!routeInfo ? ' disabled' : ''}`} title="음성 파일 업로드">
            📁 업로드
            <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFileChange} disabled={!routeInfo} ref={fileInputRef} />
          </label>
        </div>
      </div>
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
      {showDetourPopup && (
        <div className="detour-popup">
          <div className="detour-popup-content">
            <h3>우회 경로 안내</h3>
            <p><b>{detourRoadName}</b> 구간에서 사고/혼잡이 감지되었습니다.</p>
            <p>우회 경로를 안내해드릴까요?</p>
            <div className="detour-popup-buttons">
              <button onClick={handleDetourConfirm} className="detour-confirm-btn">
                우회 경로 안내
              </button>
              <button onClick={handleDetourCancel} className="detour-cancel-btn">
                그대로 진행
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetourLoading && (
        <div className="detour-loading-overlay">
          <div className="detour-loading-spinner">
            <div className="spinner"></div>
            <p>우회 경로를 탐색하고 있습니다...</p>
          </div>
        </div>
      )}

      {showDetourFailPopup && (
        <div className="detour-fail-popup">
          <div className="detour-fail-popup-content">
            <h3>우회 경로 탐색 실패</h3>
            <p>적절한 우회 경로를 찾지 못했습니다.</p>
            <div className="detour-fail-popup-buttons">
              <button onClick={handleDetourFailClose} className="detour-fail-close-btn">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
