# 🌤️ Trip Weather Forecast

**A Progressive Web App for planning trips with accurate weather forecasts at each destination**

Transform your GPX routes into weather-aware travel plans with user-selected dates and detailed forecasts powered by the Windy API.

## 🚀 Features

### For Travelers
- **📁 Multiple File Support**: Import GPX routes, GPXD trip plans, or XML files
- **🌡️ Real-time Weather**: Get accurate forecasts using professional Windy.com weather data
- **📅 Flexible Date Planning**: Pick custom visit dates for each destination
- **⚡ Instant Updates**: Weather forecasts update live as you change dates
- **📱 Mobile-Friendly**: Responsive design works on phones, tablets, and desktop
- **💾 Trip Persistence**: Export your plans as GPXD files and re-import later
- **🔄 Round-trip Workflow**: Complete import → plan → export → re-import cycle

### For Developers
- **🏗️ Progressive Web App**: Offline capabilities with service worker caching
- **🔧 Clean Architecture**: Modular JavaScript with clear separation of concerns
- **📡 REST API Integration**: Robust Windy API integration with error handling
- **🎨 Modern UI**: CSS Grid/Flexbox responsive design with smooth animations
- **🐛 Debug-Friendly**: Comprehensive logging system for troubleshooting
- **📋 Extensible**: Easy to add new weather parameters or data sources

## 📖 User Guide

### Getting Started

