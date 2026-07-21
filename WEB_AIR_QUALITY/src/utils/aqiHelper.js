// =======================================================
//              AQI CALCULATION (NODE.JS VERSION)
// =======================================================

/**
 * Dữ liệu ngưỡng AQI theo QĐ 1459/QĐ-TCMT (VN_AQI)
 * Đơn vị: µg/m3 (CO đã được đổi từ mg/m3 sang µg/m3)
 */
const AQI_BREAKPOINTS = {
    I_i: [0, 50, 100, 150, 200, 300, 400, 500],
    O3_1h_BP: [0, 160, 200, 300, 400, 800, 1000, 1200],
    O3_8h_BP: [0, 100, 120, 170, 210, 400, null, null],
    CO_BP: [0, 10000, 30000, 45000, 60000, 90000, 120000, 150000],
    NO2_BP: [0, 100, 200, 700, 1200, 2350, 3100, 3850],
    S02_BP: [0, 125, 350, 550, 800, 1600, 2100, 2630],
    PM10_BP: [0, 50, 150, 250, 350, 420, 500, 600],
    PM25_BP: [0, 25, 50, 80, 150, 250, 350, 500],
};

// ----------------------------------------------------------------------
//                               HÀM LÕI
// ----------------------------------------------------------------------

function calculateSinglePollutantAQI(Cx, pollutantType, isDailyO3_8h = false) {
    if (Cx == null) return null;

    let BP_i;
    switch (pollutantType) {
        case "O3_1h":
            BP_i = AQI_BREAKPOINTS.O3_1h_BP;
            break;
        case "O3_8h":
            BP_i = AQI_BREAKPOINTS.O3_8h_BP;
            if (isDailyO3_8h && Cx > 400) return null; // Quy tắc đặc biệt
            break;
        case "CO":
            BP_i = AQI_BREAKPOINTS.CO_BP;
            break;
        case "NO2":
            BP_i = AQI_BREAKPOINTS.NO2_BP;
            break;
        case "SO2":
            BP_i = AQI_BREAKPOINTS.S02_BP;
            break;
        case "PM10":
            BP_i = AQI_BREAKPOINTS.PM10_BP;
            break;
        case "PM25":
            BP_i = AQI_BREAKPOINTS.PM25_BP;
            break;
        default:
            return null;
    }

    const I_i = AQI_BREAKPOINTS.I_i;

    // 1. Nồng độ thấp
    if (Cx <= BP_i[0]) return I_i[0];

    // 2. Tìm khoảng [BP_i, BP_{i+1}]
    for (let i = 0; i < I_i.length - 1; i++) {
        const BP_current = BP_i[i];
        const BP_next = BP_i[i + 1];
        if (BP_next == null) continue;

        if (BP_current < Cx && Cx <= BP_next) {
            const I_current = I_i[i];
            const I_next = I_i[i + 1];

            const BP_diff = BP_next - BP_current;
            if (BP_diff === 0) return I_next;

            const AQIx =
                ((I_next - I_current) / BP_diff) * (Cx - BP_current) + I_current;
            return AQIx;
        }
    }

    // 3. Nồng độ cao hơn BP_max
    return I_i[I_i.length - 1];
}

// ----------------------------------------------------------------------
//                           HÀM BỔ TRỢ
// ----------------------------------------------------------------------

function calculateNowcast(hourlyValues) {
    const validValues = hourlyValues.filter((v) => v != null);
    const recentValues = hourlyValues.slice(0, 3).filter((v) => v != null);
    if (recentValues.length < 2) return null;
    if (validValues.length === 0) return null;

    const C_min = Math.min(...validValues);
    const C_max = Math.max(...validValues);

    const w_star = C_max > 0 ? C_min / C_max : 0;
    const w = Math.max(w_star, 0.5);

    let numerator = 0.0;
    let denominator = 0.0;

    for (let i = 0; i < recentValues.length; i++) {
        const c_i = hourlyValues[i];
        if (c_i != null) {
            const weight = Math.pow(w, i);
            numerator += weight * c_i;
            denominator += weight;
        }
    }

    if (denominator === 0.0) return null;
    return numerator / denominator;
}

// ----------------------------------------------------------------------
//                           HÀM TỔNG HỢP
// ----------------------------------------------------------------------

