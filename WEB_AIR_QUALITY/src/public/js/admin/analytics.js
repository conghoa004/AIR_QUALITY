// --- Chọn trạm ---
const stationBtn = document.getElementById("stationDropdown");
let selectedStation = null;

document.querySelectorAll(".station-option").forEach(item => {
    item.addEventListener("click", e => {
        e.preventDefault();

        // Xóa active cũ
        document.querySelectorAll(".station-option").forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        selectedStation = item.dataset.value;

        // Cập nhật text button
        const icon = stationBtn.querySelector("i").outerHTML;
        stationBtn.innerHTML = `${icon} ${item.textContent.trim()}`;

        // Ẩn dropdown
        const dropdown = bootstrap.Dropdown.getInstance(stationBtn);
    });
});

// --- Chọn khoảng thời gian ---
const timeBtn = document.getElementById("timeRangeDropdown");
let selectedRange = null;

document.querySelectorAll(".time-range").forEach(item => {
    item.addEventListener("click", e => {
        e.preventDefault();

        // Xóa active cũ
        document.querySelectorAll(".time-range").forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        selectedRange = item.dataset.range;

        // Cập nhật text button
        const icon = timeBtn.querySelector("i").outerHTML;
        timeBtn.innerHTML = `${icon} ${item.textContent.trim()}`;

        // Ẩn dropdown
        const dropdown = bootstrap.Dropdown.getInstance(timeBtn);
    });
});

// --- Custom range ---
document.getElementById("applyCustomRange").addEventListener("click", e => {
    e.preventDefault();
    const start = document.getElementById("startDateCustom").value;
    const end = document.getElementById("endDateCustom").value;

    if (!start || !end) {
        showToast("Lỗi", "Vui lòng chọn đủ ngày bắt đầu và kết thúc", "error");
        return;
    }
    if (start > end) {
        showToast("Lỗi", "Ngày bắt đầu phải trước ngày kết thúc", "error");
        return;
    }

    selectedRange = "custom";

    const icon = timeBtn.querySelector("i").outerHTML;
    timeBtn.innerHTML = `${icon} ${start} → ${end}`;

    // Ẩn dropdown
    const dropdown = bootstrap.Dropdown.getInstance(timeBtn);
});

// --- Nút áp dụng lọc ---
document.getElementById("applyFilterBtn").addEventListener("click", async () => {
    let startDate, endDate;

    if (selectedRange === "custom") {
        startDate = document.getElementById("startDateCustom").value;
        endDate = document.getElementById("endDateCustom").value;
    } else if (selectedRange !== null) {
        const now = moment().tz("Asia/Ho_Chi_Minh");
        const days = parseInt(selectedRange);
        startDate = days === 0 ? null : now.clone().subtract(days, "days").format("YYYY-MM-DD HH:mm:ss");
        endDate = days === 0 ? null : now.format("YYYY-MM-DD HH:mm:ss");
    }

    // Gọi API với filter
    showLoading();
    console.log("Lớc dữ liệu với filter:", selectedStation, startDate, endDate);
    await getAQI(selectedStation, startDate, endDate);
    await updateAQITable(fullAQIData);
    // Lấy dữu liệu cho biểu dồ top 10 khu vực có chát lượng AQI kém nhất
    await updateTop10Chart(startDate, endDate);
    // Dự đoán AQI 24h tiếp theo
    await updateForecastAqiChart(selectedStation);
    // Lấy info node hiện tại
    getNodeInfo(selectedStation);
    hideLoading();
});

// XỬ LÝ ẨN HIỆN LOADING
function showLoading() {
    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "flex";
}

function hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "none";
}

// HÀM LẤY THÔNG TIN TRẠM HIỆN TẠI
async function getNodeInfo(sensor_id) {
    await fetch("/analytics/node-info", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "CSRF-Token": csrfToken
        },
        body: JSON.stringify({
            sensor_id: sensor_id
        })
    }).then(res => res.json()).then(data => {
        if (data.length > 0) {
            console.log("Node info hiện tại:", data);
            document.getElementById("nameNode").textContent = "Số " + data[0].sensor_id + " - " + data[0].area + ", " + data[0].location_name;
            document.getElementById("nodeLocation").textContent = data[0].area;
            document.getElementById("location_lat_long").textContent = data[0].latitude + " / " + data[0].longitude;

            // Lấy chuỗi thời gian từ server
            const datetimeStr = data[0].datetimeLocal;

            // Thêm 'T' để Date hiểu đúng định dạng ISO
            const isoDatetime = datetimeStr.replace(" ", "T"); // -> "2025-11-01T06:00:00.000"

            // Chuyển thành đối tượng Date
            const datetimeObj = new Date(isoDatetime);

            // Hiển thị theo giờ Việt Nam
            document.getElementById("last_update").textContent =
                datetimeObj.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
        }
    }).catch(err => console.error(err));
}

