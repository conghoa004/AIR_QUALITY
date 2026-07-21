$(document).ready(function () {
    // Hàm chuyển sang trang đăng nhập
    $("#backLoginLink").on("click", function (e) {
        e.preventDefault();
        window.location.replace("/auth/login");
    });

    // Function hiển thị toast
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

    // Validate & submit form
    $("#resetPasswordForm").on("submit", function (e) {
        e.preventDefault();

        const newPassword = $("#newPassword");
        const confirmPassword = $("#confirmPassword");

        let isValid = true;

        // Reset state
        newPassword.removeClass("is-invalid");
        confirmPassword.removeClass("is-invalid");

        // Regex kiểm tra mật khẩu mạnh
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

        // Check new password
        if (!strongPasswordRegex.test(newPassword.val())) {
            newPassword.addClass("is-invalid");
            isValid = false;
        }

        // Check confirm password matches
        if (newPassword.val() !== confirmPassword.val()) {
            confirmPassword.addClass("is-invalid");
            isValid = false;
        }

        if (isValid) {
            // Lấy CSRF token
            const csrfToken = $("meta[name='csrf-token']").attr("content");

            // Lấy token reset password
            const resetToken = $("meta[name='token']").attr("content");

            // reCAPTCHA
            grecaptcha.ready(function () {
                grecaptcha.execute("6Lea8sYrAAAAAGhnTkYQ5a4e6APO-9ue2dxmsbEo", { action: "forgot_password" })
                    .then(function (token) {
                        // Gửi request reset password
                        fetch("/auth/reset-password", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "CSRF-Token": csrfToken
                            },
                            body: JSON.stringify({
                                newPassword: newPassword.val(),
                                confirmPassword: confirmPassword.val(),
                                recaptcha_token: token,
                                resetToken
                            }),
                        }).then(async (res) => {
                            const data = await res.json();
                            if (res.status === 200) {
                                showToast('Thành công', data.message || 'Đổi mật khẩu thành công', 'success');
                                $("#resetPasswordForm")[0].reset();

                                // Chuyển trang
                                return window.location.replace("/auth/login");
                            }

                            if (res.status === 402) {
                                newPassword.addClass("is-invalid");
                                confirmPassword.addClass("is-invalid");
                                $("#passwordError").text(data.error);
                                $("#confirmPasswordError").text(data.error);
                                showToast('Lỗi', data.error || 'Tài khoản bị khóa!', 'error');
                                return;
                            }

                            showToast('Lỗi', 'Lỗi hệ thống vui liệu thử lại sau!', 'error');
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        }).catch(err => {
                            showToast('Lỗi', 'Lỗi hệ thống vui liệu thử lại sau!', 'error');
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        });
                    })
            });
        }
    });
});