1. **Get API Key**
   - Visit [api.windy.com](https://api.windy.com) and register for a free API key
   - Enter your API key in the app and click "Save API Key"
   - Test your key with the "🧪 Test API" button

2. **Load Your Route**
   - **Option A**: Click "🗺️ Sample Route" to try the built-in Western US road trip
   - **Option B**: Click "📁 Upload GPX" to upload your own route file
   - **Option C**: Click "📂 Import GPXD" to reload a previously saved trip plan

3. **Plan Your Dates**
   - Each waypoint initially shows today's weather forecast
   - Click the date picker or use Prev/Next buttons to select your visit date
   - Use bulk controls: "📅 All Today" or "🗓️ Sequential Days" for quick setup
   - Weather forecasts update automatically when you change dates

4. **Export Your Plan**
   - Click "📥 Export as GPXD" to download your trip plan
   - The GPXD file contains waypoints, dates, and weather forecasts
   - Re-import this file later to continue planning or share with others

### Understanding Weather Data

Each waypoint displays:
- **🌡️ Temperature**: In Celsius 
- **💨 Wind Speed**: In km/h
- **📊 Pressure**: In hPa (hectopascals)
- **💧 Humidity**: As percentage
- **🌧️ Precipitation**: Expected rainfall in mm
- **⏰ Forecast Time**: Exact timestamp of the forecast data

**Time Offset**: The app shows how many hours the forecast differs from your requested date (±Xh indicator).

### File Formats Supported

#### GPX (GPS Exchange Format)
```xml
<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <rte>
    <rtept lat="38.1077" lon="-122.5715">
      <name>1</name>
    </rtept>
    <!-- More route points... -->
  </rte>
</gpx>
```

#### GPXD (GPX with Dates - Custom Format)
```xml
<?xml version="1.0"?>
<gpxd version="1.0" xmlns="http://flylasse.github.io/gpxd/1.0">
  <trip>
    <waypoint lat="38.1077" lon="-122.5715">
      <n>San Francisco</n>
      <arrival>2025-07-15T10:00:00Z</arrival>
      <departure>2025-07-16T10:00:00Z</departure>
      <weather>
        <temperature>22</temperature>
        <windSpeed>15</windSpeed>
        <!-- More weather data... -->
      </weather>
    </waypoint>
  </trip>
</gpxd>
```

## 🛠️ Developer Guide

### Architecture Overview

```
Trip Weather App
├── Frontend (Single Page Application)
│   ├── HTML5 + CSS3 (Responsive Design)
│   ├── Vanilla JavaScript (ES6+)
│   └── Progressive Web App (PWA)
├── External APIs
│   └── Windy Point Forecast API v2
└── File Processing
    ├── GPX Parser (DOMParser)
    ├── GPXD Parser/Generator
    └── Weather Data Integration
```

### Core Components

#### 1. File Processing (`parseGPX()`)
```javascript
function parseGPX(gpxText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxText, 'text/xml');
    
    // Handles multiple formats:
    // - Standard GPX waypoints (<wpt>)
    // - Route points (<rtept>) - Windy exports
    // - Track points (<trkpt>) - GPS devices
    // - GPXD waypoints with dates (<waypoint>)
    
    return waypoints; // Array of {lat, lon, name, type, selectedDate}
}
```

#### 2. Weather API Integration (`fetchWeatherData()`)
```javascript
async function fetchWeatherData(lat, lon, targetDate) {
    const requestBody = {
        lat: lat,
        lon: lon,
        model: 'gfs',
        parameters: ['wind', 'temp', 'precip', 'rh', 'pressure'],
        levels: ['surface'],
        key: apiKey
    };
    
    const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    
    // Processes timestamp arrays and finds closest forecast to target date
    return processedWeatherData;
}
```

#### 3. Date Management
```javascript
// Each waypoint has a user-selectable date
const waypoint = {
    lat: 37.7749,
    lon: -122.4194,
    name: "San Francisco",
    selectedDate: new Date(), // User controls this
    weather: { /* forecast data */ }
};

// Date changes trigger immediate weather updates
async function updateWaypointDate(index, newDateStr) {
    const newWeather = await fetchWeatherData(lat, lon, newDate);
    // Update UI with new forecast
}
```

#### 4. GPXD Export/Import
```javascript
function generateGPXD(weatherData) {
    // Creates XML with:
    // - Waypoint coordinates and names
    // - User-selected arrival/departure dates  
    // - Embedded weather forecast data
    // - Trip metadata and preferences
    
    return gpxdXmlString;
}
```

### Key Functions Reference

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `parseGPX(gpxText)` | Parse GPX/GPXD files | XML string | Waypoint array |
| `fetchWeatherData(lat, lon, date)` | Get weather forecast | Coordinates + date | Weather object |
| `displayWeatherData(data)` | Render UI | Waypoint array | DOM updates |
| `updateWaypointDate(index, date)` | Change waypoint date | Index + date string | Updated forecast |
| `generateGPXD(data)` | Export trip plan | Weather data array | GPXD XML |
| `exportToGPXD()` | Download trip file | None | File download |

### API Configuration

#### Windy API Setup
```javascript
const requestBody = {
    lat: 37.7749,           // Latitude (-90 to 90)
    lon: -122.4194,         // Longitude (-180 to 180)
    model: 'gfs',           // Weather model (gfs, ecmwf, nam)
    parameters: [           // Weather parameters to fetch
        'wind',             // Wind speed (m/s)
        'temp',             // Temperature (Kelvin)
        'precip',           // Precipitation (mm)
        'rh',               // Relative humidity (%)
        'pressure'          // Atmospheric pressure (Pa)
    ],
    levels: ['surface'],    // Altitude levels
    key: 'YOUR_API_KEY'     // Windy API key
};
```

#### Data Processing
```javascript
// Convert API units to user-friendly format
const temp = Math.round(data['temp-surface'][index] - 273.15); // K → °C
const windSpeed = Math.round(data['wind-surface'][index] * 3.6); // m/s → km/h
const pressure = Math.round(data['pressure-surface'][index] / 100); // Pa → hPa
```

### PWA Features

#### Service Worker (`sw.js`)
```javascript
const CACHE_NAME = 'trip-weather-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json'];

// Caches app shell for offline use
// Serves cached content when network unavailable
// Updates cache on new versions
```

#### Web App Manifest (`manifest.json`)
```json
{
  "name": "Trip Weather Forecast",
  "short_name": "TripWeather",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "icons": [/* PWA icons */]
}
```

### Error Handling

#### API Error Recovery
```javascript
try {
    const weather = await fetchWeatherData(lat, lon, date);
} catch (error) {
    // Fallback: Show error state
    point.weather = { error: 'Failed to fetch weather data' };
    // Continue processing other waypoints
}
```

#### File Processing Validation
```javascript
// Validates file types, coordinates, dates
// Provides user-friendly error messages  
// Graceful degradation for malformed files
```

### Debug System

The app includes comprehensive logging:
```javascript
function debugLog(step, data, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${step.toUpperCase()}]`, data);
    
    // Also shows critical errors in UI for mobile debugging
    if (level === 'error') {
        showMessage(`DEBUG ERROR: ${step}`, 'error');
    }
}
```

Debug categories:
- `init` - App initialization
- `file-upload` - File processing
- `parsing` - GPX/GPXD parsing
- `weather-api` - API calls and responses
- `date-update` - Date changes
- `ui-loading` - Loading states

## 🔧 Installation & Deployment

### Local Development
```bash
# No build process required - vanilla HTML/CSS/JS
# Simply serve the files from any web server

# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed) 
npx serve .

# Or use any static file server
```

### Production Deployment
```bash
# Deploy to any static hosting service:
# - GitHub Pages
# - Netlify  
# - Vercel
# - Firebase Hosting
# - Traditional web hosting

