import type { CapacitorConfig } from "@capacitor/cli";

// The Android app is a thin shell that loads the deployed site rather than
// bundling it, so CAPACITOR_SERVER_URL must point at a URL the phone can
// actually reach. The localhost default only works in an emulator on the
// same machine; an APK built without this set opens blank on a real device.
const serverUrl = process.env.CAPACITOR_SERVER_URL || "http://localhost:3000";

if (serverUrl.includes("localhost")) {
  console.warn(
    "[capacitor] CAPACITOR_SERVER_URL is not set — building against " +
      `${serverUrl}. Set it to your deployed https:// URL before shipping an APK.`
  );
}

const config: CapacitorConfig = {
  appId: "com.sahoda.crm",
  appName: "Sahoda CRM",
  webDir: "public",
  server: {
    url: serverUrl,
    // Only needed for the plain-http localhost default; https needs no exception.
    cleartext: serverUrl.startsWith("http://"),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0F172A",
      androidSpinnerStyle: "small",
      spinnerColor: "#FF4B00",
      showSpinner: true,
    },
    StatusBar: {
      style: "DARK" as any,
      backgroundColor: "#0F172A",
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#FF4B00",
      sound: "beep.wav",
    },
  },
};

export default config;
