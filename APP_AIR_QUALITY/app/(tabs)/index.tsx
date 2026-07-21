import useCheckLogin from "@/hooks/authHooks/useCheckLogin";

// Function component
export default function LoginScreen () {
  // Kiểm tra đăng nhập
  useCheckLogin();

  // Render UI
  return <></>;
}
