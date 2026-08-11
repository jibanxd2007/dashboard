import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export async function scheduleDeviceNotification(id: number, title: string, body: string, scheduleAt?: Date) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: scheduleAt ? { at: scheduleAt } : undefined,
          actionTypeId: "",
          extra: null,
        },
      ],
    });
  } catch (e) {
    console.warn("[Capacitor LocalNotifications Error]", e);
  }
}
