import React from 'react';
import { formatDistance, formatDuration, formatPrice } from '../../utils/helpers';

const RouteInfo = ({ routeInfo, selectedOption, onOptionChange, onSectionHover, onSectionLeave }) => {
  if (!routeInfo) return null;

  const { summary, sections = [] } = routeInfo;

  // 옵션명 한글 변환
  const optionLabels = {
    traoptimal: '추천',
    trafast: '최단',
    tracomfort: '편안'
  };
  const optionKeys = ['traoptimal', 'trafast', 'tracomfort'];

  // 혼잡도 표시
  const congestionLabels = ['원활', '서행', '정체', '매우정체'];
  const congestionColors = ['#03c75a', '#ffe066', '#ff9900', '#ff4444'];

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
      {/* 구간별 혼잡도 표 */}
      {sections.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: 4, border: '1px solid #eee' }}>도로명</th>
                <th style={{ padding: 4, border: '1px solid #eee' }}>거리</th>
                <th style={{ padding: 4, border: '1px solid #eee' }}>혼잡도</th>
                <th style={{ padding: 4, border: '1px solid #eee' }}>속도</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((sec, idx) => (
                <tr key={idx}>
                  <td 
                    style={{ padding: 4, border: '1px solid #eee', cursor: 'pointer', textDecoration: 'underline' }}
                    onMouseEnter={() => onSectionHover && onSectionHover(idx)}
                    onMouseLeave={() => onSectionLeave && onSectionLeave()}
                  >
                    {sec.name || '-'}
                  </td>
                  <td style={{ padding: 4, border: '1px solid #eee' }}>{formatDistance(sec.distance)}</td>
                  <td style={{ padding: 4, border: '1px solid #eee' }}>
                    <span style={{ color: congestionColors[sec.congestion], fontWeight: 'bold', marginRight: 4 }}>
                      ●
                    </span>
                    {congestionLabels[sec.congestion] || '-'}
                  </td>
                  <td style={{ padding: 4, border: '1px solid #eee' }}>{sec.speed ? `${sec.speed}km/h` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RouteInfo; 