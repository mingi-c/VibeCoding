import React from 'react';
import { formatDistance, formatDuration, formatPrice } from '../../utils/helpers';

const RouteInfo = ({ routeInfo, selectedOption, onOptionChange }) => {
  if (!routeInfo) return null;

  // 여러 경로 옵션 요약
  const { summary } = routeInfo;

  // 옵션명 한글 변환
  const optionLabels = {
    traoptimal: '추천',
    trafast: '최단',
    tracomfort: '편안'
  };
  const optionKeys = ['traoptimal', 'trafast', 'tracomfort'];

  return (
    <div className="route-info">
      <h3>경로 정보</h3>
      {/* 옵션 버튼 UI */}
      <div style={{ marginBottom: 10 }}>
        {optionKeys.map((key) => (
          <button
            key={key}
            style={{
              marginRight: 6,
              padding: '4px 14px',
              borderRadius: 6,
              border: selectedOption === key ? '2px solid #03c75a' : '1px solid #ccc',
              background: selectedOption === key ? '#eafff3' : '#fff',
              color: '#222',
              fontWeight: selectedOption === key ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
            onClick={() => { if (typeof onOptionChange === 'function') onOptionChange(key); }}
          >
            {optionLabels[key]}
          </button>
        ))}
      </div>
      <p><strong>출발지:</strong> {routeInfo.start}</p>
      <p><strong>목적지:</strong> {routeInfo.end}</p>
      <p><strong>교통수단:</strong> 🚗 자동차</p>
      {summary && (
        <div className="route-summary" style={{ background: '#f0f9f0', borderRadius: 8, padding: 8, marginBottom: 10 }}>
          <p><strong>거리:</strong> {formatDistance(summary.distance)}</p>
          <p><strong>소요시간:</strong> {formatDuration(summary.duration)}</p>
          {summary.taxiFare > 0 && (
            <p><strong>택시요금:</strong> {formatPrice(summary.taxiFare)}</p>
          )}
          {summary.fuelPrice > 0 && (
            <p><strong>연료비:</strong> {formatPrice(summary.fuelPrice)}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteInfo; 