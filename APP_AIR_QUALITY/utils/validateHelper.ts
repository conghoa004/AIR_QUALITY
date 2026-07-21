// Validate email
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate password
export function validatePassword(password: string): boolean {
  if (!password) return false;
  // Mật khẩu >=8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  return strongPasswordRegex.test(password);
}

// Kiểm tra tên: ít nhất 2 từ, chỉ chữ cái và khoảng trắng
export function validateName(name: string): boolean {
    if (!name) return false;
    name = name.trim();
    if (!/^[A-Za-zÀ-Ỵà-ỵĂăÂâÊêÔôƠơƯưĐđ\s]+$/.test(name)) return false;
    if (name.split(/\s+/).filter(Boolean).length < 2) return false;
    return true;
}

// Parse JSON 
export async function safeParseJSON(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}