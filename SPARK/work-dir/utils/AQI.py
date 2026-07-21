import math
from typing import List, Optional, Dict, Union

# Dữ liệu Bảng 2: Ngưỡng Nồng độ (BP_i) và Giá trị AQI (I_i) theo QĐ 1459/QĐ-TCMT
# Đơn vị: µg/m3 (trừ CO, BP được nhập ở đây đã chuyển đổi từ mg/m3 sang µg/m3 để đồng nhất)
AQI_BREAKPOINTS: Dict[str, List[Optional[Union[int, float]]]] = {
    "I_i":      [0,    50,    100,   150,   200,   300,   400,   500],
    "O3_1h_BP": [0,   160,    200,   300,   400,   800,  1000,  1200], 
    "O3_8h_BP": [0,   100,    120,   170,   210,   400,   None,  None], # Ngưỡng O3 8h (chỉ đến 400)
    "CO_BP":    [0, 10000,  30000, 45000, 60000, 90000, 120000, 150000],
    "NO2_BP":   [0,   100,    200,   700,  1200,  2350,  3100,  3850], 
    "SO2_BP":   [0,    125,    350,   550,   800,   1600,   2100,   2630],
    "PM10_BP":  [0,    50,    150,   250,   350,   420,   500,   600],
    "PM25_BP":  [0,    25,     50,    80,   150,   250,   350,   500] 
}

# ----------------------------------------------------------------------
#                               HÀM LÕI
# ----------------------------------------------------------------------

def calculate_single_pollutant_aqi(Cx: Optional[float], pollutant_type: str, is_daily_o3_8h: bool = False) -> Optional[float]:
    """
    Tính AQI cho một thông số (AQI_x) bằng nội suy tuyến tính (Công thức 1).
    :param Cx: Giá trị nồng độ của thông số (C_x) (µg/m3).
    :param pollutant_type: 'CO', 'NO2', 'PM25', 'PM10', 'O3_1h', 'O3_8h'.
    :param is_daily_o3_8h: True nếu đang tính AQI ngày cho O3 8h (để áp dụng quy tắc Cx > 400).
    :return: Giá trị AQI thông số (float) hoặc None nếu Cx là None/không hợp lệ.
    """
    if Cx is None:
        return None

    # Lựa chọn BP (Breakpoints) theo loại thông số
    if pollutant_type == 'O3_1h':
        BP_i = AQI_BREAKPOINTS["O3_1h_BP"]
    elif pollutant_type == 'O3_8h':
        BP_i = AQI_BREAKPOINTS["O3_8h_BP"]
        # Quy tắc đặc biệt cho O3 Ngày (8h): không tính AQI nếu C_x > 400 µg/m3
        if is_daily_o3_8h and Cx > 400:
            return None
    elif pollutant_type == 'CO':
        BP_i = AQI_BREAKPOINTS["CO_BP"]
    elif pollutant_type == 'NO2':
        BP_i = AQI_BREAKPOINTS["NO2_BP"]
    elif pollutant_type == 'PM10':
        BP_i = AQI_BREAKPOINTS["PM10_BP"]
    elif pollutant_type == 'PM25':
        BP_i = AQI_BREAKPOINTS["PM25_BP"]
    elif pollutant_type == 'SO2':
        BP_i = AQI_BREAKPOINTS["SO2_BP"]
    else:
        return None

    I_i = AQI_BREAKPOINTS["I_i"]
    num_levels = len(I_i)

    # 1. Xử lý trường hợp nồng độ thấp (Cx <= BP_min)
    if Cx <= BP_i[0]:
        return float(I_i[0])

    # 2. Tìm khoảng [BP_i, BP_{i+1}] chứa Cx
    for i in range(num_levels - 1):
        BP_current = BP_i[i]
        BP_next = BP_i[i+1]
        
        if BP_next is None:
            continue
            
        # Do BP_i là List[Optional[...]], cần kiểm tra kiểu dữ liệu cho tính toán
        BP_current_float = float(BP_current)
        BP_next_float = float(BP_next)
        
        if BP_current_float < Cx <= BP_next_float:
            I_current = float(I_i[i])
            I_next = float(I_i[i+1])
            
            # Công thức nội suy: AQIx = (I_next - I_current) / (BP_next - BP_current) * (Cx - BP_current) + I_current
            BP_diff = BP_next_float - BP_current_float
            if BP_diff == 0: 
                 return I_next
            
            aqi_x = (I_next - I_current) / BP_diff * (Cx - BP_current_float) + I_current
            return aqi_x

    # 3. Xử lý trường hợp nồng độ cao (Cx > BP_max)
    return float(I_i[-1]) # Trả về AQI 500

