import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET() {
  const apkPath = path.join(process.cwd(), "public", "sahoda-crm.apk");

  try {
    await stat(apkPath);
    const file = await readFile(apkPath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="sahoda-crm.apk"',
        "Content-Length": file.byteLength.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    // APK not built yet — return 404 with helpful JSON
    return NextResponse.json(
      {
        error: "APK not yet built",
        message:
          "The Android APK has not been compiled yet. Run `npm run build:apk` to generate it.",
        docs: "See README.md → Android APK Build for instructions.",
      },
      { status: 404 }
    );
  }
}
