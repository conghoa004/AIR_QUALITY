// =============================
// FIREBASE
// =============================
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, getDoc, doc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const airQualityCol = collection(db, "air_quality"); // tham chiếu collection

// Mảng stations sẽ lưu các trạm
let stations = [];

// Biến map
let map;

// Hàm khởi tạo MAP
function initMap() {
    map = L.map("airQualityMap",
        { zoomControl: false } // disable zoom control
    ).setView([10.762622, 106.660172], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }).addTo(map);

    // Add AQI Legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend');
        div.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        padding: 12px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Segoe UI', Tahoma, sans-serif;
        font-size: 12px;
        line-height: 18px;
        min-width: 160px;
    `;
        div.innerHTML = `
        <strong style="display: block; margin-bottom: 8px; font-size: 13px; color: #333;">AQI Levels</strong>
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <i style="background: #00E400; width: 16px; height: 16px; border-radius: 50%; margin-right: 6px;"></i> Good (0-50)
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <i style="background: #FFFF00; width: 16px; height: 16px; border-radius: 50%; margin-right: 6px;"></i> Moderate (51-100)
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <i style="background: #FF7E00; width: 16px; height: 16px; border-radius: 50%; margin-right: 6px;"></i> Unhealthy for Sensitive Groups (101-150)
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <i style="background: #FF0000; width: 16px; height: 16px; border-radius: 50%; margin-right: 6px;"></i> Unhealthy (151-200)
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <i style="background: #99004C; width: 16px; height: 16px; border-radius: 50%; margin-right: 6px;"></i> Very Unhealthy (201-300)
        </div>
        <div style="display: flex; align-items: center;">
            <i style="background: #7E0023; width: 16px; height: 16px; border-radius: 50%; margin-right: 6px;"></i> Hazardous (301+)
        </div>
        <div style="display: flex; align-items: center;">
            <i style="background: gray; width: 16px; height: 16px; border-radius: 50%; margin-right: 6px; margin-top: 4px;"></i> No Data
        </div>
    `;
        return div;
    };

    legend.addTo(map);
}

// Khởi tạo MAP
initMap();

// Hàm update trạm
function updateStation(data) {
    console.log("Dữ liệu trên Firebase:", data);
    let datetime;

    if (data.datetimeLocal instanceof Object && typeof data.datetimeLocal.toDate === "function") {
        // Nếu là Firestore Timestamp
        datetime = data.datetimeLocal.toDate();
    } else if (typeof data.datetimeLocal === "string") {
        // Nếu là chuỗi ISO (ví dụ "2025-10-17T07:12:01")
        datetime = new Date(data.datetimeLocal.endsWith("Z") ? data.datetimeLocal : data.datetimeLocal + "Z");
    } else {
        // Nếu không hợp lệ thì dùng giờ hiện tại
        datetime = new Date();
    }

    const formattedTime = datetime.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    const station = {
        sensor_id: data.sensor_id,
        name: `${data.area}`,
        coords: [data.latitude, data.longitude],
        data: {
            co: data.aqi_co || -1,
            no2: data.aqi_no2 || -1,
            so2: data.aqi_so2 || -1,
            o3: data.aqi_o3 || -1,
            pm10: data.aqi_pm10 || -1,
            pm25: data.aqi_pm25 || -1,
            aqi_total: data.aqi_total || -1
        },
        status: data.status || "offline",
        provider: data.provider,
        datetimeLocal: formattedTime
    };

    stations.push(station);
}

// Lắng nghe realtime
function liveData() {
    onSnapshot(airQualityCol, (snapshot) => {
        // Kiểm tra có mở chế độ live không
        const value = document.querySelector("#timeRangeButton").textContent.trim();
        if (value != "Live") {
            return;
        }

        stations = []; // reset mảng mỗi lần dữ liệu thay đổi

        snapshot.forEach(doc => {
            const data = doc.data();

            // Thêm mảng stations
            updateStation(data);
        });

        console.log("Stations array:", stations);

        updateMapMarkers(stations);
    });
}

liveData();

// =============================
// BẢN ĐỒ CHẤT LƯỢNG KHÔNG KHÍ
// =============================
// Lưu tất cả marker theo sensor_id để quản lý
const markers = {};

function updateMapMarkers(stations) {

    function getColor(aqi) {
        return aqi == -1 ? "gray" :
            aqi <= 50 ? "green" :       // Good
                aqi <= 100 ? "#FFFF00" :      // Moderate
                    aqi <= 150 ? "orange" :      // Unhealthy for Sensitive Groups
                        aqi <= 200 ? "red" :      // Unhealthy
                            aqi <= 300 ? "purple" :      // Very Unhealthy
                                "maroon";       // Hazardous
    }

    function getColor2(aqi) {
        return aqi == -1 ? "gray" :
            aqi <= 50 ? "green" :       // Good
                aqi <= 100 ? "#FFFF00; background: linear-gradient(135deg, #5993f7ff 0%, #0e67cdff 100%); padding: 6px; border-radius: 6px;" :      // Moderate
                    aqi <= 150 ? "orange" :      // Unhealthy for Sensitive Groups
                        aqi <= 200 ? "red" :      // Unhealthy
                            aqi <= 300 ? "purple" :      // Very Unhealthy
                                "maroon";       // Hazardous
    }

    // Lấy danh sách tất cả id sensor hiện tại từ dữ liệu mới
    const currentIds = stations.map(st => st.sensor_id);

    // Xoá các marker cũ không còn trong dữ liệu mới
    for (let id in markers) {
        if (!currentIds.includes(id)) {
            map.removeLayer(markers[id]);
            delete markers[id];
            console.log("Xoá marker không còn trong dữ liệu mới: ", id);
        }
    }

    // Xử lý dữ liệu trên map
    stations.forEach(st => {
        const id = st.sensor_id;  // dùng sensor_id làm key

        const popupHTML = `
                <div style="
                    width: 280px;
                    font-family: 'Segoe UI', Tahoma, sans-serif;
                    font-size: 13px;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    border: 1px solid rgba(0,0,0,0.08);
                    background: #fff;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #448efeff 0%, #0c4ce1ff 100%);
                        color: white;
                        font-weight: 600;
                        text-align: center;
                        padding: 14px 0;
                        font-size: 16px;
                        letter-spacing: 0.5px;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 12px;
                            transform: translateY(-50%);
                            font-size: 20px;
                        "></div>
                        <span style="position: relative; z-index: 1;">${st.name}</span>
                    </div>

                    <!-- Content -->
                    <div style="padding: 16px;">
                        <div style="
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                            width: 100%;
                        ">
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-bottom: 1px solid #f0f0f0;
                            ">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 14px;">🌫</span>
                                    <span>CO</span>
                                </span>
                                <span style="text-align: right; color: ${getColor2(st.data.co)}; font-weight: 600; font-size: 14px;">${st.data.co == -1 ? "N/A" : st.data.co.toFixed(2)} µg/m³</span>
                            </div>
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-bottom: 1px solid #f0f0f0;
                            ">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 14px;">💨</span>
                                    <span>NO₂</span>
                                </span>
                                <span style="text-align: right; color: ${getColor2(st.data.no2)}; font-weight: 600; font-size: 14px;">${st.data.no2 == -1 ? "N/A" : st.data.no2.toFixed(2)} µg/m³</span>
                            </div>
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-bottom: 1px solid #f0f0f0;
                            ">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 14px;">💨</span>
                                    <span>SO₂</span>
                                </span>
                                <span style="text-align: right; color: ${getColor2(st.data.so2)}; font-weight: 600; font-size: 14px;">${st.data.so2 == -1 ? "N/A" : st.data.so2.toFixed(2)} µg/m³</span>
                            </div>
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-bottom: 1px solid #f0f0f0;
                            ">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 14px;">☀️</span>
                                    <span>O₃</span>
                                </span>
                                <span style="text-align: right; color: ${getColor2(st.data.o3)}; font-weight: 600; font-size: 14px;">${st.data.o3 == -1 ? "N/A" : st.data.o3.toFixed(2)} µg/m³</span>
                            </div>
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-bottom: 1px solid #f0f0f0;
                            ">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 14px;">🌪</span>
                                    <span>PM₁₀</span>
                                </span>
                                <span style="text-align: right; color: ${getColor2(st.data.pm10)}; font-weight: 600; font-size: 14px;">${st.data.pm10 == -1 ? "N/A" : st.data.pm10.toFixed(2)} µg/m³</span>
                            </div>
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-radius: 8px;
                                margin-top: 4px;
                            ">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 14px;">🟢</span>
                                    <span style="font-weight: 500;">PM₂.₅</span>
                                </span>
                                <span style="text-align: right; font-weight: 600; color: ${getColor2(st.data.pm25)}; font-size: 14px;">${st.data.pm25 == -1 ? "N/A" : st.data.pm25.toFixed(2)} µg/m³</span>
                            </div>
                        </div>

                        <p style="text-align: center; margin-top: 12px; font-size: 12px; color: #999; font-style: italic;">Cập nhật lần cuối: ${st.datetimeLocal}</p>

                        <div style="text-align: center;">
                       <!-- <a 
                            href="/analytics?id=${st.sensor_id}"
                            style="
                                background: linear-gradient(135deg, #448efeff 0%, #0c4ce1ff 100%);
                                border: none;
                                color: white;
                                padding: 10px 20px;
                                border-radius: 12px;
                                font-size: 14px;
                                font-weight: 600;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                text-decoration: none;
                                gap: 8px;
                                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                                transition: all 0.3s ease;
                                position: relative;
                                overflow: hidden;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4);'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3);'"
                        >
                            <span style="
                                position: relative;
                                z-index: 1;
                            ">Xem chi tiết</span>
                            <span style="
                                position: absolute;
                                top: 0;
                                left: -100%;
                                width: 100%;
                                height: 100%;
                                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                                transition: 0.5s;
                            "></span>
                            <style>
                                button:hover span:last-child {
                                    left: 100%;
                                }
                            </style>
                        </a> -->
                    </div>
                    </div>
                </div>
                `;

        if (st.status === "offline") {
            console.log("Trạm offline: ", st.name);
            // nếu offline, remove marker nếu có
            if (markers[id]) {
                map.removeLayer(markers[id]);
                delete markers[id];
            }
            return; // bỏ qua
        }

        if (markers[id]) {
            // marker đã tồn tại, update vị trí và popup
            markers[id].setLatLng(st.coords);
            markers[id].setPopupContent(popupHTML);
            markers[id].setStyle({
                fillColor: getColor(st.data.aqi_total)  // Cập nhật màu mới theo AQI
            });

            console.log("Update trạm: ", st.name);
        } else {
            // marker mới, add vào map
            const circle = L.circleMarker(st.coords, {
                radius: 20, // Size based on AQI
                fillColor: getColor(st.data.aqi_total),
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.75
            }).addTo(map);

            circle.bindPopup(popupHTML, { closeButton: true, autoClose: true, className: 'custom-popup' });

            markers[id] = circle;

            console.log("Add trạm: ", st.name);
        }
    });
}

// Tìm kiếm trạm theo id
const search = document.querySelector("#mapSearchInput");

let debounceTimeout;

search.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const key = search.value.toLowerCase();

        // Tìm trạm khớp với input
        const match = stations.find(st =>
            st.status === "online" && (
                String(st.sensor_id).toLowerCase().includes(key) ||
                st.name.toLowerCase().includes(key)
            )
        );

        if (match) {
            // Set map tới trạm
            map.flyTo(match.coords, 15, {
                animate: true,
                duration: 2  // thời gian di chuyển 1 giây
            });

            // Mở popup nếu marker tồn tại
            const markerPopup = markers[match.sensor_id];
            if (markerPopup) {
                markerPopup.openPopup();
            }
        }
    }, 400); // debounce 300ms
});

// Chọn khoảng thời gian có sẵn
document.querySelectorAll(".time-range").forEach(item => {
    item.addEventListener("click", function (e) {
        e.preventDefault();
        const range = this.dataset.range;
        const text = this.textContent;

        // Cập nhật button
        document.getElementById("timeRangeButton").innerHTML = `<i class="bi bi-clock-history"></i> ${text}`;

        // Ẩn dropdown
        const dropdown = bootstrap.Dropdown.getInstance(document.getElementById("timeRangeButton"));
        dropdown.hide();

        // Xử lý khi người dùng chọn live
        if (range.trim() == "0") {
            liveData();
            return;
        }

        // Tính khoảng thời gian
        const now = moment().tz("Asia/Ho_Chi_Minh");
        const start = now.clone().subtract(range, "days").format("YYYY-MM-DD HH:mm:ss");
        const end = now.format("YYYY-MM-DD HH:mm:ss");

        // Xử lý logic lọc dữ liệu theo range...
        getAQI(start, end);
    });
});

// Call API
function getAQI(start, end) {
    fetch("/api/aqi", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "CSRF-Token": csrfToken
        },
        body: JSON.stringify({ start, end })
    })
        .then(response => response.json())
        .then(data => {
            stations = [];

            if (data.status == 401) {
                showToast('Lỗi', data.error, 'error');
                return;
            }

            if (Array.isArray(data)) {
                data.forEach(item => updateStation(item));
            } else if (data) {
                updateStation(data);
            }
            updateMapMarkers(stations);
        })
        .catch(error => {
            console.error("Error:", error);
        })
}
