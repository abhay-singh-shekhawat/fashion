import axios from "axios"

const JAIPUR_LAT = 26.9124;
const JAIPUR_LON = 75.7873;

const getWeather = async()=>{
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${JAIPUR_LAT}&longitude=${JAIPUR_LON}&current=temperature_2m,is_day,weather_code&timezone=Asia%2FKolkata`
        const response = await axios.get(url)
        const data = response.data
        return {
            temperature: data.current.temperature_2m,
            isDay: data.current.is_day === 1,
            weatherCode: data.current.weather_code
        };
    } catch (error) {
        console.log("weather fetch failed",error.message)
        next(error)
    }
}

export default getWeather