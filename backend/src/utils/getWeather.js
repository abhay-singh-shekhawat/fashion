import axios from 'axios';
import { getCache , setCache , generateCacheKey} from './cache.js';

const JAIPUR_LAT = 26.9124;
const JAIPUR_LON = 75.7873;
const LOCATION = 'Jaipur';
const WEATHER_KEY = generateCacheKey("weather","jaipur")
const WEATHER_TTL = 600

/* Open-Meteo answers with WMO codes; the app needs words ("Light rain"), not 61. */
const WMO_CONDITIONS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Rain showers",
  82: "Violent rain showers",
  85: "Light snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

const describe = (code) => WMO_CONDITIONS[code] ?? "Clear sky";

/* Every caller reads temperature/condition/isDay straight off the result, so
   this always resolves to one flat object — the online path used to wrap it as
   { weatherData }, which left every field undefined on a cache miss. */
const getWeather = async () => {
  try {
    const cached = await getCache(WEATHER_KEY)
    if(cached){
      return {
        ...cached,
        condition: cached.condition ?? describe(cached.weatherCode),
        location: LOCATION,
        source: 'cache',
      }
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${JAIPUR_LAT}&longitude=${JAIPUR_LON}&current=temperature_2m,apparent_temperature,is_day,weather_code&timezone=Asia%2FKolkata`;

    const response = await axios.get(url, { timeout: 3000 }); // 3 second timeout
    const current = response.data.current;

    const weatherData = {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      condition: describe(current.weather_code),
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
      location: LOCATION,
      source: 'online'
    };

    await setCache(WEATHER_KEY, weatherData, WEATHER_TTL)
    return weatherData;
  } catch (err) {
    console.warn('Weather API failed, using offline fallback:', err.message);
    
    //Offline fallback
    const now = new Date();
    const hour = now.getHours();
    const isDay = hour >= 6 && hour <= 18;

    // Seasonal temperature (March in Jaipur ~22-32°C)
    const baseTemp = 24 + Math.floor(Math.random() * 9); // 24 to 32

    return {
      temperature: baseTemp,
      feelsLike: baseTemp,
      condition: "Clear sky",
      weatherCode: 0,
      isDay,
      location: LOCATION,
      source: 'offline_fallback',
      note: 'Using cached/offline rules (no internet)'
    };
  }
};

export default getWeather;
