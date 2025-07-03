import React, { useState, useRef } from 'react';
import './App.css';
import NaverMapView from './components/NaverMapView';
import NavigationControl from './components/NavigationControl';

function App() {
  const [routeInfo, setRouteInfo] = useState(null);
  const [searchRequest, setSearchRequest] = useState(null);
  const [selectedOption, setSelectedOption] = useState('traoptimal');
  const [hoveredSectionIndex, setHoveredSectionIndex] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

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
      } else {
        alert('업로드 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (err) {
      alert('업로드 중 오류 발생: ' + err.message);
    }
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
            <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFileChange} disabled={!routeInfo} />
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
    </div>
  );
}

export default App;
