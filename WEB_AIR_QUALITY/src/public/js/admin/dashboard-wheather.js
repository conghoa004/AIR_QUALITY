// Lấy thông tin thời tiết
async function loadWeather() {
    try {
        // Trả cả 2 data về frontend
        const res = await fetch("/api/weather");
        const data = await res.json();

        // Weather hiện tại
        const weather = data.weather;
        const weatherMain = weather.weather[0].main.toLowerCase();

        let gradientStart = "#0D6EFD"; // mặc định
        let gradientEnd = "#5a9cff"; // mặc định

        if (weatherMain.includes("rain")) {      // mưa
            gradientStart = "#1E90FF";
            gradientEnd = "#00BFFF";
        } else if (weatherMain.includes("cloud")) { // mây
            gradientStart = "#6C757D";
            gradientEnd = "#ADB5BD";
        } else if (weatherMain.includes("clear")) { // nắng
            gradientStart = "#FFD700";
            gradientEnd = "#FFE066";
        } else if (weatherMain.includes("snow")) { // tuyết
            gradientStart = "#40E0D0";
            gradientEnd = "#AFEEEE";
        }

        // Gán màu cho thẻ weather hiện tại
        const weatherCard = document.querySelector("#weather-card");
        weatherCard.style.background = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;

        // Cập nhật thông tin thời tiết
        document.getElementById("weather-temp").textContent = Math.round(weather.main.temp) + "°C";
        document.getElementById("weather-desc").textContent = weather.weather[0].description;
        document.getElementById("weather-humidity").textContent = weather.main.humidity + "%";
        document.getElementById("weather-wind").textContent = weather.wind.speed + " m/s";
        document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

        // Forecast 5 ngày
        const forecastData = data.forecast;

        let forecastContainer = document.getElementById("forecast");
        forecastContainer.innerHTML = "";

        // Lấy 5 ngày đầu tiên
        const forecastByDay = {};

        forecastData.list.forEach(item => {
            const d = new Date(item.dt * 1000);
            const dateStr = d.toLocaleDateString("vi-VN"); // nhóm theo ngày
            if (!forecastByDay[dateStr]) forecastByDay[dateStr] = [];
            forecastByDay[dateStr].push(item);
        });

        // render 5 ngày đầu tiên
        Object.keys(forecastByDay).slice(0, 5).forEach(dateStr => {
            const dayList = forecastByDay[dateStr];
            const temps = dayList.map(d => d.main.temp);
            const tempMin = Math.round(Math.min(...temps));
            const tempMax = Math.round(Math.max(...temps));

            const weatherMain = dayList[0].weather[0].main.toLowerCase();
            let bgColor = "#0D6EFD";
            if (weatherMain.includes("rain")) bgColor = "#1E90FF";
            else if (weatherMain.includes("cloud")) bgColor = "#6C757D";
            else if (weatherMain.includes("clear")) bgColor = "#FFD700";
            else if (weatherMain.includes("snow")) bgColor = "#40E0D0";

            forecastContainer.innerHTML += `
                        <div class="forecast-card card shadow-sm rounded-3 text-center p-2 flex-fill" 
                            style="min-width:70px; background: ${bgColor}; color:#fff;">
                            <small class="text-light">${new Date(dayList[0].dt * 1000).toLocaleDateString("vi-VN", { weekday: "short" })}</small>
                            <img src="https://openweathermap.org/img/wn/${dayList[0].weather[0].icon}@2x.png" 
                                alt="icon" class="img-fluid" style="width:50px;height:50px;">
                            <div><b>${tempMin}°C - ${tempMax}°C</b></div>
                            <small>${dayList[0].weather[0].main}</small>
                        </div>
                    `;
        });

    } catch (e) {
        console.error("Lỗi load weather:", e);
    }
}

loadWeather();