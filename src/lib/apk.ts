import { stat } from "fs/promises";
import path from "path";

export const APK_FILENAME = "sahoda-crm.apk";

export const getApkPath = () => path.join(process.cwd(), "public", APK_FILENAME);

/**
 * The APK is built by .github/workflows/build-apk.yml and committed to
 * public/, so it is absent until that has been run at least once.
 */
export async function getApkInfo(): Promise<{ available: boolean; sizeBytes: number | null }> {
  try {
    const info = await stat(getApkPath());
    if (!info.isFile() || info.size === 0) return { available: false, sizeBytes: null };
    return { available: true, sizeBytes: info.size };
  } catch {
    return { available: false, sizeBytes: null };
  }
}
