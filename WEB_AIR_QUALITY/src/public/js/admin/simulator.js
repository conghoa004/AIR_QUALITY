// Mảng nodes mẫu
// const nodes = [
//     { sensor_id: "3276366", area: "Quận 8", location: "HCM", provider: "ProviderG", owner: "EnviroTech", timezone: "Asia/Ho_Chi_Minh", lat: 10.73, lon: 106.65 },
//     { sensor_id: "9128371", area: "Quận 7", location: "HCM", provider: "ProviderG", owner: "EnviroTech", timezone: "Asia/Ho_Chi_Minh", lat: 10.70, lon: 106.68 },
//     { sensor_id: "444912", area: "Bình Thạnh", location: "HCM", provider: "ProviderG", owner: "EnviroTech", timezone: "Asia/Ho_Chi_Minh", lat: 10.78, lon: 106.69 },
//     { sensor_id: "123456", area: "Tân Bình", location: "HCM", provider: "ProviderG", owner: "EnviroTech", timezone: "Asia/Ho_Chi_Minh", lat: 10.80, lon: 106.65 },
// ];

// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore
const db = getFirestore(app);

// Hàm load tất cả nodes từ Firestore
async function loadAllNodes() {
    const nodesCollection = collection(db, "air_quality");   // Collection tên "air_quality"
    const snapshot = await getDocs(nodesCollection);

    const results = [];
    snapshot.forEach((doc) => {
        results.push(doc.data());
    });

    return results;
}

// Call API
const getNodes = async () => {
    try {
        const response = await fetch('/simulator/nodes');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching nodes:', error);
        return [];
    }
};

// Biến lưu trữ nodes
let nodes;

