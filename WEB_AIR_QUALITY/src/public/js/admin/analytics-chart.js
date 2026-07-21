// Cấu hình biểu đồ ApexCharts
var options = {
    chart: {
        type: "area",
        height: 350,
        toolbar: { show: true },
        dropShadow: {
            enabled: true,
            top: 3,
            left: 2,
            blur: 4,
            opacity: 0.15
        }
    },
    series: [
        { name: "CO", data: [27, 28, 29, 30, 28, 27, 28] },
        { name: "NO₂", data: [60, 62, 64, 65, 63, 66, 65] },
        { name: "SO₂", data: [60, 62, 64, 65, 63, 66, 65] },
        { name: "O₃", data: [700, 750, 800, 820, 810, 790, 805] },
        { name: "PM₁₀", data: [300, 320, 340, 350, 360, 345, 355] },
        { name: "PM₂.₅", data: [300, 320, 340, 350, 360, 345, 355] }
    ],
    colors: ["#FF5733", "#FFC300", "#007BFF", "#9B59B6", "#28A745", "#DC3545"],
    stroke: { curve: "smooth", width: 3 },
    fill: {
        type: "gradient",
        gradient: {
            shadeIntensity: 0.3,
            opacityFrom: 0.6,
            opacityTo: 0.1,
            stops: [0, 100]
        }
    },
    markers: {
        size: 4,
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: { size: 7 }
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        labels: { style: { fontSize: "13px", colors: "#6c757d" } }
    },
    yaxis: {
        labels: { style: { fontSize: "13px", colors: "#6c757d" } }
    },
    legend: { show: false },
    tooltip: {
        shared: true,
        intersect: false,
        theme: "light"
    },
    grid: {
        borderColor: "#e9ecef",
        strokeDashArray: 4
    }
};

// Render chart vào đúng id
var chart = new ApexCharts(document.querySelector("#lineChart"), options);
chart.render();

// Bật / tắt chart bằng công tắc
document.getElementById("toggleChartSwitch").addEventListener("change", function () {
    document.getElementById("lineChartCardBody").style.display = this.checked ? "block" : "none";
});

// XỬ LÝ HIỂN THỊ CÁC BOX TRUNG BÌNH
async function updateAvgBox(aqiAvg) {
    // Lấy ID các box trung bình
    const co = document.getElementById("co");
    const no2 = document.getElementById("no2");
    const o3 = document.getElementById("o3");
    const so2 = document.getElementById("so2");
    const pm25 = document.getElementById("pm25")
    const pm10 = document.getElementById("pm10")

    co.textContent = Number(aqiAvg.co_avg).toFixed(2);
    no2.textContent = Number(aqiAvg.no2_avg).toFixed(2);
    o3.textContent = Number(aqiAvg.o3_avg).toFixed(2);
    so2.textContent = Number(aqiAvg.so2_avg).toFixed(2);
    pm25.textContent = Number(aqiAvg.pm25_avg).toFixed(2);
    pm10.textContent = Number(aqiAvg.pm10_avg).toFixed(2);
}

// HIỂN THỊ BIỂU ĐỒ AQI THEO TỪNG NGÀY
let fullAQIData = []; // Lưu trữ dữ liệu gốc từ server
async function getAQI(sensor_id, start, end) {
    try {
        const res = await fetch("/analytics/aqi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            },
            body: JSON.stringify({ sensor_id, start, end })
        });
        const data = await res.json();
        console.log("Dữ liệu AQI:", data);

        // Cập nhật bảng AQI
        await updateAvgBox(data.aqiAvg);

        // Hiển thị biểu đồ AQI
        fullAQIData = data.chart; // Lưu dữ liệu gốc
        updateAQIChart(fullAQIData); // Hiển thị chart lần đầu
    } catch (err) {
        console.error(err);
    }
}

