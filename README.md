# Sahoda CRM — Founder CRM & Task Manager with AI Copilot (Text + Voice)

Sahoda CRM is a lightweight, high-performance, single-user CRM, Task Manager, Meetings Calendar, and WhatsApp alerts engine built for solo founders and micro-agency owners.

---

## ✨ Features & Direct AI Execution

- **Sales Pipeline & Kanban Board**: Drag-and-drop / single-click stage management (`New`, `Contacted`, `Qualified`, `Proposal`, `Won`, `Lost`), deal values, and source tracking.
- **Task Manager & Daily Todos**: Priority-sorted tasks (`High`, `Medium`, `Low`), due dates, overdue alerts, and completion tracking.
- **Meetings & Calendar**: Discovery call scheduling, Google Meet link integrations, and automated 30-minute reminder triggers.
- **Public Lead Capture & QR Links**: Shareable `/l/[slug]` forms and auto-generated QR codes to capture inbound leads directly into your pipeline.
- **Owner WhatsApp Alert Engine**: Free real-time WhatsApp notifications via **TextMeBot** (`XojF4J8haTSy` API Key supported) or CallMeBot for new leads, task deadlines, and daily morning digests (Inbound to owner phone only).
- **🤖 Direct-Execution AI Copilot**:
  - Performs create, update, schedule, and complete operations immediately without permission prompts.
  - **60-Second Chat Undo & 7-Day Action Audit Log**: Instant rollback via `agent_actions` table.
  - **Hinglish & Natural Language Resolution**: Automatic resolution of contact names ("this guy", "usko", first names) and IST date/time expressions.
  - **Whisper Speech-to-Text**: Powered by Groq `whisper-large-v3-turbo` with real-time `AnalyserNode` amplitude audio wave visualizer.

---

## 📱 Mobile App (PWA & Android APK)

### 1. Progressive Web App (PWA) — Free on iOS & Android
- **Android**: Open in Chrome → Tap **Install App** button in Settings or browser prompt.
- **iOS (iPhone/iPad)**: Safari → **Share** (box with arrow) → **"Add to Home Screen"** → Tap **Add**. This provides a full-screen app experience with its own icon and 90-day PIN auth persistence.

### 2. Android Release APK Build (Capacitor)
Follow these steps to build a signed release APK for Android:

```bash
# 1. Add Android platform
npx cap add android

# 2. Generate Keystore (IMPORTANT: Back up sahoda-crm-release-key.jks file!)
keytool -genkey -v -keystore sahoda-crm-release-key.jks -alias sahoda_key -keyalg RSA -keysize 2048 -validity 10000

# 3. Sync web assets & configuration
npx cap sync android

# 4. Build signed APK via Gradle
cd android
./gradlew assembleRelease
```
The APK will be generated at `android/app/build/outputs/apk/release/app-release-unsigned.apk` (or signed via apksigner/jarsigner).

> ⚠️ **CRITICAL KEYSTORE WARNING**: Save your `sahoda-crm-release-key.jks` file and passwords in a secure backup location. If you lose this keystore file, you will never be able to update your installed Android APK!

### 🍎 Honest iOS Position
Building a standalone `.ipa` file or publishing to the Apple App Store requires a Mac computer running Xcode and an active **Apple Developer Program membership (USD $99/year)**. On iOS, using **Safari → Share → Add to Home Screen** (PWA) gives you a full-screen app with its own icon, instant launch, and 90-day PIN persistence — genuinely native-like for a CRM, completely free.

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to `.env.local` and configure:

```ini
# Supabase Configuration (Optional - falls back to MemoryStore in dev)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Single-User Security PIN
APP_ACCESS_PIN=123456

# WhatsApp Provider Configuration (textmebot | callmebot | meta | console)
WHATSAPP_PROVIDER=textmebot
CALLMEBOT_PHONE=+919876543210
CALLMEBOT_APIKEY=XojF4J8haTSy

# AI Copilot Provider & Keys
AI_PROVIDER=openai                           # openai | google | groq
OPENAI_API_KEY=                              # sk-proj-...
AI_MODEL=gpt-4o-mini
GROQ_API_KEY=                                # free at console.groq.com — used for voice STT
STT_PROVIDER=groq                            # groq | browser
STT_MODEL=whisper-large-v3-turbo
```

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and enter PIN `123456` to log in.
