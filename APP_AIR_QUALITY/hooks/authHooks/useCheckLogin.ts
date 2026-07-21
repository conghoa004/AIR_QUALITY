import { useRouter } from "expo-router";
import { useEffect } from "react";
import { checkLoginService } from "@/services/authService";
import { storage } from "@/configs/storageConfig";

export const useCheckLogin = () => {
  const route = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data, res } = await checkLoginService();

      if (res.status === 200) {
         route.replace("/(tabs)/dashboard");
      } else {
        storage.remove("info");
        route.replace("/(tabs)/login");
      }
    };

    fetchData();
  }, []);
};

export default useCheckLogin;