// Cập nhật biểu đồ AQI
function updateAQIChart(aqiDataArray) {
    if (!aqiDataArray || aqiDataArray.length === 0) {
        // Nếu không có dữ liệu, hiển thị dòng trống
        chart.updateOptions({ xaxis: { categories: ["Không có dữ liệu"] } });
        chart.updateSeries([
            { name: "CO", data: [0] },
            { name: "NO₂", data: [0] },
            { name: "SO₂", data: [0] },
            { name: "O₃", data: [0] },
            { name: "PM₁₀", data: [0] },
            { name: "PM₂.₅", data: [0] },
            { name: "AQI Tổng", data: [0] }
        ]);
        return;
    }

    const categories = aqiDataArray.map(item => item.datetimeLocal);
    const series = [
        { name: "CO", data: aqiDataArray.map(item => item.aqi_co) },
        { name: "NO₂", data: aqiDataArray.map(item => item.aqi_no2) },
        { name: "SO₂", data: aqiDataArray.map(item => item.aqi_so2) },
        { name: "O₃", data: aqiDataArray.map(item => item.aqi_o3) },
        { name: "PM₁₀", data: aqiDataArray.map(item => item.aqi_pm10) },
        { name: "PM₂.₅", data: aqiDataArray.map(item => item.aqi_pm25) },
        { name: "AQI Tổng", data: aqiDataArray.map(item => item.aqi_total) }
    ];

    chart.updateOptions({ xaxis: { categories } });
    chart.updateSeries(series);
}

// HÀM CẬP NHẬT DỮ LIỆU BẢNG AQI
// Hàm xác định màu & nhãn theo chỉ số AQI
function getAQIColor(aqi) {
    aqi = parseFloat(aqi);
    if (aqi <= 50) return { color: "rgb(0,228,0)" };
    if (aqi <= 100) return { color: "rgb(255,255,0)" };
    if (aqi <= 150) return { color: "rgb(255,126,0)" };
    if (aqi <= 200) return { color: "rgb(255,0,0)" };
    if (aqi <= 300) return { color: "rgb(143,63,151)" };
    return { color: "rgb(126,0,35)" };
}

// Hàm cập nhật dữ liệu bảng AQI
async function updateAQITable(aqiDataArray) {
    const tableBody = document.getElementById("tableAQI");

    // Nếu DataTable đã tồn tại thì hủy trước
    if ($.fn.DataTable.isDataTable('#example')) {
        $('#example').DataTable().clear().destroy();
    }

    tableBody.innerHTML = ""; // Xóa dữ liệu cũ

    await aqiDataArray.forEach(item => {
        const row = document.createElement("tr");

        // Xử lý màu cho từng chỉ số
        const co = getAQIColor(item.aqi_co);
        const no2 = getAQIColor(item.aqi_no2);
        const so2 = getAQIColor(item.aqi_so2);
        const o3 = getAQIColor(item.aqi_o3);
        const pm10 = getAQIColor(item.aqi_pm10);
        const pm25 = getAQIColor(item.aqi_pm25);
        const total = getAQIColor(item.aqi_total);

        row.innerHTML = `
            <td>${item.sensor_id}</td>
            <td>${item.area} - ${item.location_name}</td>
            <td><span class="badge aqi-badge" style="background-color:${co.color}">${item.aqi_co}</span></td>
            <td><span class="badge aqi-badge" style="background-color:${no2.color}">${item.aqi_no2}</span></td>
            <td><span class="badge aqi-badge" style="background-color:${so2.color}">${item.aqi_so2}</span></td>
            <td><span class="badge aqi-badge" style="background-color:${o3.color}">${item.aqi_o3}</span></td>
            <td><span class="badge aqi-badge" style="background-color:${pm10.color}">${item.aqi_pm10}</span></td>
            <td><span class="badge aqi-badge" style="background-color:${pm25.color}">${item.aqi_pm25}</span></td>
            <td><span class="badge aqi-badge" style="background-color:${total.color}">${item.aqi_total}</span></td>
            <td>${item.datetimeLocal}</td>
        `;

        tableBody.appendChild(row);
    });

    // =========================
    // 1. Khởi tạo DataTable
    // =========================
    const table = $('#example').DataTable({
        dom: 'lrtip',
        order: [[0, 'desc']],
        columnDefs: [{ targets: 8, orderable: false, searchable: false }],
        columns: [
            { searchable: true }, // sensor_id
            { searchable: true }, // area
            { searchable: true }, // aqi_co
            { searchable: true }, // aqi_no2
            { searchable: true }, // aqi_so2
            { searchable: true }, // aqi_o3
            { searchable: true }, // aqi_pm10
            { searchable: true }, // aqi_pm25
            { searchable: true }, // aqi_total
            { searchable: true }, // datetimeLocal
        ],
        language: {
            search: "Tìm kiếm:",
            lengthMenu: "Hiển thị _MENU_ dòng",
            info: "Hiển thị _START_ đến _END_ của _TOTAL_ dòng",
            paginate: { first: "Đầu", last: "Cuối", next: "Sau", previous: "Trước" },
            zeroRecords: "Không tìm thấy dữ liệu phù hợp",
            infoEmpty: "Không có dữ liệu",
            infoFiltered: "(lọc từ _MAX_ dòng)"
        }
    });

    // =========================
    // 2. Tìm kiếm ngoài bảng
    // =========================
    $('#tableSearch').on('keyup change', function () {
        table.search(this.value).draw();
    });
}