# ----------------------------------------------------------------------
#                           HÀM BỔ TRỢ
# ----------------------------------------------------------------------

def calculate_nowcast(hourly_values: List[Optional[float]]) -> Optional[float]:
    """
    Tính giá trị Nowcast cho PM2.5 hoặc PM10 (Công thức 2).
    :param hourly_values: Danh sách 12 giá trị trung bình 1 giờ gần nhất [c1, c2, ..., c12].
    :return: Giá trị Nowcast (float) hoặc None nếu không đủ dữ liệu/không hợp lệ.
    """
    valid_values = [v for v in hourly_values if v is not None]
    
    # Yêu cầu: Phải có tối thiểu 2 trong 3 giá trị gần nhất
    recent_values = [v for v in hourly_values[:3] if v is not None]
    if len(recent_values) < 2:
        return None

    if not valid_values:
        return None

    # Tìm C_min và C_max trong 12 giá trị hợp lệ
    C_min = min(valid_values)
    C_max = max(valid_values)

    # Tính w* và xác định w
    w_star = C_min / C_max if C_max > 0 else 0
    w = max(w_star, 0.5) # w = max(w*, 0.5)

    numerator = 0.0
    denominator = 0.0

    # Tính Nowcast
    for i in range(len(recent_values)):
        c_i = hourly_values[i]
        
        if c_i is not None:
            # Trọng số: w^(i) (i chạy từ 0 đến 11, tương ứng w^0 đến w^11)
            # Lưu ý: VN_AQI dùng w^(i-1) nếu i=1..12. Tương đương w^i nếu i=0..11
            weight = math.pow(w, i) 
            numerator += weight * c_i
            denominator += weight
        
    if denominator == 0.0:
        return None

    nowcast = numerator / denominator
    return nowcast

# ----------------------------------------------------------------------
#                           HÀM TỔNG HỢP
# ----------------------------------------------------------------------

