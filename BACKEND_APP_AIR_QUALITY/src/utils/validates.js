// Hàm tạo họ tên user
export function formatName(name) {
    if (!name) return '';
    const words = name.trim().split(/\s+/); // tách theo 1 hoặc nhiều khoảng trắng, loại bỏ khoảng trắng đầu/cuối
    if (words.length === 1) return words[0]; // nếu chỉ có 1 từ
    return words[0] + " " + words[words.length - 1]; // họ + tên
}

// Kiểm tra tên: ít nhất 2 từ, chỉ chữ cái và khoảng trắng
export function validateName(name) {
    if (!name) return false;
    name = name.trim();
    if (!/^[A-Za-zÀ-Ỵà-ỵĂăÂâÊêÔôƠơƯưĐđ\s]+$/.test(name)) return false;
    if (name.split(/\s+/).filter(Boolean).length < 2) return false;
    return true;
}

// Kiểm tra email hợp lệ
export function validateEmail(email) {
    if (!email) return false;
    email = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Kiểm tra vai trò hợp lệ (Admin/User)
export function validateRole(role) {
    return role === 'Admin' || role === 'User';
}

// Kiểm tra trạng thái hợp lệ (Active/Blocked)
export function validateStatus(status) {
    return status === 'Active' || status === 'Blocked';
}

// Kiểm tra avatar (nếu muốn)
export function validateAvatar(avatar) {
    // Chỉ kiểm tra kiểu string, có thể nâng cấp kiểm tra URL/file type
    return typeof avatar === 'string' && avatar.trim().length > 0;
}

// Kiểm tra mật khẩu mạnh
export function validatePassword(password) {
    if (!password) return false;
    // Mật khẩu >=8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return strongPasswordRegex.test(password);
}

// Kiểm tra xác nhận mật khẩu khớp với mật khẩu
export function validateConfirmPassword(password, confirmPassword) {
    return password === confirmPassword;
}

// Kiểm tra expo push token 
export function validateExpoToken(token) {
    return typeof token === "string" && /^ExponentPushToken\[[\w\d]+\]$/.test(token);
}