// Lọc dữ liệu theo AQI Tổng trong biểu đồ
function filterAQIData(aqiDataArray, range) {
    if (range === 'all') return aqiDataArray;
    const [min, max] = range.split('-').map(Number);
    return aqiDataArray.filter(item => item.aqi_total >= min && item.aqi_total <= max);
}

// Lắng nghe filter thay đổi
document.getElementById('aqiFilter').addEventListener('change', function () {
    const filteredData = filterAQIData(fullAQIData, this.value);
    updateAQIChart(filteredData);
});

// === NÚT TẢI XUỐNG DỮ LIỆU EXCEL ===
document.getElementById("downloadChartBtn").addEventListener("click", function () {
    if (!fullAQIData || fullAQIData.length === 0) {
        alert("Không có dữ liệu để tải xuống!");
        return;
    }

    // Chuẩn bị dữ liệu export
    const exportData = fullAQIData.map(item => ({
        "Sensor_ID": item.sensor_id,
        "Location Name": item.area + " - " + item.location_name,
        "AQI_CO": item.aqi_co,
        "AQI NO₂": item.aqi_no2,
        "AQI_SO₂": item.aqi_so2,
        "AQI_O₃": item.aqi_o3,
        "AQI_PM₁₀": item.aqi_pm10,
        "AQI_PM₂.₅": item.aqi_pm25,
        "AQI_Total": item.aqi_total,
        "DateTime": item.datetimeLocal
    }));

    // Tạo workbook & worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Định dạng độ rộng cột
    ws['!cols'] = [
        { wch: 20 }, // Thời gian
        { wch: 10 }, // Sensor ID
        { wch: 20 }, // Khu vực
        { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
    ];

    // Thêm sheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, "AQI Data");

    // Tạo tên file (ví dụ: AQI_Data_2025-10-18_14-30.xlsx)
    const fileName = `AQI_Data_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.xlsx`;

    // Xuất file Excel
    XLSX.writeFile(wb, fileName);
});

// BIỂU ĐỒ TOP 10 KHU VỰC Ô NHIỄM
const topAreas = [
    // { location: "Quận 1, TP.HCM", aqiTotal: 82 },
    // { location: "Quận 3, TP.HCM", aqiTotal: 76 },
    // { location: "Quận 5, TP.HCM", aqiTotal: 69 },
    // { location: "Bình Thạnh, TP.HCM", aqiTotal: 65 },
    // { location: "Gò Vấp, TP.HCM", aqiTotal: 62 },
    // { location: "Phú Nhuận, TP.HCM", aqiTotal: 58 },
    // { location: "Tân Bình, TP.HCM", aqiTotal: 55 },
    // { location: "Thủ Đức, TP.HCM", aqiTotal: 50 },
    // { location: "Quận 10, TP.HCM", aqiTotal: 48 },
    // { location: "Quận 7, TP.HCM", aqiTotal: 45 }
];

const optionsColumn = {
    chart: {
        type: 'bar',
        height: 450,
        toolbar: { show: false },
        animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
        }
    },
    plotOptions: {
        bar: {
            horizontal: true,
            columnWidth: '55%',
            borderRadius: 10
        }
    },
    dataLabels: {
        enabled: true,
        style: { colors: ['#ffffffff'], fontSize: '13px', fontWeight: 'bold' },
        background: { enabled: true, foreColor: '#0026a1ff', padding: 4, borderRadius: 4, opacity: 0.8 },
        offsetY: 0
    },
    xaxis: {
        categories: topAreas.map(item => item.location),
        // labels: { rotate: -15, style: { fontSize: '13px', colors: '#495057' } },
        // title: { text: 'Khu vực', style: { fontWeight: 600 } }
    },
    yaxis: {
        // title: { text: 'AQI Tổng', style: { fontWeight: 600 } },
        // labels: { style: { fontSize: '13px', colors: '#495057' } }
    },
    series: [{
        name: 'AQI Tổng',
        data: topAreas.map(item => item.aqiTotal)
    }],
    colors: ['#ff8000ff'], // màu xanh biển cho tất cả cột
    tooltip: {
        shared: false,
        intersect: true,
        theme: 'dark',
        y: { formatter: val => `AQI: ${val}` }
    },
    grid: { borderColor: '#e9ecef', strokeDashArray: 4 },
    legend: { show: false },
    fill: {
        // type: 'gradient',
        // gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.3, opacityFrom: 0.9, opacityTo: 0.5, stops: [0, 100] }
    }
};