# Files to deploy:
# - index.html
# - manifest.json
# - sw.js
# - default.gpx (sample route)
```

### Environment Variables
```javascript
// No server-side environment variables needed
// API key is stored in browser localStorage
// All processing happens client-side
```

## 🐛 Known Issues & Fixes

### ✅ **FIXED: Date Assignment Bug**
**Issue**: Default GPX route assigned consecutive days instead of user control
**Fix**: Removed automatic date spacing, all waypoints start with today's date

### ✅ **FIXED: Variable Reference Bug** 
**Issue**: `currentWeatherData` not properly updated
**Fix**: Added `currentWeatherData = weatherData` in `displayWeatherData()`

### ✅ **FIXED: Date Validation Issues**
**Issue**: Invalid dates defaulted to tomorrow  
**Fix**: Better date validation with sensible fallbacks

### ⚠️ **Current Limitations**
- **API Rate Limits**: No automatic retry logic for rate-limited requests
- **Forecast Range**: Limited to ~7-10 days ahead (Windy API limitation)
- **Offline Weather**: Cannot fetch new weather data without internet connection
- **Timezone Handling**: All dates processed in user's local timezone

### 🔄 **Workarounds**
- **Large Routes**: Process waypoints in batches with delays to avoid rate limiting
- **Future Dates**: Plan trips within the forecast window for best accuracy
- **Mobile Debug**: Use browser developer tools or check console logs

## 🚀 Future Enhancements

### Planned Features
- **📍 Interactive Map**: Visual route display with clickable waypoints
- **🌈 Weather Visualization**: Color-coded route based on weather conditions  
- **⚠️ Weather Alerts**: Highlight dangerous conditions (storms, extreme temps)
- **📊 Trip Statistics**: Weather summaries, best/worst days, recommendations
- **🔄 Auto-refresh**: Periodic weather updates for current trips
- **🌍 Multi-language**: Support for different languages and units
- **📱 Native Apps**: iOS/Android apps using Capacitor or similar
- **☁️ Cloud Sync**: Save trips to cloud storage for cross-device access

### Technical Improvements
- **🔄 API Retry Logic**: Automatic retry with exponential backoff
- **💾 Smart Caching**: Cache weather data to reduce API calls
- **⚡ Performance**: Virtual scrolling for large routes
- **🔐 Enhanced Security**: API key encryption in storage
- **📈 Analytics**: Usage tracking and performance monitoring
- **🧪 Testing**: Unit tests and integration tests
- **🏗️ Build Process**: TypeScript, bundling, minification

### Advanced Features
- **🤖 AI Recommendations**: Suggest optimal travel dates based on weather
- **📋 Packing Lists**: Generate weather-appropriate packing suggestions
- **🚗 Route Optimization**: Adjust route timing based on weather patterns
- **👥 Collaborative Planning**: Share and edit trips with travel companions
- **🔔 Weather Notifications**: Push notifications for weather changes
- **📸 Photo Integration**: Weather context for geotagged photos

## 📝 Version History

### Versioning Scheme
This project follows **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes, major new features, architecture changes
- **MINOR** (0.X.0): New features, enhancements, backwards-compatible changes  
- **PATCH** (0.0.X): Bug fixes, minor revisions, documentation updates

Examples:
- `1.3.1` → Bug fix to version 1.3.0
- `1.4.0` → New feature added to 1.3.x
- `2.0.0` → Major rewrite or breaking changes

### Release History

#### v1.3.0 (Current - Major Feature Release)
- ✅ **NEW**: User-controlled date selection with date pickers
- ✅ **NEW**: GPXD import/export functionality  
- ✅ **NEW**: Bulk date controls (All Today, Sequential Days)
- ✅ **NEW**: Enhanced UI with prev/next date buttons
- ✅ **FIXED**: Automatic date assignment issues (major workflow change)
- ✅ **IMPROVED**: Error handling and validation

#### v1.2.8 (Previous - Minor Feature Release)
- ✅ **CHANGED**: Removed auto-loading behavior
- ✅ **STABLE**: Basic GPX parsing and weather display
- ✅ **STABLE**: Windy API integration
- ✅ **STABLE**: PWA functionality

#### v1.0.0 (Initial Release)
- ✅ **NEW**: Basic GPX upload and parsing
- ✅ **NEW**: Weather API integration
- ✅ **NEW**: Simple date modification

### Upcoming Patch Releases (1.3.x)
- 🔄 **v1.3.1**: Fix API rate limiting edge cases
- 🔄 **v1.3.2**: Improve mobile date picker UX
- 🔄 **v1.3.3**: Add better error messages for invalid GPX files
- 🔄 **v1.3.4**: Fix timezone handling inconsistencies

## 🤝 Contributing

### For Users
- 🐛 **Report Bugs**: Use GitHub issues with detailed descriptions
- 💡 **Feature Requests**: Suggest improvements and new features  
- 📝 **Documentation**: Help improve user guides and tutorials
- 🧪 **Testing**: Try the app with different GPX files and routes

### For Developers
- 🔧 **Code Contributions**: Fork, develop, and submit pull requests
- 📖 **Documentation**: Improve technical documentation
- 🧪 **Testing**: Add unit tests and integration tests
- 🐛 **Bug Fixes**: Fix known issues and edge cases

### Development Setup
```bash
git clone https://github.com/[username]/windy-trip-weather
cd windy-trip-weather

# No build process - just open index.html
# Or serve locally for testing
python -m http.server 8000
```

## 📄 License

This project is open source. Check the repository for specific license terms.

## 🙏 Acknowledgments

- **Windy.com**: Weather data API
- **Contributors**: Community feedback and improvements
- **GPX Standard**: Open GPS data format
- **Web Standards**: Progressive Web App capabilities

## 📞 Support

- **Documentation**: This README and inline code comments
- **Issues**: GitHub repository issues section
- **API Support**: [Windy API Documentation](https://api.windy.com)
- **Web Standards**: [MDN Web Docs](https://developer.mozilla.org)

---

**Made with ❤️ for travelers who want to plan their trips with accurate weather forecasts**