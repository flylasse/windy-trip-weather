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
      showMessage(`✅ API test successful! SF today: ${weather.temperature}°F, ${weather.windSpeed} mph wind`, 'success');
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
  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target.result;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // Try all point types
    const trkpts = Array.from(xmlDoc.getElementsByTagName("trkpt"));
    const rtepts = Array.from(xmlDoc.getElementsByTagName("rtept"));
    const wpts = Array.from(xmlDoc.getElementsByTagName("wpt"));

    const allPts = trkpts.concat(rtepts, wpts);

    if (allPts.length === 0) {
      showMessage("No trackpoints, routepoints, or waypoints found in GPX.", "error");
      return;
    }

    showMessage(`Found ${allPts.length} points in GPX. Fetching weather...`, "info");

    allPts.forEach((pt, i) => {
      const lat = parseFloat(pt.getAttribute("lat"));
      const lon = parseFloat(pt.getAttribute("lon"));
      const timeEl = pt.getElementsByTagName("time")[0];
      let time = new Date();
      if (timeEl) {
        time = new Date(timeEl.textContent);
      }

      console.log(`Point ${i}: lat=${lat}, lon=${lon}, time=${time}`);

      fetchWeatherDataWithRetry(lat, lon, time)
        .then((weather) => {
          console.log(`Weather at point ${i}:`, weather);
          showMessage(`Point ${i + 1}: ${weather.temperature}°F, ${weather.windSpeed} mph`, "success");
        })
        .catch((err) => {
          console.error(err);
          showMessage(`Error fetching weather for point ${i + 1}: ${err.message}`, "error");
        });
    });
  };

  reader.readAsText(file);
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
    !Array.isArray(data['temp-surface'])
  ) {
    console.error("Windy API returned unexpected data:", data);
    throw new Error(
      data.message || 'Unexpected data format from Windy API.'
    );
  }

  const tempArr = data['temp-surface'];
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

  // Temperature conversion
  const tempC = tempArr[closestIndex] - 273.15;
  const tempF = Math.round((tempC * 9/5) + 32);

  // Defensive wind speed logic
  let windSpeedMps;

  if (Array.isArray(data["wind-surface"])) {
    windSpeedMps = data["wind-surface"][closestIndex];
    console.log("Using wind-surface data:", windSpeedMps);
  } else if (
    Array.isArray(data["wind_u-surface"]) &&
    Array.isArray(data["wind_v-surface"])
  ) {
    const u = data["wind_u-surface"][closestIndex];
    const v = data["wind_v-surface"][closestIndex];
    windSpeedMps = Math.sqrt(u * u + v * v);
    console.log("Calculated wind speed from U/V:", windSpeedMps);
  } else {
    console.error("Windy API missing wind data:", data);
    throw new Error("Wind data not found in API response.");
  }

  const windSpeedMph = Math.round(windSpeedMps * 2.23694);

  return {
    temperature: tempF,
    windSpeed: windSpeedMph
  };
}

function handleApiError(error) {
  console.error('API error:', error);
  showMessage(`❌ Windy API error: ${error.message}`, 'error');
}
