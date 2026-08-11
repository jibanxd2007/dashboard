#!/usr/bin/env node
/**
 * build-apk.js — Sahoda CRM Android APK Builder
 *
 * Prerequisites:
 *   1. Java JDK 17+ installed (https://adoptium.net)
 *   2. Android Studio installed (https://developer.android.com/studio)
 *   3. ANDROID_HOME env variable set (usually C:\Users\USER\AppData\Local\Android\Sdk)
 *   4. Run `npx cap add android` once to scaffold the Android project
 *
 * Usage:
 *   node scripts/build-apk.js             # debug APK (for testing)
 *   node scripts/build-apk.js --release   # release APK (for distribution)
 *
 * The output APK will be copied to public/sahoda-crm.apk automatically.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const isRelease = process.argv.includes("--release");
const ROOT = path.resolve(__dirname, "..");
const ANDROID_DIR = path.join(ROOT, "android");
const PUBLIC_DIR = path.join(ROOT, "public");

function run(cmd, cwd = ROOT) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function checkPrerequisites() {
  console.log("🔍 Checking prerequisites...");

  // The APK loads the deployed site, so a localhost URL produces an APK that
  // opens blank on a real phone. Catch that here rather than after a long build.
  const serverUrl = process.env.CAPACITOR_SERVER_URL;
  if (!serverUrl) {
    console.error("  ✗ CAPACITOR_SERVER_URL is not set.");
    console.error("    The APK loads your deployed site, so it needs a public URL:");
    console.error("      CAPACITOR_SERVER_URL=https://your-app.vercel.app npm run build:apk");
    console.error("    Prefer the 'Build Android APK' GitHub Action if you have no Android SDK.");
    process.exit(1);
  }
  console.log(`  ✓ Server URL: ${serverUrl}`);

  // Check Java
  try {
    execSync("java -version", { stdio: "pipe" });
    console.log("  ✓ Java found");
  } catch {
    console.error("  ✗ Java not found. Install JDK 17+ from https://adoptium.net");
    process.exit(1);
  }

  // Check Android project exists
  if (!fs.existsSync(ANDROID_DIR)) {
    console.log("  ⚠ Android project not found. Running: npx cap add android");
    run("npx cap add android");
  } else {
    console.log("  ✓ Android project found");
  }
}

async function build() {
  console.log("\n🚀 Sahoda CRM — Android APK Builder");
  console.log(`   Mode: ${isRelease ? "RELEASE" : "DEBUG"}`);
  console.log("─".repeat(50));

  checkPrerequisites();

  // 1. Build Next.js (static export not possible with server components,
  //    so the APK uses the live server URL from capacitor.config.ts)
  console.log("\n📦 Step 1: Syncing Capacitor assets...");
  run("npx cap sync android");

  // 2. Build the APK
  console.log(`\n🔨 Step 2: Building ${isRelease ? "release" : "debug"} APK...`);
  const gradleCmd = isRelease
    ? `gradlew.bat assembleRelease`
    : `gradlew.bat assembleDebug`;

  run(gradleCmd, ANDROID_DIR);

  // 3. Copy APK to public/
  console.log("\n📂 Step 3: Copying APK to public/...");
  const apkSrc = isRelease
    ? path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk")
    : path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk");

  const apkDest = path.join(PUBLIC_DIR, "sahoda-crm.apk");

  if (!fs.existsSync(apkSrc)) {
    console.error(`\n✗ APK not found at: ${apkSrc}`);
    console.error("  Check the Gradle build output above for errors.");
    process.exit(1);
  }

  fs.copyFileSync(apkSrc, apkDest);
  const sizeKb = Math.round(fs.statSync(apkDest).size / 1024);
  console.log(`\n✅ APK ready: public/sahoda-crm.apk (${sizeKb} KB)`);
  console.log("   Users can now download it from Settings → Download App.\n");
}

build().catch((err) => {
  console.error("Build failed:", err.message);
  process.exit(1);
});
