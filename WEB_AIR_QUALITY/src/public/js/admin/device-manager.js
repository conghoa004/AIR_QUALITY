$(function () {
    // =========================
    // 1. Khởi tạo DataTable
    // =========================
    const table = $('#deviceTable').DataTable({
        dom: 'lrtip',
        order: [[0, 'desc']],
        columnDefs: [{ targets: -1, orderable: false, searchable: false }],
        language: {
            search: "Tìm kiếm:",
            lengthMenu: "Hiển thị _MENU_ dòng",
            info: "Hiển thị _START_ đến _END_ của _TOTAL_ dòng",
            paginate: { first: "Đầu", last: "Cuối", next: "Sau", previous: "Trước" },
            zeroRecords: "Không tìm thấy thiết bị phù hợp",
            infoEmpty: "Không có dữ liệu",
            infoFiltered: "(lọc từ _MAX_ dòng)"
        }
    });

    // =========================
    // 2. Tìm kiếm nhanh theo input #tableSearch
    // =========================
    $('#tableSearch').on('keyup', function () {
        table.search(this.value).draw();
    });
});