import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getApkInfo, getApkPath, APK_FILENAME } from "@/lib/apk";

const notBuilt = () =>
  NextResponse.json(
    {
      error: "APK not available",
      message:
        "No Android APK has been built for this deployment yet. Install the app from your browser instead (Chrome menu > Add to Home screen), or run the 'Build Android APK' GitHub Action to produce one.",
    },
    { status: 404 }
  );

/** Cheap availability probe so the UI can avoid offering a download that 404s. */
export async function HEAD() {
  const { available, sizeBytes } = await getApkInfo();
  if (!available) return new NextResponse(null, { status: 404 });

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Length": String(sizeBytes),
    },
  });
}

export async function GET() {
  const { available, sizeBytes } = await getApkInfo();
  if (!available) return notBuilt();

  const file = await readFile(getApkPath());

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename="${APK_FILENAME}"`,
      "Content-Length": String(sizeBytes),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