def calculate_aqi_hourly(
    co_1h: Optional[float], 
    no2_1h: Optional[float], 
    so2_1h: Optional[float],
    o3_1h: Optional[float], 
    pm25_hourly_data: Optional[List[Optional[float]]], # 12 giá trị cho Nowcast
    pm10_hourly_data: Optional[List[Optional[float]]]  # 12 giá trị cho Nowcast
) -> Dict[str, Union[int, None, str, Dict[str, Optional[float]]]]:
    """
    Tính AQI Giờ tổng hợp (AQI^h) cho một trạm.
    """
    aqi_results: Dict[str, Optional[float]] = {}
    
    # 1. Tính toán C_x cho PM (Nowcast)
    pm25_nowcast = None
    if pm25_hourly_data:
        pm25_nowcast = calculate_nowcast(pm25_hourly_data)
        
    pm10_nowcast = None
    if pm10_hourly_data:
        pm10_nowcast = calculate_nowcast(pm10_hourly_data)

    # 2. Tính AQI_x cho từng thông số
    aqi_results['CO'] = calculate_single_pollutant_aqi(co_1h, 'CO')
    aqi_results['NO2'] = calculate_single_pollutant_aqi(no2_1h, 'NO2')
    aqi_results['O3'] = calculate_single_pollutant_aqi(o3_1h, 'O3_1h')
    aqi_results['SO2'] = calculate_single_pollutant_aqi(so2_1h, 'SO2')
    
    # Sử dụng Nowcast cho PM
    if pm25_nowcast is not None:
        aqi_results['PM25'] = calculate_single_pollutant_aqi(pm25_nowcast, 'PM25')
    
    if pm10_nowcast is not None:
        aqi_results['PM10'] = calculate_single_pollutant_aqi(pm10_nowcast, 'PM10')

    # 3. Tính AQI Tổng hợp (AQI^h)
    valid_aqi_values = [v for v in aqi_results.values() if v is not None]
    
    if not valid_aqi_values:
        return {"AQI_H": None, "Details": aqi_results, "Main_Pollutant": None}

    # Chọn max và làm tròn
    aqi_hourly = max(valid_aqi_values)

    # Tìm thông số gây ô nhiễm chính
    main_pollutant = max(aqi_results, key=lambda key: aqi_results.get(key) if aqi_results.get(key) is not None else -1)

    return {
        "AQI_H": aqi_hourly,
        "Details": aqi_results,
        "Main_Pollutant": main_pollutant
    }

# ----------------------------------------------------------------------
def calculate_o3_8h_avg(o3_hourly_values: List[Optional[float]]) -> Optional[float]:
    """
    Tính giá trị trung bình trượt 8 giờ lớn nhất trong ngày cho O3 (µg/m3).
    :param o3_hourly_values: Danh sách 24 giá trị O3 1 giờ trong ngày (µg/m3)
    :return: Giá trị trung bình 8h lớn nhất (float) hoặc None nếu dữ liệu không đủ
    """
    valid_values = [v for v in o3_hourly_values if v is not None]
    if len(valid_values) < 8:
        return None  # không đủ dữ liệu 8h
    
    # Tính giá trị trung bình
    avg = 0
    for x in valid_values:
        avg += x
    return avg / 8

# ----------------------------------------------------------------------

def calculate_aqi_daily(
    co_max_1h: Optional[float], 
    no2_max_1h: Optional[float], 
    so2_max_1h: Optional[float],
    o3_max_1h: Optional[float], 
    o3_max_8h: Optional[float],    # Giá trị trung bình 8 giờ lớn nhất trong ngày
    pm25_24h: Optional[float],     # Giá trị trung bình 24 giờ
    pm10_24h: Optional[float],     # Giá trị trung bình 24 giờ
) -> Dict[str, Union[int, None, str, Dict[str, Optional[float]]]]:
    """
    Tính AQI Ngày tổng hợp (AQI^d).
    """
    aqi_results: Dict[str, Optional[float]] = {}
    
    # 1. Tính AQI_x cho PM (dùng TB 24 giờ)
    aqi_results['PM25'] = calculate_single_pollutant_aqi(pm25_24h, 'PM25')
    aqi_results['PM10'] = calculate_single_pollutant_aqi(pm10_24h, 'PM10')
    
    # 2. Tính AQI_x cho CO, NO2 (dùng TB 1 giờ lớn nhất trong ngày)
    aqi_results['CO'] = calculate_single_pollutant_aqi(co_max_1h, 'CO')
    aqi_results['NO2'] = calculate_single_pollutant_aqi(no2_max_1h, 'NO2')
    aqi_results['SO2'] = calculate_single_pollutant_aqi(so2_max_1h, 'SO2')

    # 3. Tính AQI cho O3 (Cần tính 2 giá trị MAX: 1h max và 8h max)
    if(o3_max_1h > o3_max_8h):
        aqi_results['O3'] = calculate_single_pollutant_aqi(o3_max_1h, 'O3_1h')
    else:
        aqi_results['O3'] = calculate_single_pollutant_aqi(o3_max_8h, 'O3_8h')
    
    # 4. Tính AQI Ngày Tổng hợp (max)
    valid_aqi_values = [v for v in aqi_results.values() if v is not None]
    
    if not valid_aqi_values:
        return {"AQI_D": None, "Details": aqi_results, "Main_Pollutant": None}

    max_aqi = max(valid_aqi_values)
    aqi_daily = int(round(max_aqi))

    # Tìm thông số gây ô nhiễm chính (chọn giữa O3_1h và O3_8h nếu đó là max)
    main_pollutant = max(aqi_results, key=lambda key: aqi_results.get(key) if aqi_results.get(key) is not None else -1)

    return {
        "AQI_D": aqi_daily,
        "Details": aqi_results,
        "Main_Pollutant": main_pollutant
    }