// XỬ LÝ CHON NGÀY VÀ SO SÁNH TRẠM
const nowCompare = moment().tz("Asia/Ho_Chi_Minh");
let compareStartDate = nowCompare.clone().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss");
let compareEndDate = nowCompare.format("YYYY-MM-DD HH:mm:ss");

document.addEventListener("DOMContentLoaded", () => {
    const timeRangeBtn = document.querySelector(".time-range-btn-compare");
    const timeRangeOptions = document.querySelectorAll(".time-range-option-compare");
    const applyCustomBtn = document.getElementById("applyCustomRangeCompare");
    const startDateInput = document.getElementById("startDateCustomCompare");
    const endDateInput = document.getElementById("endDateCustomCompare");

    // Xử lý chọn option có sẵn (7,30,90,365 ngày)
    timeRangeOptions.forEach(option => {
        option.addEventListener("click", (e) => {
            e.preventDefault(); // chặn scroll lên đầu trang
            const range = option.getAttribute("data-range");
            const icon = option.querySelector("i").outerHTML;
            timeRangeBtn.innerHTML = `${icon} ${range} ngày`;

            compareStartDate = nowCompare.clone().subtract(parseInt(range), "days").format("YYYY-MM-DD HH:mm:ss");
            compareEndDate = nowCompare.format("YYYY-MM-DD HH:mm:ss");
        });
    });

    // Xử lý tùy chỉnh ngày
    applyCustomBtn.addEventListener("click", () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            showToast("Lỗi", "Vui lòng chọn ngày bắt đầu và kết thúc!", "error");
            return;
        }

        // Hiển thị dạng: 01/11 - 07/11
        const start = new Date(startDate);
        const end = new Date(endDate);
        const display = `${start.getDate().toString().padStart(2, "0")}/${(start.getMonth() + 1).toString().padStart(2, "0")} - ${end.getDate().toString().padStart(2, "0")}/${(end.getMonth() + 1).toString().padStart(2, "0")}`;

        timeRangeBtn.innerHTML = `<i class="bi bi-clock-history me-2"></i> ${display}`;

        compareEndDate = endDate;
        compareStartDate = startDate;
    });
});

// THỰC HIỆN SO SÁNH
document.getElementById("compareBtn").addEventListener("click", async () => {
    const id1 = document.getElementById("station1").value;
    const id2 = document.getElementById("station2").value;

    // Kiểm tra hợp lệ
    if (!id1 || !id2 || id1 === id2) {
        showToast("Lỗi", "Vui lòng chọn 2 trạm khác nhau để so sánh!", "error");
        return;
    }

    // Kiểm tra ngày hợp lệ
    if (compareStartDate >= compareEndDate) {
        showToast("Lỗi", "Ngày bắt đầu phải trước ngày kết thúc!", "error");
        return;
    }

    // Hoặc nếu bạn muốn làm việc với moment.js
    const startMoment = moment.tz(compareStartDate, "Asia/Ho_Chi_Minh").hour(moment().hour()).minute(moment().minute()).second(moment().second()).format("YYYY-MM-DD HH:mm:ss");
    const endMoment = moment.tz(compareEndDate, "Asia/Ho_Chi_Minh").hour(moment().hour()).minute(moment().minute()).second(moment().second()).format("YYYY-MM-DD HH:mm:ss");

    try {
        const response = await fetch("/analytics/compareNodes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            },
            body: JSON.stringify({
                sensor_id_1: parseInt(id1),
                sensor_id_2: parseInt(id2),
                start: startMoment,
                end: endMoment
            })
        });

        const data = await response.json();
        console.log("Kết quả so sánh:", data);

        if (data.error) {
            showToast("Lỗi", data.error, "error");
            return;
        }

        if (!data.result || data.result.length < 2) {
            showToast("Lỗi", "Dữ liệu trả về không hợp lệ!", "error");
            console.error("❌ Dữ liệu server:", data);
            return;
        }

        const [station1, station2] = data.result;

        // --- Hàm highlight giá trị cao hơn ---
        const highlightHigher = (id1, id2, val1, val2) => {
            const el1 = document.getElementById(id1);
            const el2 = document.getElementById(id2);

            el1.classList.remove("bg-success-subtle", "bg-danger-subtle");
            el2.classList.remove("bg-success-subtle", "bg-danger-subtle");

            const epsilon = 0.001; // khoảng sai số cho float

            if (val1 - val2 > epsilon) {
                el1.classList.add("bg-danger-subtle"); // trạm 1 cao hơn
            } else if (val2 - val1 > epsilon) {
                el2.classList.add("bg-danger-subtle"); // trạm 2 cao hơn
            } else {
                // gần như bằng nhau
                el1.classList.add("bg-danger-subtle");
                el2.classList.add("bg-danger-subtle");
            }
        };

        // --- Cập nhật trạm 1 ---
        document.getElementById("name1").textContent = `${station1.area} - ${station1.location_name}`;
        document.getElementById("loc1").textContent = `${station1.latitude} / ${station1.longitude}`;
        document.getElementById("aqi_total1").textContent = station1.aqi_total.toFixed(0);
        document.getElementById("aqi_co1").textContent = station1.co_avg.toFixed(2);
        document.getElementById("aqi_no21").textContent = station1.no2_avg.toFixed(2);
        document.getElementById("aqi_so21").textContent = station1.so2_avg.toFixed(2);
        document.getElementById("pm251").textContent = station1.pm25_avg.toFixed(2);
        document.getElementById("pm101").textContent = station1.pm10_avg.toFixed(2);
        document.getElementById("update1").textContent = formatDateTime(station1.last_update);

        // --- Cập nhật trạm 2 ---
        document.getElementById("name2").textContent = `${station2.area} - ${station2.location_name}`;
        document.getElementById("loc2").textContent = `${station2.latitude} / ${station2.longitude}`;
        document.getElementById("aqi_total2").textContent = station2.aqi_total.toFixed(0);
        document.getElementById("aqi_co2").textContent = station2.co_avg.toFixed(2);
        document.getElementById("aqi_no22").textContent = station2.no2_avg.toFixed(2);
        document.getElementById("aqi_so22").textContent = station2.so2_avg.toFixed(2);
        document.getElementById("pm252").textContent = station2.pm25_avg.toFixed(2);
        document.getElementById("pm102").textContent = station2.pm10_avg.toFixed(2);
        document.getElementById("update2").textContent = formatDateTime(station2.last_update);

        // --- So sánh và highlight ---
        highlightHigher("aqi_total1", "aqi_total2", station1.aqi_total, station2.aqi_total);
        highlightHigher("aqi_co1", "aqi_co2", station1.co_avg, station2.co_avg);
        highlightHigher("aqi_no21", "aqi_no22", station1.no2_avg, station2.no2_avg);
        highlightHigher("aqi_so21", "aqi_so22", station1.so2_avg, station2.so2_avg);
        highlightHigher("pm251", "pm252", station1.pm25_avg, station2.pm25_avg);
        highlightHigher("pm101", "pm102", station1.pm10_avg, station2.pm10_avg);

        showToast("Thành công", "Đã cập nhật dữ liệu so sánh và highlight chỉ số cao hơn!", "success");

    } catch (err) {
        console.error("Lỗi khi so sánh trạm:", err);
        showToast("Lỗi", "Không thể tải dữ liệu so sánh!", "error");
    }
});