function calculateAQIHourly(co_1h, no2_1h, so2_1h, o3_1h, pm25_hourly, pm10_hourly) {
    const results = {};

    const pm25_nowcast = pm25_hourly ? calculateNowcast(pm25_hourly) : null;
    const pm10_nowcast = pm10_hourly ? calculateNowcast(pm10_hourly) : null;

    results.CO = calculateSinglePollutantAQI(co_1h, "CO");
    results.NO2 = calculateSinglePollutantAQI(no2_1h, "NO2");
    results.SO2 = calculateSinglePollutantAQI(so2_1h, "SO2");
    results.O3 = calculateSinglePollutantAQI(o3_1h, "O3_1h");

    if (pm25_nowcast != null)
        results.PM25 = calculateSinglePollutantAQI(pm25_nowcast, "PM25");
    if (pm10_nowcast != null)
        results.PM10 = calculateSinglePollutantAQI(pm10_nowcast, "PM10");

    const validAQIs = Object.values(results).filter((v) => v != null);
    if (validAQIs.length === 0)
        return { AQI_H: null, Details: results, Main_Pollutant: null };

    const maxAQI = Math.max(...validAQIs);
    const AQI_H = Math.round(maxAQI);

    const mainPollutant = Object.keys(results).reduce((a, b) =>
        (results[a] ?? -1) > (results[b] ?? -1) ? a : b
    );

    return { AQI_H, Details: results, Main_Pollutant: mainPollutant };
}

function calculateAQIDaily(
    co_max_1h, // max 1h trong ngày
    no2_max_1h, // max 1h trong ngày
    so2_max_1h, // max 1h trong ngày
    o3_max_1h, // max 1h trong ngày
    o3_max_8h, // max 8h trong ngày
    pm25_24h, // avg 24h trong ngày
    pm10_24h // avg 24h trong ngày
) {
    const results = {};

    results.PM25 = calculateSinglePollutantAQI(pm25_24h, "PM25");
    results.PM10 = calculateSinglePollutantAQI(pm10_24h, "PM10");
    results.CO = calculateSinglePollutantAQI(co_max_1h, "CO");
    results.NO2 = calculateSinglePollutantAQI(no2_max_1h, "NO2");
    results.SO2 = calculateSinglePollutantAQI(so2_max_1h, "SO2");

    // Lấy AQI cho O3 (Cần tính 2 giá trị MAX: 1h max và 8h max)
    if (o3_max_1h > o3_max_8h) {
        results.O3 = calculateSinglePollutantAQI(o3_max_1h, "O3_1h");
    }
    else {
        results.O3 = calculateSinglePollutantAQI(o3_max_8h, "O3_8h");
    }

    const validAQIs = Object.values(results).filter((v) => v != null);
    if (validAQIs.length === 0)
        return { AQI_D: null, Details: results, Main_Pollutant: null };

    const maxAQI = Math.max(...validAQIs);
    const AQI_D = Math.round(maxAQI);

    const mainPollutant = Object.keys(results).reduce((a, b) =>
        (results[a] ?? -1) > (results[b] ?? -1) ? a : b
    );

    return { AQI_D, Details: results, Main_Pollutant: mainPollutant };
}

// ----------------------------------------------------------------------
//                             TEST DEMO
// ----------------------------------------------------------------------

function test() {
    console.log("--- TEST CASE 1: AQI GIỜ ---");
    const hourly = calculateAQIHourly(
        10000.0, // CO
        120.0, // NO2
        100.0, // SO2
        136.1, // O3
        [20.6, 19.6, 22.4, 20.3, 16.5, 19.0, 16.5, 19.5, 23.5, 20.5, 24.7, 26.9],
        Array(12).fill(null)
    );
    console.log(hourly);

    console.log("\n--- TEST CASE 2: AQI NGÀY ---");
    const daily = calculateAQIDaily(
        15000.0, // CO
        130.8, // NO2
        100.0, // SO2
        114.6, // O3_1h
        89.3, // O3_8h
        55.7, // PM25_24h
        100.0 // PM10_24h
    );
    console.log(daily);
}

// =======================================================
//                        EXPORTS
// =======================================================

export {
    calculateSinglePollutantAQI,
    calculateNowcast,
    calculateAQIHourly,
    calculateAQIDaily,
    test
};
