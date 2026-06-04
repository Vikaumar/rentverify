# 🛡️ RentVerify — Full-Stack Guest Verification & Pre-Registration System

RentVerify is a premium, secure, and automated guest screening platform built for property hosts, homestays, and rental guardians. It replaces manual check-in headaches with a native mobile dashboard, automated SMS/WhatsApp pre-registration invitations, and biometric security.

---

## 📂 Project Architecture & Directory Structure

This repository is organized as a **Monorepo** containing three core components:

*   **`[NEW]` [rentverify-android/](file:///c:/Users/MiNe/.gemini/antigravity/scratch/rentverify/rentverify-android)**: The native Android client built for rental guardians.
    *   *Stack:* Kotlin, Jetpack Compose, MVVM, Room Database (offline-first caching), Retrofit (networking), Dagger Hilt (DI), and Firebase Authentication.
*   **`[NEW]` [rentverify-backend/](file:///c:/Users/MiNe/.gemini/antigravity/scratch/rentverify/rentverify-backend)**: The central Express API server.
    *   *Stack:* Node.js, Express, MySQL database, Twilio API (SMS/WhatsApp notifications), Nodemailer (SMTP alerts), and Firebase Admin SDK.
*   **`[LEGACY]` [rentverify-app/](file:///c:/Users/MiNe/.gemini/antigravity/scratch/rentverify/rentverify-app)**: The reference desktop application.
    *   *Stack:* React 19, TypeScript, Electron, and local MongoDB storage.

---

## ✨ Features & Visual Highlights

### 📱 Android Mobile App (Guardian Client)
*   **Offline-First & Local Cache**: Full local database mirroring with Room DB. If the network drops, verifications and audit events are queued locally and automatically sync back once online.
*   **Premium Material 3 Dark UI**: Tailored deep-violet glassmorphic cards, custom HSL status indicators, and micro-animations for verification transitions.
*   **Image Pre-Processing**: Features smart utility algorithms to auto-correct EXIF photo rotation, compress, and scale down files (800px for selfies, 1200px for IDs) into Base64 strings to save network bandwidth.
*   **Native Guest Form Wizard**: A 6-step paginated wizard supporting:
    *   Consent checking and encrypted data warnings.
    *   Native Android DatePickerDialog / TimePickerDialog widgets.
    *   Selfie and government ID capture via system camera/gallery intents.
    *   Deep-link triggers (`rentverify://verify?token=...`) to pre-fill guest reservation details.
*   **Redesigned Detail Audit Portal**: Side-by-side photo matching with fullscreen zoom options, review logs, and single-tap radio-select dialogs for flagging or rejection reasons.

### ⚙️ Node.js API (Backend Engine)
*   **MySQL Query Pool**: Replaces legacy document databases with structured table normalization, high-performance pools, and auto-migrations.
*   **Firebase Authentication Validation**: Secures routes by decoding Client ID tokens passed in headers and matching them against database user profiles.
*   **Notification Engine**: Orchestrates Nodemailer HTML email notifications and Twilio SMS/WhatsApp alerts for guests upon verification milestones.
*   **Robust Fallback**: Boots up in **Offline Mode** if MySQL is unavailable, allowing testing of server endpoints without crashing.

---

## 🚀 Quick Start Guide

### 1. Backend Server Setup
1.  Navigate into the backend directory:
    ```bash
    cd rentverify-backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables. Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
    *Fill in your database port/password, Firebase Service Account path, Twilio keys, and SMTP credentials.*
4.  Run database migrations and seed default administrative users:
    ```bash
    npm run db:migrate
    ```
5.  Start the development server with hot-reloading:
    ```bash
    npm run dev
    ```

---

### 2. Android App Setup
1.  Open the **[rentverify-android](file:///c:/Users/MiNe/.gemini/antigravity/scratch/rentverify/rentverify-android)** directory in **Android Studio** (Koala or newer).
2.  Add your Firebase configuration file:
    *   Download `google-services.json` from the Firebase console.
    *   Place it in the app's module folder: `rentverify-android/app/google-services.json`.
3.  Configure API Endpoint:
    *   By default, the app targets the local emulator address: `http://10.0.2.2:3001/api`.
    *   To target a local physical device, update `API_BASE_URL` in [app/build.gradle.kts](file:///c:/Users/MiNe/.gemini/antigravity/scratch/rentverify/rentverify-android/app/build.gradle.kts).
4.  Sync Gradle and click **Run** to launch on your device/emulator.

---

### 🔗 Deep Link Testing
To test the guest pre-registration deep-link flow, run this command in your terminal while an emulator is active:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "rentverify://verify?token=SAMPLE_TOKEN" com.rentverify.app
```

---

## 🔒 Security & Privacy
*   **90-day Deletion**: To comply with privacy norms, guest PII (personal data) and ID images are automatically pruned after 90 days.
*   **Encrypted Storage**: Sensitive credentials and database configurations are stored in environment variables, and client sessions are signed with HMAC.
