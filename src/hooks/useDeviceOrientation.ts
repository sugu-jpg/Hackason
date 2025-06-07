// hooks/useDeviceOrientation.ts
import { useCallback } from 'react';

export const useDeviceOrientation = () => {
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        
        if (result === "granted") {
          return true;
        } else {
          alert("センサーの使用が拒否されました。");
          return false;
        }
      } catch (err) {
        console.error("Permission error:", err);
        alert("センサーの許可に失敗しました。");
        return false;
      }
    } else {
      return true;
    }
  }, []);

  return { requestPermission };
};