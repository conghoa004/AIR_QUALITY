import fetch from 'node-fetch';

// Lấy API key và city từ biến môi trường
const API_KEY = process.env.OPEN_WEATHER_API;
const CITY = process.env.CITY;

const apiController = {
    getWeather: async (req, res) => {
        try {
            // Weather hiện tại
            const resWeather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=vi`);
            const weatherData = await resWeather.json();

            // Forecast 5 ngày
            const resForecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric&lang=vi`);
            const forecastData = await resForecast.json();

            // Trả cả 2 data về frontend
            res.json({ weather: weatherData, forecast: forecastData });
        } catch (err) {
            res.status(500).json({ error: "Lỗi server" });
        }
    }
}

export default apiController;