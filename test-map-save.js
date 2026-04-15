// 测试地图保存端点
const API_URL = 'https://capable-energy-production-bf2e.up.railway.app';

const testMap = {
  mapName: 'test-map-' + Date.now(),
  map: {
    width: 800,
    height: 600,
    gridSize: 32,
    cols: 25,
    rows: 19,
    layers: [
      { id: 'ground', name: '地面层', visible: true, locked: false },
      { id: 'objects', name: '物体层', visible: true, locked: false }
    ],
    objects: [],
    collisionAreas: []
  }
};

console.log('Testing map save endpoint...');
console.log('API URL:', API_URL);
console.log('Map name:', testMap.mapName);

fetch(`${API_URL}/api/map-editor/map`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testMap)
})
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    return response.text();
  })
  .then(text => {
    console.log('Response body:', text);
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.log('Not JSON response');
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