window.onload = async () => {
    // Lấy nodes từ Firestore
    const nodesFromFirebase = await loadAllNodes();

    // Lấy nodes từ API MongoDB
    nodes = await getNodes();

    // Đồng bộ trạng thái nodes từ Firestore sang nodes từ API
    await nodes.forEach((node) => {
        nodesFromFirebase.forEach((fbNode) => {
            if (String(node.sensor_id) === String(fbNode.sensor_id)) {
                node.status = fbNode.status || "offline";
            }
        });
    });

    console.log('Fetched nodes:', nodes);

    // Tạo giao diện cho từng node
    const container = document.getElementById("nodeContainer");

    nodes.forEach((node, index) => {
        const card = document.createElement("div");
        card.id = `nodeCard${index}`;
        card.className = "col-xl-3 col-lg-6 col-md-6 col-sm-12";
        card.innerHTML = `
                <div class="card node-card h-100">
                    <div class="node-header">
                        <h6 class="card-title mb-1">
                            <i class="bi bi-sensor me-1"></i>
                            ${node.sensor_id}
                        </h6>
                        <small>${node.area}, ${node.location_name}</small>
                    </div>
                    <div class="node-info">
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted">Provider</small><br>
                                <strong>${node.provider}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Owner</small><br>
                                <strong>${node.owner_name}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Tọa độ</small><br>
                                <strong>${node.latitude.toFixed(2)}, ${node.longitude.toFixed(2)}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Múi giờ</small><br>
                                <strong>${node.timezone}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="sensors-section">
                        <div class="sensor-badges" id="sensorContainer${index}">
                            <!-- Thêm badges sensor ở đây qua JS của bạn -->
                        </div>
                        <button class="btn power-btn ${node.status === "online" ? "btn-danger" : "btn-success"}" id="powerBtn${index}">
                            <i class="bi bi-power me-1"></i> ${node.status === "online" ? "Tắt Node" : "Bật Node"}
                        </button>
                    </div>
                    <div class="config-section">
                        <h6 class="text-center mb-2 fw-bold text-muted">
                            <i class="bi bi-gear me-1"></i>Cấu hình
                        </h6>
                        ${["co", "no2", "so2", "pm25", "pm10", "o3"].map(sensor => `
                            <div class="slider-group disabled" id="sliderGroup${sensor}${index}">
                                <label class="slider-label">
                                    <i class="bi bi-${sensor === 'co' ? 'droplet-half' : sensor === 'no2' ? 'droplet' : sensor === 'so2' ? 'droplet-fill' : sensor === 'pm25' || sensor === 'pm10' ? 'cloud-fog' : 'cloud-lightning-rain'} me-1"></i>
                                    ${sensor.toUpperCase()}
                                    <span class="slider-value" id="${sensor}Setup${index}">0</span>
                                </label>
                                <input type="range" class="form-range" min="0" max="${sensor.includes('pm') ? (sensor === 'pm25' ? 200 : 500) : 3000}" step="1" id="${sensor}Slider${index}" value="0">
                            </div>
                        `).join("")}
                    </div>
                    <div class="footer-section">
                        <i class="bi bi-clock-history me-1"></i>${new Date().toLocaleString('vi-VN')}
                    </div>
                </div>
            `;
        container.appendChild(card);

        // Dữ liệu khởi tạo tương ứng với slider và badge
        const data = {
            co: 1200,
            no2: 1500,
            so2: 1800,
            pm25: 100,
            pm10: 250,
            o3: 120
        };

        const sensorContainer = document.getElementById(`sensorContainer${index}`);
        Object.keys(data).forEach(key => {
            const badge = document.createElement("span");
            const val = parseFloat(data[key]);
            let colorClass = "bg-info";
            let iconClass = "bi-info-circle-fill text-white me-1";
            if (key === "pm25" || key === "pm10" || key === "o3") {
                if (val > 150) {
                    colorClass = "bg-danger";
                    iconClass = "bi-exclamation-triangle-fill text-danger me-1";
                } else if (val > 100) {
                    colorClass = "bg-warning text-dark";
                    iconClass = "bi-exclamation-circle-fill text-warning me-1";
                } else {
                    colorClass = "bg-success";
                    iconClass = "bi-check-circle-fill text-success me-1";
                }
            }
            badge.className = `badge sensor-badge ${colorClass}`;
            badge.innerHTML = `<i class="${iconClass}"></i>${key.toUpperCase()}: ${val}`;
            sensorContainer.appendChild(badge);

            // Lưu badge vào data để dùng sau cho slider
            data[key + "_badge"] = badge;
        });

        // Power button events - Thêm nhiều sự kiện hơn
        let nodeOn = node.status === "online" ? true : false;
        const powerBtn = document.getElementById(`powerBtn${index}`);

        // Tự động gửi dữ liệu nếu node đang online khi tải trang
        if (nodeOn) {
            // Bắt đầu gửi dữ liệu mỗi 10 giây
            console.log(`Node ${node.sensor_id} đã bật – bắt đầu gửi dữ liệu MQTT`);

            sendingIntervals[index] = setInterval(() => {
                const values = {
                    co_avg: parseInt(document.getElementById(`coSlider${index}`).value),
                    no2_avg: parseInt(document.getElementById(`no2Slider${index}`).value),
                    so2_avg: parseInt(document.getElementById(`so2Slider${index}`).value),
                    pm25_avg: parseInt(document.getElementById(`pm25Slider${index}`).value),
                    pm10_avg: parseInt(document.getElementById(`pm10Slider${index}`).value),
                    o3_avg: parseInt(document.getElementById(`o3Slider${index}`).value),
                };

                publishSensorData(node, values);
            }, 10000);
        } else {
            // Tắt hiển thị node trên dashboard
            clearInterval(sendingIntervals[index]);

            console.log(`Node ${node.sensor_id} đã tắt – dừng gửi dữ liệu`);
        }

        // Nếu node đang online, kích hoạt slider và bắt đầu gửi dữ liệu
        powerBtn.addEventListener("click", async () => {
            nodeOn = !nodeOn;

            // Bát/ tắt node
            if (nodeOn) {
                powerBtn.innerHTML = '<i class="bi bi-power me-1"></i>Tắt Node';
                powerBtn.className = "btn power-btn btn-danger";

                document.querySelectorAll(`#nodeCard${index} .slider-group`)
                    .forEach(group => group.classList.remove('disabled'));

                console.log(`Node ${node.sensor_id} đã bật – bắt đầu gửi dữ liệu MQTT`);

                // Dữ liệu cập nhật trên firebase
                const node_info = {
                    sensor_id: node.sensor_id,
                    area: node.area,
                    location_name: node.location_name,
                    timezone: node.timezone,
                    latitude: node.latitude,
                    longitude: node.longitude,
                    owner_name: node.owner_name,
                    provider: node.provider,
                    status: "online",
                };

                // Cập nhật trạng thái node trên firebase
                await updateNodeStatus(node_info);

                // Bắt đầu gửi dữ liệu mỗi 10 giây
                sendingIntervals[index] = setInterval(() => {
                    const values = {
                        co_avg: parseInt(document.getElementById(`coSlider${index}`).value),
                        no2_avg: parseInt(document.getElementById(`no2Slider${index}`).value),
                        so2_avg: parseInt(document.getElementById(`so2Slider${index}`).value),
                        pm25_avg: parseInt(document.getElementById(`pm25Slider${index}`).value),
                        pm10_avg: parseInt(document.getElementById(`pm10Slider${index}`).value),
                        o3_avg: parseInt(document.getElementById(`o3Slider${index}`).value),
                    };

                    publishSensorData(node, values);
                }, 10000);

            } else {
                powerBtn.innerHTML = '<i class="bi bi-power me-1"></i>Bật Node';
                powerBtn.className = "btn power-btn btn-success";

                document.querySelectorAll(`#nodeCard${index} .slider-group`)
                    .forEach(group => group.classList.add('disabled'));

                // Dữ liệu cập nhật trên firebase
                const node_info = {
                    sensor_id: node.sensor_id,
                    area: node.area,
                    location_name: node.location_name,
                    timezone: node.timezone,
                    latitude: node.latitude,
                    longitude: node.longitude,
                    owner_name: node.owner_name,
                    provider: node.provider,
                    status: "offline",
                };

                // Cập nhật trạng thái node trên firebase
                await updateNodeStatus(node_info);

                // Tắt hiển thị node trên dashboard
                clearInterval(sendingIntervals[index]);

                console.log(`Node ${node.sensor_id} đã tắt – dừng gửi dữ liệu`);
            }

            powerBtn.style.transform = 'scale(0.98)';
            setTimeout(() => (powerBtn.style.transform = ''), 150);
        });

        powerBtn.addEventListener("mouseenter", () => {
            powerBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
        });
        powerBtn.addEventListener("mouseleave", () => {
            powerBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
        });

        // Slider events - Thêm nhiều sự kiện kéo thả (drag)
        ["co", "no2", "so2", "pm25", "pm10", "o3"].forEach(sensor => {
            const slider = document.getElementById(`${sensor}Slider${index}`);
            const display = document.getElementById(`${sensor}Setup${index}`);
            const group = document.getElementById(`sliderGroup${sensor}${index}`);
            const threshold = sensor.includes('pm') ? (sensor === 'pm25' ? 150 : 250) : 2000;

            slider.value = data[sensor];
            display.innerText = data[sensor];

            slider.addEventListener("input", (e) => {
                const val = parseInt(e.target.value);
                display.innerText = val;

                // Cập nhật badge
                const badge = data[sensor + "_badge"];
                let colorClass = "bg-info";
                let iconClass = "bi-info-circle-fill text-white me-1";

                if (sensor === "pm25" || sensor === "pm10" || sensor === "o3") {
                    if (val > 150) {
                        colorClass = "bg-danger";
                        iconClass = "bi-exclamation-triangle-fill text-danger me-1";
                    } else if (val > 100) {
                        colorClass = "bg-warning text-dark";
                        iconClass = "bi-exclamation-circle-fill text-warning me-1";
                    } else {
                        colorClass = "bg-success";
                        iconClass = "bi-check-circle-fill text-success me-1";
                    }
                }

                badge.className = `badge sensor-badge ${colorClass}`;
                badge.innerHTML = `<i class="${iconClass}"></i>${sensor.toUpperCase()}: ${val}`;

                // Thay đổi màu slider-group
                group.classList.remove('warning', 'danger');
                if (val > threshold) {
                    group.classList.add('danger');
                } else if (val > threshold * 0.7) {
                    group.classList.add('warning');
                }
            });
        });
    });
}

