// 네이버 검색 API 호출
export async function searchWithNaverLocal(query) {
  const response = await fetch(`/api/naver/search?query=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (!data.items) return [];
  return data.items.map(item => ({
    place_name: item.title.replace(/<[^>]+>/g, ''), // HTML 태그 제거
    address: item.address,
    roadAddress: item.roadAddress,
    x: item.mapx,
    y: item.mapy,
    type: 'naver',
    icon: '📍',
    region: item.address.split(' ')[1] || ''
  }));
}

// 네이버 Directions API 호출 (자동차 전용)
export async function fetchRouteFromAPI(start, end, mode = 'driving', option = 'traoptimal') {
  const response = await fetch(`/api/naver/directions?start=${encodeURIComponent(start)}&goal=${encodeURIComponent(end)}&mode=${mode}&option=${option}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  if (data.code === 0 && data.route) {
    // 여러 경로 옵션을 모두 반환
    return {
      traoptimal: data.route.traoptimal || [],
      trafast: data.route.trafast || [],
      tracomfort: data.route.tracomfort || [],
      trarecommend: data.route.trarecommend || [],
      trapedestrian: data.route.trapedestrian || [],
      pubtrans: data.route.pubtrans || []
    };
  }
  return null;
} 