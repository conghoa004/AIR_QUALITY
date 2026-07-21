$(document).ready(function () {
    // Hàm chuyển sang trang quên mật khẩu
    $("#forgotLink").on("click", function (e) {
        e.preventDefault();
        window.location.replace("/auth/forgot-password");
    });

    // Hiển thị toast
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

    // Validate & submit login form
    $("#loginForm").on("submit", function (e) {
        e.preventDefault();

        const email = $("#email");
        const password = $("#password");

        let isValid = true;

        // Reset trạng thái lỗi
        email.removeClass("is-invalid");
        password.removeClass("is-invalid");

        // Check input trống
        if (!email.val()) {
            email.addClass("is-invalid");
            isValid = false;
        }
        if (!password.val()) {
            password.addClass("is-invalid");
            isValid = false;
        }

        if (!isValid) return;

        // Lấy CSRF token
        const csrfToken = $("meta[name='csrf-token']").attr("content");

        // reCAPTCHA v3
        grecaptcha.ready(function () {
            grecaptcha.execute("6Lea8sYrAAAAAGhnTkYQ5a4e6APO-9ue2dxmsbEo", { action: "login" })
                .then(function (token) {
                    // Gửi AJAX login
                    fetch("/auth/login", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "CSRF-Token": csrfToken
                        },
                        body: JSON.stringify({
                            email: email.val().trim(),
                            password: password.val().trim(),
                            recaptcha_token: token
                        })
                    }).then(async (res) => {
                        const data = await res.json();
                        if (res.status === 200) {
                            $("#loginForm")[0].reset();

                            // Chuyển trang
                            window.location.replace("/");
                        }

                        if (res.status === 401) {
                            email.addClass("is-invalid");
                            password.addClass("is-invalid");
                        }

                        if (res.status === 402) {
                            email.addClass("is-invalid");
                            password.addClass("is-invalid");
                            $("#emailError").text("Tài khoản bị khóa!");
                            $("#passwordError").text("Tài khoản bị khóa!");

                            showToast('Lỗi', "Tài khoản bị khóa!", 'error');
                        }

                        if (res.status === 403) {
                            window.location.replace("/auth/invalid");
                        }

                    }).catch(err => {
                        console.error(err);
                        showToast('Lỗi', 'Lỗi hệ thống', 'error');
                    });
                });
        });
    });
});