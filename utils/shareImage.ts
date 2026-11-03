import type { RefObject } from "react";
import type { HostInstance } from "react-native";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { captureRef } from "react-native-view-shot";

// Captures a rendered view as a PNG and opens the system share sheet.
// Returns false when sharing is not available on this device.
export async function shareViewAsImage(
  viewRef: RefObject<HostInstance | null>,
  dialogTitle: string,
): Promise<boolean> {
  if (!viewRef.current) throw new Error("Nothing to capture");
  if (!(await isAvailableAsync())) return false;
  const uri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
  });
  await shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle,
    UTI: "public.png",
  });
  return true;
}
