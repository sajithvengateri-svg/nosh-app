import { useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { useCompanionStore } from "./companionStore";
import { usePhotoStore } from "../stores/photoStore";
import { mediumTap, successNotification } from "../haptics";
import type { NoshResponse } from "./responseTypes";

/**
 * Camera/gallery input — captures a photo and pushes it as a companion response.
 */
export function useCameraInput() {
  const setBubbleState = useCompanionStore((s) => s.setBubbleState);
  const pushResponse = useCompanionStore((s) => s.pushResponse);
  const showPopUp = useCompanionStore((s) => s.showPopUp);
  const addPhoto = usePhotoStore((s) => s.addPhoto);

  const launchCamera = useCallback(async () => {
    mediumTap();
    setBubbleState("camera_ready");

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showPopUp("Camera access denied");
      setBubbleState("idle");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    setBubbleState("idle");

    if (!result.canceled && result.assets[0]) {
      successNotification();
      const asset = result.assets[0];
      addPhoto(asset.uri, "Scanned item");
      const response: NoshResponse = {
        id: `scan-${Date.now()}`,
        type: "card",
        content: "Scanned item",
        subtitle: "Tap to identify ingredients",
        imageUrl: asset.uri,
        timestamp: Date.now(),
        dismissAfter: 30000,
      };
      pushResponse(response);
    }
  }, [setBubbleState, pushResponse, showPopUp, addPhoto]);

  const launchGallery = useCallback(async () => {
    mediumTap();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showPopUp("Photo library access denied");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      successNotification();
      const asset = result.assets[0];
      addPhoto(asset.uri, "From library");
      const response: NoshResponse = {
        id: `photo-${Date.now()}`,
        type: "card",
        content: "Photo added",
        subtitle: "From your library",
        imageUrl: asset.uri,
        timestamp: Date.now(),
        dismissAfter: 30000,
      };
      pushResponse(response);
    }
  }, [pushResponse, showPopUp, addPhoto]);

  return { launchCamera, launchGallery };
}