const chartColumn = new ApexCharts(document.querySelector("#top10Chart"), optionsColumn);
chartColumn.render();

// Hàm cập nhật biểu đồ Top 10
async function updateTop10Chart(start, end) {
    const newData = await fetchTop10(start, end);

    if (!Array.isArray(newData) || newData.length === 0) {
        console.warn('Không có dữ liệu AQI cho khoảng thời gian này.');

        // Xóa dữ liệu cũ
        chartColumn.updateOptions({
            xaxis: { categories: [] },
            series: [{ name: 'AQI Tổng', data: [] }]
        });

        return;
    }

    // Chuẩn hóa dữ liệu
    const categories = newData.map(item => item.location);
    const seriesData = newData.map(item => parseFloat(item.aqi_total));

    chartColumn.updateOptions({
        xaxis: { categories },
        series: [{ name: 'AQI Tổng', data: seriesData }]
    });
}

// Hàm lấy top 10 khu vụ có chát lượng AQI kém nhất
async function fetchTop10(start, end) {
    try {
        const response = await fetch('/analytics/top10-area', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ start, end }),
        });
        const data = await response.json();

        if (data) {
            return data;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error fetching AQI data:', error);
        return [];
    }
}


// BIỂU ĐỒ DỰ ĐOÁN AQI 24 GIỜ TIẾP THEO
const forecastAqiMock = {
    labels: [
        // "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
        // "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
        // "23:00", "00:00", "01:00", "02:00", "03:00", "04:00",
        // "05:00", "06:00", "07:00", "08:00", "09:00", "10:00"
    ],
    forecast_24h: [
        // 18.35, 16.52, 17.13, 16.98, 16.47, 18.34,
        // 21.65, 28.34, 27.66, 27.15, 23.93, 20.48,
        // 19.43, 18.17, 18.31, 19.50, 18.97, 19.31,
        // 27.45, 27.79, 28.38, 27.78, 21.23, 20.64
    ]
};

// =========================
// CHART CONFIG (ĐỔI TÊN options)
// =========================
const forecastAqiOptions = {
    chart: {
        type: "area",
        height: 350,
        toolbar: { show: true },
        animations: {
            enabled: true,
            easing: "easeinout",
            speed: 800
        }
    },

    series: [{
        name: "AQI dự đoán 24h",
        data: forecastAqiMock.forecast_24h
    }],

    colors: ["#1E69B5"],

    stroke: {
        curve: "smooth",
        width: 3
    },

    fill: {
        type: "gradient",
        gradient: {
            shadeIntensity: 0.4,
            opacityFrom: 0.6,
            opacityTo: 0.1,
            stops: [0, 100]
        }
    },

    dataLabels: { enabled: false },

    xaxis: {
        categories: forecastAqiMock.labels,
    },

    yaxis: {
    },

    tooltip: {
        theme: "light",
        y: {
            formatter: val => `${val.toFixed(2)} AQI`
        }
    },

    grid: {
        borderColor: "#e9ecef",
        strokeDashArray: 4
    },

    legend: { show: false }
};

// =========================
// RENDER CHART
// =========================
const forecastAqiChart = new ApexCharts(
    document.querySelector("#forecastChart"),
    forecastAqiOptions
);

forecastAqiChart.render();

// HÀM CẬP NHẬT BIỂU ĐÒ
async function updateForecastAqiChart(sensor_id) {
    // Lây dữ liệu dự đoán 24 giờ tiếp theo từ server
    const data = await getAQIForecast(sensor_id);

    // Lấy giá trị bên server trả về
    const labels = data.labels;
    const forecast_24h = data.forecast_24h;

    forecastAqiChart.updateOptions({
        xaxis: {
            categories: labels
        }
    });

    forecastAqiChart.updateSeries([
        {
            name: "AQI dự đoán 24h",
            data: forecast_24h.map(v => parseFloat(v))
        }
    ]);
}

// HÀM LẤY DỮ LIỆU TỪ SERVER
async function getAQIForecast(sensor_id) {
    try {
        const response = await fetch('https://ai.hoavan.id.vn/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sensor_id }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching AQI forecast:', error);
        return [];
    }
}