import requests

def get_aqi_level(aqi: float) -> dict:
    """
    Trả về thông tin có cần gửi notification dựa trên AQI
    """
    if aqi <= 100:
        return None

    if aqi <= 150:
        return "Kém"

    if aqi <= 200:
        return "Xấu"

    if aqi <= 300:
        return "Rất xấu"

    return "Nguy hại"

def send_expo_push_notification(expo_push_token: str, title: str, body: str):
    """
    Gửi notification đến Expo push token
    """
    url = "https://exp.host/--/api/v2/push/send"
    payload = {
        "to": expo_push_token,
        "title": title,
        "body": body,
        "sound": "default"
    }

    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()  # Ném lỗi nếu status code >= 400
        return response.json()
    except requests.RequestException as e:
        print(f"Lỗi khi gửi notification: {e}")
        return None