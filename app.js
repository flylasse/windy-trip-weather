let apiKey = localStorage.getItem('windyApiKey') || '';

function saveApiKey() {
  const key = document.getElementById('apiKey').value.trim();
  if (key) {
    localStorage.setItem('windyApiKey', key);
    apiKey = key;
    showMessage('✅ API key saved!', 'success');
  } else {
    showMessage('Please enter a valid API key', 'error');
  }
}

function testApiKey() {
  if (!apiKey) {
    showMessage('Please enter and save your API key first', 'error');
    return;
  }
  showMessage('🧪 Testing API key...', 'info');
  fetchWeatherDataWithRetry(37.7749, -122.4194, new Date())
    .then((weather) => {
      showMessage(`✅ API test successful! SF today: ${weather.temperature}°C, ${weather.windSpeed} km/h wind`, 'success');
    })
    .catch((error) => {
      handleApiError(error);
    });
}

function loadSampleRoute() {
  fetch('/default.gpx')
    .then(res => res.text())
    .then(text => handleFile(new Blob([text], { type: 'text/xml' })))
    .catch(err => showMessage(`Error loading sample route: ${err.message}`, 'error'));
}

function handleFile(file) {
  showMessage(`Loaded file: ${file.name || 'Sample route'}`, 'success');
}

function showMessage(msg, type) {
  const el = document.getElementById('messages');
  el.innerHTML = `<div class=\"${type}\">${msg}</div>`;
}

async function fetchWeatherDataWithRetry(lat, lon, targetDate, retries = 3, delay = 1000) {
  const requestBody = {
    lat,
    lon,
    model: 'gfs',
    parameters: ['wind', 'temp', 'precip', 'rh', 'pressure'],
    levels: ['surface'],
    key: apiKey
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return processWeatherData(data, targetDate);
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delay * attempt));
      } else {
        handleApiError(err);
        throw new Error('Windy API failed after retries.');
      }
    }
  }
}

function handleApiError(error) {
  console.error('API error:', error);
  showMessage(`❌ Windy API error: ${error.message}`, 'error');
}
