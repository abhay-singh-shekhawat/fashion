import axios from 'axios';
import { getCache , setCache , generateCacheKey} from './cache.js';

const JAIPUR_LAT = 26.9124;
const JAIPUR_LON = 75.7873;
const WEATHER_KEY = generateCacheKey("weather","jaipur")
const WEATHER_TTL = 600

const getWeather = async () => {
  try {
    const cached = await getCache(WEATHER_KEY)
    if(cached){
      console.log("cached weather")
      return cached
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${JAIPUR_LAT}&longitude=${JAIPUR_LON}&current=temperature_2m,is_day,weather_code&timezone=Asia%2FKolkata`;
    
    const response = await axios.get(url, { timeout: 3000 }); // 3 second timeout
    const data = response.data;

    const weatherData = {
      temperature: data.current.temperature_2m,
      isDay: data.current.is_day === 1,
      weatherCode: data.current.weather_code,
      source: 'online'
    };

    const cache = await setCache(WEATHER_KEY,weatherData,WEATHER_TTL)
    return {
      weatherData
    };
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
      isDay,
      weatherCode: 0,
      source: 'offline_fallback',
      note: 'Using cached/offline rules (no internet)'
    };
  }
};

export default getWeather