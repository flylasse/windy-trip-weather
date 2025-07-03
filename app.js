let apiKey = localStorage.getItem('windyApiKey') || '';

window.onload = () => {
  const storedKey = localStorage.getItem('windyApiKey');
  if (storedKey) {
    document.getElementById('apiKey').value = storedKey;
    apiKey = storedKey;
  }
};

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
  fetch('./default.gpx')
    .then(res => res.text())
    .then(text => handleFile(new Blob([text], { type: 'text/xml' })))
    .catch(err => showMessage(`Error loading sample route: ${err.message}`, 'error'));
}

function handleFile(file) {
  showMessage(`Loaded file: ${file.name || 'Sample route'}`, 'success');
  // You'd normally parse the GPX content here.
}

function showMessage(msg, type) {
  const el = document.getElementById('messages');
  el.innerHTML = `<div class="${type}">${msg}</div>`;
}

async function fetchWeatherDataWithRetry(lat, lon, targetDate, retries = 3, delay = 1000) {
  const requestBody = {
    lat,
    lon,
    model: 'gfs',
    parameters: ['wind_u', 'wind_v', 'temp', 'precip', 'rh', 'pressure'],
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
      console.log("Windy API response:", data);

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

function processWeatherData(data, targetDate) {
  if (
    !Array.isArray(data['ts']) ||
    !Array.isArray(data['temp-surface']) ||
    !Array.isArray(data['wind_u-surface']) ||
    !Array.isArray(data['wind_v-surface'])
  ) {
    console.error("Windy API returned unexpected data:", data);
    throw new Error(
      data.message || 'Unexpected data format from Windy API.'
    );
  }

  const tempArr = data['temp-surface'];
  const windUArr = data['wind_u-surface'];
  const windVArr = data['wind_v-surface'];
  const times = data.ts;

  let closestIndex = 0;
  let minDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const forecastDate = new Date(times[i] * 1000);
    const diff = Math.abs(forecastDate - targetDate);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  const tempC = Math.round(tempArr[closestIndex] - 273.15);
  const u = windUArr[closestIndex];
  const v = windVArr[closestIndex];
  const windSpeed = Math.round(Math.sqrt(u * u + v * v) * 3.6);

  return {
    temperature: tempC,
    windSpeed: windSpeed
  };
}

function handleApiError(error) {
  console.error('API error:', error);
  showMessage(`❌ Windy API error: ${error.message}`, 'error');
}
