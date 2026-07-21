$(document).ready(function () {
    // Hàm chuyển sang trang đăng nhập
    $("#backLoginLink").on("click", function (e) {
        e.preventDefault();
        window.location.replace("/auth/login");
    });

    // Hàm xử lý submit form quên mật khẩu
    $("#forgotForm").on("submit", function (e) {
        e.preventDefault();

        const emailInput = $("#email");
        const email = emailInput.val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // reset state
        emailInput.removeClass("is-invalid is-valid");

        function showToast(title, text = '', icon = 'success') {
            Swal.fire({
                title,
                text,
                icon,
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                showClass: { popup: 'animate__animated animate__slideInRight animate__faster' },
                hideClass: { popup: 'animate__animated animate__slideOutRight animate__faster' }
            });
        }

        // Validate email
        if (!emailRegex.test(email)) {
            emailInput.addClass("is-invalid");
            $("#emailError").text("Email không hợp lệ.");
            return;
        }

        // Lấy CRF Token
        const csrfToken = $("meta[name='csrf-token']").attr("content");

        // reCAPTCHA
        grecaptcha.ready(function () {
            grecaptcha.execute("6Lea8sYrAAAAAGhnTkYQ5a4e6APO-9ue2dxmsbEo", { action: "forgot_password" })
                .then(function (token) {
                    fetch("/auth/forgot-password", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            'CSRF-Token': csrfToken  // csurf mặc định đọc header này
                        },
                        body: JSON.stringify({
                            email: email,
                            recaptcha_token: token,
                        }),
                    }).then(async (res) => {
                        const data = await res.json(); // body server trả về
                        if (res.status === 200) {
                            // Chuyển đến giao diện kiểm tra email
                            window.location.replace("/auth/check-mail?token=" + data.token);
                            return;
                        }

                        if (res.status === 400) {
                            emailInput.addClass("is-invalid");
                            $("#emailError").text("Email không hợp lệ.");
                            return;
                        }

                        if (res.status === 403) {
                            emailInput.removeClass("is-invalid");
                            showToast('Thông báo', "Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra email hoặc thử lại sau 15 phút." || 'Lỗi', 'info');
                            return;
                        }

                        if (res.status === 402) {
                            emailInput.addClass("is-invalid");
                            $("#emailError").text("Tài khoản bị khóa!");
                            showToast('Lỗi', "Tài khoản bị khóa!" || 'Lỗi', 'error');
                            return;
                        }

                        // Lỗi server
                        showToast('Lỗi', "Lỗi hệ thống vui lòng thử lại sau!" || 'Lỗi', 'error');

                        // reload trang
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }).catch(err => {
                        // Lỗi server
                        showToast('Lỗi', "Lỗi hệ thống vui lòng thử lại sau!" || 'Lỗi', 'error');

                        // reload trang
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    });
                })
        });
    });
});