# ----------------------------------------------------------------------
#                             VÍ DỤ THỬ NGHIỆM
# ----------------------------------------------------------------------

if __name__ == '__main__':
    # --- TEST CASE 1: TÍNH AQI GIỜ (AQI^h) ---
    co_1h_test = 10000.0  # CO: 10 mg/m3
    no2_1h_test = 120.0
    so2_1h_test = 100.0
    o3_1h_test = 136.1
    # Dữ liệu 12 giờ cho PM2.5 (c1 là 20.6, c12 là 26.9)
    pm25_12h_data = [20.6, 19.6, 22.4, 20.3, 16.5, 19.0, 16.5, 19.5, 23.5, 20.5, 24.7, 26.9]
    pm10_12h_data = [None] * 12

    aqi_hourly_result = calculate_aqi_hourly(
        co_1h=co_1h_test, 
        no2_1h=no2_1h_test, 
        so2_1h=so2_1h_test,
        o3_1h=o3_1h_test, 
        pm25_hourly_data=pm25_12h_data,
        pm10_hourly_data=pm10_12h_data
    )

    print("--- KẾT QUẢ TEST 1: AQI GIỜ (AQI^h) ---")
    print(f"AQI Tổng hợp (AQI^h): {aqi_hourly_result['AQI_H']}") # KQ mong muốn: 60
    print(f"Thông số chính: {aqi_hourly_result['Main_Pollutant']}") 
    print(f"Chi tiết AQI: {aqi_hourly_result['Details']}")

    print("\n" + "="*50 + "\n")

    # --- TEST CASE 2: TÍNH AQI NGÀY (AQI^d) ---
    # Dữ liệu giả định (theo ví dụ mẫu, KQ mong muốn: 110 do PM2.5)
    
    # PM: TB 24h
    pm25_24h_test = 55.7  # TB 24h
    pm10_24h_test = 100.0
    
    # Khí: TB 1h Max trong ngày
    co_max_1h_test = 15000.0
    no2_max_1h_test = 130.8 
    so2_max_1h_test = 100.0
    
    # O3: Cả TB 1h Max và TB 8h Max
    o3_max_1h_test = 114.6
    o3_max_8h_test = 89.3 

    aqi_daily_result = calculate_aqi_daily(
        co_max_1h=co_max_1h_test, # max 1h trong ngày
        no2_max_1h=no2_max_1h_test, # max 1h trong ngày
        so2_max_1h=so2_max_1h_test, # max 1h trong ngày
        o3_max_1h=o3_max_1h_test, # max 1h trong ngày
        o3_max_8h=o3_max_8h_test, # max 8h trong ngày
        pm25_24h=pm25_24h_test, # avg 24h trong ngày
        pm10_24h=pm10_24h_test # avg 24h trong ngày
    )

    print("--- KẾT QUẢ TEST 2: AQI NGÀY (AQI^d) ---")
    print(f"AQI Tổng hợp (AQI^d): {aqi_daily_result['AQI_D']}") # KQ mong muốn: 110
    print(f"Thông số chính: {aqi_daily_result['Main_Pollutant']}")
    print(f"Chi tiết AQI: {aqi_daily_result['Details']}")