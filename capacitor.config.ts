import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sahoda.crm",
  appName: "Sahoda CRM",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "http://localhost:3000",
    cleartext: true,
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
