// 주소를 좌표로 변환하는 함수 (네이버 지도 API v3 방식)
export const geocodeAddress = (address) => {
  return new Promise((resolve) => {
    // 네이버 지도 API v3의 올바른 Geocoder 사용법
    if (window.naver && window.naver.maps && window.naver.maps.Service) {
      window.naver.maps.Service.geocode({
        query: address
      }, (status, response) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
          const result = response.v2.addresses[0];
          const lat = parseFloat(result.y);
          const lng = parseFloat(result.x);
          resolve(new window.naver.maps.LatLng(lat, lng));
        } else {
          console.error('지오코딩 실패:', status);
          console.error('응답 내용:', response);
          resolve(null);
        }
      });
    } else {
      console.error('네이버 지도 API가 로드되지 않았습니다.');
      resolve(null);
    }
  });
}; 