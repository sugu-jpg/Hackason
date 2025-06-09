// hooks/useDeviceOrientation.ts
import { useCallback } from "react";

export const useDeviceOrientation = () => {
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      return true;
    } catch (err) {
      console.error("Permission error:", err);
      alert("センサーの許可に失敗しました。");
      return false;
    }
  }, []);

  return { requestPermission };
};
