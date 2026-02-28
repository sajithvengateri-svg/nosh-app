import { useState, useEffect } from "react";
import { Dimensions } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

interface GameOrientation {
  width: number;
  height: number;
  isLandscape: boolean;
}

/**
 * Unlocks screen orientation on mount (allows landscape in games).
 * Locks back to portrait on unmount (rest of app stays portrait).
 * Returns current dimensions and whether the device is in landscape.
 */
export function useGameOrientation(): GameOrientation {
  const [dims, setDims] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height, isLandscape: width > height };
  });

  useEffect(() => {
    // Unlock to allow rotation
    ScreenOrientation.unlockAsync();

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDims({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
      });
    });

    return () => {
      subscription.remove();
      // Lock back to portrait when leaving the game
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  return dims;
}