// Hàm định dạng thời gian (YYYY-MM-DD hh:mm:ss -> 21/10/2025 - 19:00)
function formatDateTime(datetimeStr) {
    if (!datetimeStr) return "Không có dữ liệu";
    const d = new Date(datetimeStr);
    return d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

// XỬ LÝ DROPDOWN CHỌN TRẠM SO SÁNH
document.addEventListener("DOMContentLoaded", () => {
    // Xử lý cho dropdown trạm 1
    document.querySelectorAll(".station-option-compare").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();

            const value = item.getAttribute("data-value");
            const name = item.getAttribute("data-name");

            // Cập nhật text hiển thị
            const textElement = document.getElementById("station1Text");
            textElement.innerHTML = `<i class="bi bi-geo-alt-fill me-2 text-primary"></i>${name} - ${value}`;

            // Gán giá trị vào input ẩn
            document.getElementById("station1").value = value;
        });
    });

    // Xử lý cho dropdown trạm 2
    document.querySelectorAll(".station-option-compare-2").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();

            const value = item.getAttribute("data-value");
            const name = item.getAttribute("data-name");

            // Cập nhật text hiển thị
            const textElement = document.getElementById("station2Text");
            textElement.innerHTML = `<i class="bi bi-geo-alt-fill me-2 text-success"></i>${name} - ${value}`;

            // Gán giá trị vào input ẩn
            document.getElementById("station2").value = value;
        });
    });
});

// XỬ LÝ DỮ LIỆU KHI LOADING TRANG
window.addEventListener("load", async () => {
    // Tính khoảng thời gian 24h
    const now = moment().tz("Asia/Ho_Chi_Minh");
    const start = now.clone().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss");
    const end = now.format("YYYY-MM-DD HH:mm:ss");
    const parts = document.querySelector("#stationDropdown").textContent.trim().split("-");
    const lastPart = parts[parts.length - 1].trim(); // Lấy id trạm

    // Gán mặc định
    selectedStation = lastPart;

    // Mặc định 7 ngày nếu chưa chọn gì
    selectedRange = selectedRange || "7";

    // Hiển thị biểu đồ AQI theo thời gian
    await getAQI(lastPart, start, end);

    // Hiển thị dữ liệu bảng AQI
    await updateAQITable(fullAQIData);

    // Lấy dữu liệu cho biểu dồ top 10 khu vực có chát lượng AQI kém nhất
    await updateTop10Chart(start, end);

    // Dự đoán AQI 24h tiếp theo
    await updateForecastAqiChart(lastPart);

    // Lấy info node hiện tại cho chức năng so sánh
    getNodeInfo(lastPart);

    hideLoading();
});