const mqttClient = mqtt.connect("ws://localhost:8083/mqtt", {
    username: "conghoa",
    password: "Hoa1234#"
});

mqttClient.on("connect", () => {
    console.log("MQTT đã kết nối WebSocket!");
});

// Thêm map lưu interval cho từng node
const sendingIntervals = {};

// Hàm gửi dữ liệu MQTT
function publishSensorData(node, values) {
    const payload = {
        sensor_id: parseInt(node.sensor_id),
        area: node.area,
        location_name: node.location_name,
        datetimeLocal: new Date().toISOString(),
        timezone: node.timezone,
        latitude: parseFloat(node.latitude),
        longitude: parseFloat(node.longitude),
        owner_name: node.owner_name,
        provider: node.provider,

        // Các giá trị sensor lấy từ slider
        co: values.co_avg,
        no2: values.no2_avg,
        so2: values.so2_avg,
        pm25: values.pm25_avg,
        pm10: values.pm10_avg,
        o3: values.o3_avg,
        unit: "µg/m³"
    };

    mqttClient.publish(`node/${node.sensor_id}`, JSON.stringify(payload), { qos: 1 });
    console.log("Đã gửi MQTT:", payload);
}

// Hàm cập nhật trạng thái node trên Firebase
async function updateNodeStatus(node_info) {
    await fetch("/simulator/status", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "CSRF-Token": csrfToken
        },
        body: JSON.stringify(node_info)
    })
        .then(response => response.json())
        .then(data => console.log("Cập nhật trạng thái node:", data))
        .catch(error => console.error("Lỗi khi cập nhật trạng thái node:", error));
}   