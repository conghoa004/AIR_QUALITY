$(function () {
    // =========================
    // 1. Khởi tạo DataTable
    // =========================
    const table = $('#example').DataTable({
        dom: 'lrtip',
        order: [[0, 'desc']],
        columnDefs: [{ targets: -1, orderable: false, searchable: false }],
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

    // =========================
    // 3. Tooltip helper
    // =========================
    function initTooltip() {
        $('[data-bs-toggle="tooltip"]').each(function () {
            new bootstrap.Tooltip(this);
        });
    }

    // =========================
    // 4. Validation helper
    // =========================
    const validators = {
        userName: value => {
            const name = (value || '').trim();
            if (!name) return 'Vui lòng nhập tên.';
            if (!/^[A-Za-zÀ-Ỵà-ỵĂăÂâÊêÔôƠơƯưĐđ\s]+$/.test(name)) return 'Tên chỉ gồm chữ cái và khoảng trắng.';
            if (name.split(/\s+/).filter(Boolean).length < 2) return 'Tên phải có ít nhất 2 từ.';
            return '';
        },
        userEmail: value => {
            if (!value?.trim()) return 'Vui lòng nhập email.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) return 'Email không hợp lệ.';
            return '';
        },
        userRole: value => value ? '' : 'Vui lòng chọn vai trò.',
        userStatus: value => value ? '' : 'Vui lòng chọn trạng thái.'
    };

    function showFieldError($field, msg) {
        $field.addClass('is-invalid');
        const $wrapper = $field.closest('.form-floating').length ? $field.closest('.form-floating') : $field.parent();
        let $feedback = $wrapper.children('.invalid-feedback');
        if (!$feedback.length) $feedback = $('<div class="invalid-feedback"></div>').appendTo($wrapper);
        $feedback.text(msg);
    }

    function clearFieldError($field) {
        $field.removeClass('is-invalid is-valid');
        const $wrapper = $field.closest('.form-floating').length ? $field.closest('.form-floating') : $field.parent();
        $wrapper.children('.invalid-feedback').text('');
    }

    function validateField(fieldId) {
        const $field = $(`#${fieldId}`);
        const msg = validators[fieldId]?.($field.val()) || '';
        if (msg) {
            showFieldError($field, msg);
            return false;
        }
        clearFieldError($field);
        return true;
    }

    function validateForm() {
        let valid = true;
        let firstInvalid = null;
        Object.keys(validators).forEach(field => {
            const ok = validateField(field);
            if (!ok && !firstInvalid) firstInvalid = field;
            valid = valid && ok;
        });
        if (firstInvalid) $(`#${firstInvalid}`).focus();
        return valid;
    }

    // Attach validation events
    ['userName', 'userEmail', 'userRole', 'userStatus'].forEach(id => {
        const $el = $(`#${id}`);
        $el.on('blur', () => validateField(id));
        $el.on('input change', () => clearFieldError($el));
    });

    function clearForm() {
        const form = $('#userForm')[0];
        form.reset();
        ['userName', 'userEmail', 'userPassword', 'userRole'].forEach(id => clearFieldError($(`#${id}`)));
        $('#avatarPreview').attr('src', '/img/icon/user.png');
        $('#userAvatar').val('');
        $('#saveUserBtn').removeData('row');
    }

    // =========================
    // 5. Avatar preview
    // =========================
    $('#userAvatar').on('change', function () {
        const file = this.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Lỗi', 'Vui lòng chọn file ảnh hợp lệ!', 'error');
            $(this).val('');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('Lỗi', 'Kích thước ảnh không được vượt quá 2MB!', 'error');
            $(this).val('');
            return;
        }

        const reader = new FileReader();
        reader.onload = e => $('#avatarPreview').attr('src', e.target.result);
        reader.readAsDataURL(file);
    });

    // =========================
    // 6. Nút Thêm/Sửa User
    // =========================
    function actionsHtml(status) {
        const isBlocked = (status || '').trim().toLowerCase() === 'blocked';
        const blockTitle = isBlocked ? 'Mở khóa' : 'Khóa';
        const blockIcon = isBlocked ? 'bi-unlock' : 'bi-shield-lock';
        return `
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="Sửa" data-action="edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" data-bs-toggle="tooltip" title="Xóa" data-action="delete">
                    <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" data-bs-toggle="tooltip" title="${blockTitle}" data-action="block">
                    <i class="bi ${blockIcon}"></i>
                </button>
            </div>`;
    }

    // Mở modal
    function openUserModal(title, data = null) {
        $('#userModalLabel').text(title);
        clearForm();

        if (data) {
            $('#userName').val(data.name.trim());
            $('#userEmail').val(data.email.trim());
            $('#avatarPreview').attr('src', data.avatar.trim());
            $('#userRole').val(data.role.trim());
            $('#userStatus').val(data.status.trim() === 'Active' ? 'Active' : 'Blocked');
            $('#saveUserBtn').data('row', data.row);

            // Không cho sửa tài khoản Admin
            if (data.role === 'Admin') {
                // Không được chọn trạng thái Blocked
                // $('#userStatus').prop('disabled', true);

                // Chọn đúng giá trị Admin hiển thị
                $('#userRole').val('Admin');
            } else {
                // Được chọn trạng thái
                // $('#userStatus').prop('disabled', false);

                // Chọn giá trị hiện tại của user
                $('#userRole').val(data.role);
            }

            // Email không được sửa
            $('#userEmail').prop('disabled', true);
        } else {
            // Email được sửa
            $('#userEmail').prop('disabled', false);

            // Được chọn trạng thái
            $('#userStatus').prop('disabled', false);
        }
        $('#userModal').modal('show');
    }

    $('#addUserBtn').click(() => openUserModal('Thêm tài khoản'));

    // =========================
    // 7. Lưu User
    // =========================
    $('#saveUserBtn').click(function () {
        if (!validateForm()) return;

        const isEdit = !!$(this).data('row');
        const row = $(this).data('row');

        const user = {
            name: $('#userName').val().trim(),
            email: $('#userEmail').val().trim(),
            avatar: $('#avatarPreview').attr('src'),
            role: $('#userRole').val(),
            status: $('#userStatus').val()
        };

        // Tạo FormData để gửi file
        const formData = new FormData();
        formData.append('avatar', $('#userAvatar')[0].files[0]); // file
        formData.append('name', $('#userName').val().trim());
        formData.append('email', $('#userEmail').val().trim());
        formData.append('role', $('#userRole').val());
        formData.append('status', $('#userStatus').val());

        const currentTime = new Date().toLocaleString('vi-VN');
        const rowData = [
            isEdit ? table.row(row).data()[0] : table.data().length + 1,
            `<div class="user-cell"><img src="${user.avatar}" class="user-avatar"><div class="user-meta"><div class="user-name">${user.name}</div><div class="user-email">${user.email}</div></div></div>`,
            `<span class="badge ${user.role === 'Admin' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}">${user.role}</span>`,
            `<span class="badge ${user.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}">${user.status}</span>`,
            isEdit ? table.row(row).data()[4] : currentTime,
            currentTime,
            actionsHtml(user.status)
        ];

        if (isEdit) {
            // Lấy ID tài khoản
            const userId = row.data()[0];

            // Thêm ID với formData
            formData.append('userId', userId);

            // Gọi API cập nhật tài khoản
            fetch('/manager/user', {
                method: 'PUT',
                headers: {
                    "CSRF-Token": csrfToken
                },
                body: formData
            }).then(async res => {
                const data = await res.json(); // body server trả về
                if (res.status === 200) {
                    // Cập nhật row
                    table.row(row).data(rowData).draw(false);
                    // Ẩn modal
                    $('#userModal').modal('hide');
                    initTooltip();
                    // Hiển thị toast
                    showToast(`${isEdit ? 'Cập nhật' : 'Thêm mới'} thành công`, `Người dùng "${user.name}" đã ${isEdit ? 'cập nhật' : 'thêm mới'}`, 'success');
                } else if (res.status === 400) {
                    // Dữ liệu không hợp lệ
                    showToast(`${isEdit ? 'Cập nhật' : 'Thêm mới'} không thành công`, `Người dùng "${user.name}" không ${isEdit ? 'cập nhật' : 'thêm mới'}`, 'error');
                } else if (res.status === 403) {
                    showToast('Không có quyền', data.error || 'Bạn không có quyền thực hiện hành động này.', 'error');
                }
            }).catch(err => {
                console.error(err);
                showToast('Lỗi mạng', 'Không thể kết nối tới server', 'error');
            })
        } else {
            // Thêm tài khoản
            fetch('/manager/user', {
                method: 'POST',
                headers: {
                    "CSRF-Token": csrfToken
                },
                body: formData
            })
                .then(async res => {
                    const data = await res.json(); // body server trả về
                    if (res.status === 200) {
                        // Thêm row mới lên đầu bằng cách sắp xếp ID giảm dần
                        rowData[0] = data.userId; // ID tài khoản mới tạo
                        table.row.add(rowData).draw(false);
                        table.order([0, 'desc']).draw(false); // row mới sẽ nằm trên cùng

                        // Ẩn modal
                        $('#userModal').modal('hide');
                        initTooltip();
                        // Hiển thị toast
                        showToast(`${isEdit ? 'Cập nhật' : 'Thêm mới'} thành công`, `Tài khoản "${user.name}" đã được ${isEdit ? 'cập nhật' : 'thêm mới'}`, 'success');
                    } else if (res.status === 400) {
                        // Dữ liệu không hợp lệ
                        showToast('Dữ liệu không hợp lệ', data.error || 'Lỗi', 'error');
                    } else if (res.status === 401) {
                        // Email đã tồn tại
                        showFieldError($('#userEmail'), data.error || 'Email đã tồn tại.');
                    } else {
                        showToast('Lỗi server', 'Vui lòng thử lại sau', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Lỗi mạng', 'Không thể kết nối tới server', 'error');
                });
        }
    });

    function getRowStatus(row) {
        const data = table.row(row).data();
        return $(data[3]).text().trim() === 'Blocked' ? 'Blocked' : 'Active';
    }

    // =========================
    // 8. Xử lý Sửa/Xóa/Block
    // =========================
    $('#example tbody').on('click', 'button[data-action]', function () {
        const action = $(this).data('action');
        const row = table.row($(this).closest('tr'));
        const data = row.data();
        const userId = data[0];
        const name = $(data[1]).find('.user-name').text();
        const email = $(data[1]).find('.user-email').text();
        const avatar = $(data[1]).find('img').attr('src');
        const role = $(data[2]).text().trim();
        const status = $(data[3]).text().trim();

        if (action === 'edit') {
            openUserModal('Cập nhật tài khoản', { name, email, avatar, role, status, row });
        } else if (action === 'delete') {
            Swal.fire({
                title: 'Xóa tài khoản?',
                html: `<b>${name}</b> sẽ bị xóa.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Xóa',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#dc3545'
            }).then(res =>
                res.isConfirmed && (
                    // Gọi API xóa tài khoản
                    fetch('/manager/user', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            "CSRF-Token": csrfToken
                        },
                        body: JSON.stringify({ userId })
                    }).then(async res => {
                        const data = await res.json(); // body server trả về
                        if (res.status === 200) {
                            row.remove().draw(),
                                showToast('Xóa thành công', `Tài khoản "${name}" đã được xóa`, 'success')
                        } else if (res.status === 400) {
                            showToast('Dữ liệu không hợp lệ', data.error || 'Lỗi', 'error');
                        } else if (res.status === 403) {
                            showToast('Không có quyền', data.error || 'Bạn không có quyền thực hiện hành động này.', 'error');
                        } else {
                            showToast('Lỗi server', 'Vui lòng thử lại sau', 'error');
                        }
                    }).catch(err => {
                        console.error(err);
                        showToast('Lỗi mạng', 'Không thể kết nối tới server', 'error');
                    })
                )
            );
        } else if (action === 'block') {
            const isBlocked = status.toLowerCase() === 'blocked';

            Swal.fire({
                title: `${isBlocked ? 'Mở khóa' : 'Khóa'} tài khoản?`,
                html: `<b>${name}</b> sẽ ${isBlocked ? 'được mở khóa' : 'không thể đăng nhập'}.`,
                icon: 'question', showCancelButton: true,
                confirmButtonText: isBlocked ? 'Mở khóa' : 'Khóa',
                cancelButtonText: 'Hủy', confirmButtonColor: isBlocked ? '#198754' : '#fd7e14'
            }).then(res => {
                if (!res.isConfirmed) return;

                // Thực hiện block
                fetch('/manager/user/block', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "CSRF-Token": csrfToken
                    },
                    body: JSON.stringify({ userId, isBlocked })
                }).then(async res => {
                    const data = await res.json(); // body server trả về
                    if (res.status === 200) {

                        showToast(`${isBlocked ? 'Mở khóa' : 'Khóa'} thành công`,
                            `Tài khoản "${name}" đã được ${isBlocked ? 'mở khóa' : 'khóa'}`,
                            isBlocked ? 'success' : 'warning'
                        );

                        // Lấy dữ liệu row hiện tại
                        let rowData = table.row(row).data();

                        const newStatus = isBlocked ? 'Active' : 'Blocked';

                        // Cập nhật lại đúng index tương ứng cột
                        rowData[3] = `<span class="badge ${newStatus === 'Active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}">${newStatus}</span>`;
                        rowData[6] = actionsHtml(newStatus);
                        rowData[5] = new Date().toLocaleString('vi-VN');

                        table.row(row).data(rowData).draw(false);

                        initTooltip();
                    }
                    else if (res.status === 403) {
                        showToast('Dữ liệu không hợp lệ', data.error || 'Lỗi', 'error');
                        return;
                    }
                    else {
                        showToast('Lỗi', 'Không thể kết nối tới server', 'error');
                        return;
                    }
                }).catch(err => {
                    console.error(err);
                    showToast('Lỗi', 'Không thể kết nối tới server', 'error');
                    return;
                });
            });
        }
    });

    // =========================
    // 9. Toast helper
    // =========================
    function showToast(title, text, icon = 'success') {
        Swal.fire({
            title, text, icon,
            timer: 3000, showConfirmButton: false, toast: true, position: 'top-end',
            showClass: { popup: 'animate__animated animate__slideInRight animate__faster' },
            hideClass: { popup: 'animate__animated animate__slideOutRight animate__faster' }
        });
    }

    // =========================
    // 10. Reset form khi đóng modal
    // =========================
    $('#userModal').on('hidden.bs.modal', clearForm);

    // =========================
    // 11. Reset validation khi chuyển tab
    // =========================
    $(document).on('shown.bs.tab', 'a[data-bs-toggle="tab"]', clearForm);
});