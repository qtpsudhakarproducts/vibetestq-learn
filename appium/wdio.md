# WebdriverIO Mobile Testing - Complete Setup Guide

## Table of Contents

1. [Prerequisites & System Requirements](#1-prerequisites)
2. [Android Studio Installation & Configuration](#2-android-studio)
3. [Environment Variables Setup](#3-environment-variables)
4. [Creating & Starting AVD (Android Emulator)](#4-avd-setup)
5. [Sample App Download & Installation](#5-sample-app)
6. [Connecting Real Device Over WiFi](#6-real-device-wifi)
7. [WebdriverIO Project Setup](#7-webdriverio-setup)
8. [BrowserStack Configuration](#8-browserstack)
9. [First Test on Emulator](#9-test-emulator)
10. [First Test on Real Device](#10-test-real-device)
11. [First Test on BrowserStack](#11-test-browserstack)
12. [Running Tests - All Methods](#12-running-tests)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites & System Requirements

### Minimum System Requirements

**For Windows:**
```
OS: Windows 10 (64-bit) or Windows 11
RAM: 8 GB minimum (16 GB recommended)
Storage: 20 GB free space
Processor: Intel/AMD 64-bit processor
Virtualization: Enabled in BIOS
```

**For macOS:**
```
OS: macOS 12.0 (Monterey) or later
RAM: 8 GB minimum (16 GB recommended)
Storage: 20 GB free space
Processor: Intel or Apple Silicon (M1/M2/M3)
```

**For Linux:**
```
OS: Ubuntu 20.04+ or similar
RAM: 8 GB minimum (16 GB recommended)
Storage: 20 GB free space
Processor: Intel/AMD 64-bit processor
KVM: Enabled for emulator acceleration
```

### Required Software

**Node.js (v18.0.0 or higher):**

```bash
# Check if installed
node --version
npm --version

# Windows (using Chocolatey)
choco install nodejs-lts

# Windows (using installer)
# Download from: https://nodejs.org/

# macOS
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

**Java JDK 11 or higher:**

```bash
# Check if installed
java -version

# Windows
choco install openjdk11

# macOS
brew install openjdk@11

# Linux
sudo apt install openjdk-11-jdk

# Verify
java -version  # Should show 11.x.x or higher
```

---

## 2. Android Studio Installation & Configuration

### Step 1: Download and Install Android Studio

**Windows:**
```
1. Visit: https://developer.android.com/studio
2. Download: android-studio-{version}-windows.exe
3. Run installer as Administrator
4. Choose installation type: "Standard"
5. Select theme: "Light" or "Darcula"
6. Accept licenses
7. Wait for SDK downloads (~15-30 minutes)

Default Installation Paths:
- Android Studio: C:\Program Files\Android\Android Studio
- Android SDK: C:\Users\{YourUsername}\AppData\Local\Android\Sdk
```

**macOS:**
```bash
# Download from https://developer.android.com/studio
# Or using Homebrew
brew install --cask android-studio

# Launch and complete setup wizard
open -a "Android Studio"
```

**Linux:**
```bash
# Download tar.gz from https://developer.android.com/studio
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/{version}/android-studio-{version}-linux.tar.gz

# Extract
tar -xvf android-studio-{version}-linux.tar.gz

# Move to /opt
sudo mv android-studio /opt/

# Run setup
/opt/android-studio/bin/studio.sh
```

### Step 2: Configure Android SDK

**Launch SDK Manager:**
```
Method 1: Android Studio → Tools → SDK Manager
Method 2: Android Studio → Configure → SDK Manager (from welcome screen)
```

**Install Required SDK Components:**

**SDK Platforms Tab:**
```
✓ Android 14.0 (UpsideDownCake) - API Level 34
✓ Android 13.0 (Tiramisu) - API Level 33
✓ Android 12.0 (S) - API Level 31
✓ Android 11.0 (R) - API Level 30

For each, also check:
✓ Android SDK Platform XX
✓ Sources for Android XX
✓ Google APIs Intel x86_64 Atom System Image (for emulator)
```

**SDK Tools Tab:**
```
✓ Android SDK Build-Tools (latest version)
✓ Android SDK Command-line Tools (latest)
✓ Android Emulator
✓ Android SDK Platform-Tools
✓ Intel x86 Emulator Accelerator (HAXM installer) - Windows/Linux Intel
✓ Google Play services
✓ Google USB Driver (Windows only)
```

Click "Apply" → "OK" → Wait for downloads

**Verify SDK Location:**
```
SDK Manager → Android SDK Location shows:

Windows: C:\Users\{YourUsername}\AppData\Local\Android\Sdk
macOS: /Users/{YourUsername}/Library/Android/sdk
Linux: /home/{YourUsername}/Android/Sdk

Copy this path - you'll need it for environment variables!
```

---

## 3. Environment Variables Setup

### Current Android SDK Structure

```
{ANDROID_HOME}/
├── platform-tools/      ← Contains adb, fastboot
├── emulator/            ← Contains emulator
├── build-tools/         ← Build utilities
├── platforms/           ← Android SDK versions
├── system-images/       ← Emulator images
└── cmdline-tools/       ← Command-line tools (optional)

Note: The "tools" folder is deprecated and no longer exists in modern SDK
```

### Windows Setup

**Method 1: GUI (Recommended for Beginners)**

```
Step 1: Open Environment Variables
- Press Win + R
- Type: sysdm.cpl
- Press Enter
- Click "Advanced" tab
- Click "Environment Variables"

Step 2: Set JAVA_HOME
- Under "System variables", click "New"
- Variable name: JAVA_HOME
- Variable value: C:\Program Files\Java\jdk-11.0.x
  (Find exact path: dir "C:\Program Files\Java\")
- Click OK

Step 3: Set ANDROID_HOME
- Click "New" again
- Variable name: ANDROID_HOME
- Variable value: C:\Users\{YourUsername}\AppData\Local\Android\Sdk
  (Use YOUR username and verify path exists)
- Click OK

Step 4: Update PATH
- Find "Path" in System variables
- Click "Edit"
- Click "New" and add:
  
  %JAVA_HOME%\bin
  %ANDROID_HOME%\platform-tools
  %ANDROID_HOME%\emulator

- Click OK on all dialogs
- IMPORTANT: Close all Command Prompts/PowerShells

Step 5: Verify
- Open NEW Command Prompt
- Run these commands:

echo %JAVA_HOME%
echo %ANDROID_HOME%
java -version
adb version
emulator -version

All should work without errors!
```

**Method 2: PowerShell Script**

Save as `setup-android-env.ps1` and run as Administrator:

```powershell
# Android Environment Setup Script for Windows
# Run as Administrator

Write-Host "Setting up Android Environment..." -ForegroundColor Cyan

# Get current username
$username = $env:USERNAME
Write-Host "Username: $username" -ForegroundColor Green

# Define paths
$javaPath = "C:\Program Files\Java\jdk-11.0.18"  # Update version if needed
$androidSdk = "C:\Users\$username\AppData\Local\Android\Sdk"

# Verify Java exists
if (-not (Test-Path $javaPath)) {
    Write-Host "ERROR: Java not found at $javaPath" -ForegroundColor Red
    Write-Host "Please install JDK 11+ or update path in script" -ForegroundColor Yellow
    exit 1
}

# Verify Android SDK exists
if (-not (Test-Path $androidSdk)) {
    Write-Host "ERROR: Android SDK not found at $androidSdk" -ForegroundColor Red
    Write-Host "Please install Android Studio first!" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Java found: $javaPath" -ForegroundColor Green
Write-Host "✓ Android SDK found: $androidSdk" -ForegroundColor Green

# Set JAVA_HOME
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "Machine")
Write-Host "✓ JAVA_HOME set" -ForegroundColor Green

# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdk, "Machine")
Write-Host "✓ ANDROID_HOME set" -ForegroundColor Green

# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Paths to add
$pathsToAdd = @(
    "$javaPath\bin",
    "$androidSdk\platform-tools",
    "$androidSdk\emulator"
)

# Add each path if not already present
foreach ($path in $pathsToAdd) {
    if ($currentPath -notlike "*$path*") {
        $currentPath += ";$path"
        Write-Host "✓ Added to PATH: $path" -ForegroundColor Cyan
    } else {
        Write-Host "○ Already in PATH: $path" -ForegroundColor Gray
    }
}

# Update PATH
[Environment]::SetEnvironmentVariable("Path", $currentPath, "Machine")
Write-Host "✓ PATH updated" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nIMPORTANT: Please restart PowerShell/CMD" -ForegroundColor Yellow
Write-Host "`nThen verify by running:" -ForegroundColor White
Write-Host "  echo `$env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host "  adb version" -ForegroundColor Cyan
Write-Host "  emulator -version" -ForegroundColor Cyan

# How to run:
# 1. Save as setup-android-env.ps1
# 2. Right-click PowerShell → Run as Administrator
# 3. If needed: Set-ExecutionPolicy RemoteSigned
# 4. Run: .\setup-android-env.ps1
```

### macOS Setup

```bash
# Open terminal and edit shell profile
# For zsh (default on macOS):
nano ~/.zshrc

# For bash:
# nano ~/.bash_profile

# Add these lines at the end:
export JAVA_HOME=$(/usr/libexec/java_home)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator

# Save (Ctrl+O, Enter, Ctrl+X)

# Apply changes
source ~/.zshrc

# Verify
echo $JAVA_HOME
echo $ANDROID_HOME
java -version
adb version
emulator -version
```

### Linux Setup

```bash
# Edit bashrc
nano ~/.bashrc

# Add these lines:
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator

# Save and apply
source ~/.bashrc

# Verify
echo $JAVA_HOME
echo $ANDROID_HOME
java -version
adb version
emulator -version
```

### Verification Checklist

Run these commands in a **NEW** terminal/command prompt:

```bash
# 1. Java
java -version
# Expected: openjdk version "11.x.x" or higher

# 2. JAVA_HOME
echo %JAVA_HOME%        # Windows
echo $JAVA_HOME         # macOS/Linux
# Expected: /path/to/java

# 3. ANDROID_HOME
echo %ANDROID_HOME%     # Windows
echo $ANDROID_HOME      # macOS/Linux
# Expected: /path/to/Android/Sdk

# 4. ADB
adb version
# Expected: Android Debug Bridge version 1.0.41

# 5. Emulator
emulator -version
# Expected: Android emulator version 33.x.x

# 6. Node.js
node --version
# Expected: v18.x.x or higher

npm --version
# Expected: 9.x.x or higher
```

**All commands should work without "command not found" errors!**

---

## 4. AVD Setup (Android Virtual Device - Emulator)

### Step 1: Launch AVD Manager

**From Android Studio:**
```
Method 1: Tools → Device Manager
Method 2: Top toolbar → Device Manager icon
Method 3: Configure → AVD Manager (from welcome screen)
```

### Step 2: Create New Virtual Device

**Click "Create Device"**

**1. Select Hardware:**
```
Category: Phone
Device: Pixel 7 Pro

Why Pixel 7 Pro?
✓ Common device
✓ Good screen size (6.7")
✓ High resolution (1440 x 3120)
✓ Represents modern Android device
✓ Google Play Store included

Alternative choices:
- Pixel 7 (smaller)
- Samsung Galaxy S23 (if available)
- Pixel 6 (older but stable)

Click "Next"
```

**2. Select System Image:**
```
Release Name: UpsideDownCake
API Level: 34
ABI: x86_64
Target: Android 14.0 (Google APIs)

If not downloaded, click "Download" next to it
Wait for download (~1.5 GB)

Click "Next"
```

**3. Configure AVD:**
```
AVD Name: Pixel_7_Pro_API_34
Change to something descriptive like: Pixel_7_Pro_Android_14_Test

Startup orientation: Portrait

Show Advanced Settings:

Camera:
  Front: Emulated
  Back: VirtualScene (or Emulated)

Network:
  Speed: Full
  Latency: None

Memory and Storage:
  RAM: 2048 MB (minimum for API 34)
  VM heap: 512 MB
  Internal Storage: 2048 MB
  SD card: 512 MB

Emulated Performance:
  Graphics: Automatic (or Hardware - GLES 2.0)
  Boot option: Quick Boot
  Multi-Core CPU: 4 cores

Enable Device Frame: ✓ (shows device bezel)

Click "Finish"
```

### Step 3: Start AVD (Emulator)

**Method 1: From Android Studio**
```
Device Manager → Find your AVD → Click ▶ (Play button)
```

**Method 2: Command Line**
```bash
# List available AVDs
emulator -list-avds

# Output:
# Pixel_7_Pro_Android_14_Test

# Start specific AVD
emulator -avd Pixel_7_Pro_Android_14_Test

# Start with specific options
emulator -avd Pixel_7_Pro_Android_14_Test -no-snapshot-load -wipe-data

# Start in headless mode (no UI window)
emulator -avd Pixel_7_Pro_Android_14_Test -no-window -no-audio
```

**First Boot:**
- Takes 2-5 minutes
- Shows Android boot animation
- Eventually shows home screen
- May prompt to set up device (skip for testing)

**Verify Emulator is Running:**
```bash
adb devices

# Output should show:
# List of devices attached
# emulator-5554   device
```

### Emulator Controls

**Essential Shortcuts:**
```
Power: Long-press Power button on control panel
Home: Press Home button
Back: Press Back button
Recent Apps: Press Overview button
Rotate: Ctrl+Left/Right Arrow
Volume Up: Ctrl+Up Arrow
Volume Down: Ctrl+Down Arrow
Screenshot: Camera icon or Ctrl+S (Windows/Linux), Cmd+S (macOS)
```

**Extended Controls (...button):**
```
Location: Set GPS coordinates
Cellular: Change network type (4G, 3G, etc.)
Battery: Set battery level and charging state
Phone: Test incoming calls and SMS
Directional Pad: Navigation controls
Microphone: Test audio
Fingerprint: Simulate fingerprint auth
Virtual Sensors: Accelerometer, etc.
Settings: Emulator configuration
Help: Keyboard shortcuts and help
```

### Emulator Performance Tips

**Windows:**
```
1. Enable Hyper-V or Intel HAXM
2. Allocate sufficient RAM (2GB minimum)
3. Use x86_64 images (faster than ARM)
4. Enable hardware graphics (GLES 2.0)
5. Close other heavy applications
```

**macOS:**
```
1. Use at least 4GB RAM for emulator
2. Enable hardware graphics
3. Use x86_64 for Intel Macs
4. Use arm64-v8a for Apple Silicon (M1/M2/M3)
```

**Linux:**
```
1. Ensure KVM is enabled
2. Add user to kvm group: sudo usermod -a -G kvm $USER
3. Use hardware graphics
4. Verify: kvm-ok (should say "KVM acceleration can be used")
```

---

## 5. Sample App Download & Installation

### Option 1: Use Sample APK Files

**Download Sample Apps:**

**1. Appium Sample App (Recommended for Learning):**
```bash
# Create directory for test apps
mkdir test-apps
cd test-apps

# Download Android APK
curl -L https://github.com/appium/android-apidemos/releases/download/v3.1.0/ApiDemos-debug.apk -o ApiDemos.apk

# Alternative: WebdriverIO Demo App
curl -L https://github.com/webdriverio/native-demo-app/releases/download/v1.0.8/android.wdio.native.app.v1.0.8.apk -o WebdriverIODemo.apk
```

**2. Real-World Sample: Wikipedia App**
```bash
# Download Wikipedia Alpha (test version)
curl -L https://github.com/wikimedia/apps-android-wikipedia/releases/download/latest/app-alpha-universal-release.apk -o Wikipedia.apk
```

### Option 2: Use Your Own App

```bash
# If you have your own app, just copy the APK file
# Example:
cp /path/to/your-app.apk ./test-apps/MyApp.apk
```

### Install App on Emulator

**Prerequisites: Emulator must be running**

```bash
# Check if emulator is running
adb devices

# Should show:
# emulator-5554   device

# Install APK on emulator
adb install test-apps/ApiDemos.apk

# Output:
# Performing Streamed Install
# Success

# Verify installation
adb shell pm list packages | grep apidemos

# Output:
# package:com.example.android.apis

# Launch the app (optional)
adb shell am start -n com.example.android.apis/.ApiDemos

# Uninstall if needed
adb uninstall com.example.android.apis
```

### Get App Package and Activity Name

**Method 1: Using AAPT (APK Analyzer)**
```bash
# Navigate to SDK build-tools
cd %ANDROID_HOME%\build-tools\34.0.0   # Windows
cd $ANDROID_HOME/build-tools/34.0.0    # macOS/Linux

# Analyze APK
aapt dump badging path\to\app.apk | findstr package    # Windows
aapt dump badging path/to/app.apk | grep package       # macOS/Linux

# Output shows:
# package: name='com.example.android.apis' versionCode='1'

# Find main activity
aapt dump badging path/to/app.apk | findstr launchable-activity    # Windows
aapt dump badging path/to/app.apk | grep launchable-activity       # macOS/Linux

# Output:
# launchable-activity: name='com.example.android.apis.ApiDemos'
```

**Method 2: Using Appium Inspector or Android Studio**
```
1. Install app on device/emulator
2. Launch app manually
3. Run: adb shell dumpsys window | findstr mCurrentFocus   # Windows
        adb shell dumpsys window | grep mCurrentFocus      # macOS/Linux

Output shows current activity:
mCurrentFocus=Window{abc123 u0 com.example.android.apis/com.example.android.apis.ApiDemos}
                                 ^package name          ^activity name
```

**Save these values - you'll need them for WebdriverIO configuration!**

```
Package Name (appPackage): com.example.android.apis
Activity Name (appActivity): com.example.android.apis.ApiDemos
or just: .ApiDemos (shorthand)
```

---

## 6. Connecting Real Device Over WiFi

### Prerequisites
- Android device and computer on same WiFi network
- USB cable (for initial setup)
- USB Debugging enabled on device

### Step 1: Enable Developer Options & USB Debugging

**On Android Device:**
```
1. Go to Settings
2. About Phone (or About Device)
3. Find "Build Number"
4. Tap "Build Number" 7 times rapidly
5. You'll see: "You are now a developer!"

6. Go back to Settings
7. System → Developer Options (or just Developer Options)
8. Enable:
   ✓ Developer Options (main toggle)
   ✓ USB Debugging
   ✓ Stay Awake (optional, keeps screen on while charging)
```

### Step 2: Connect via USB Initially

```bash
# Connect device with USB cable

# Check if device is detected
adb devices

# First time will show:
# List of devices attached
# ABC123XYZ    unauthorized

# On your phone:
# Accept "Allow USB debugging?" prompt
# ✓ Always allow from this computer
# Tap "OK"

# Check again
adb devices

# Now shows:
# ABC123XYZ    device
```

### Step 3: Enable TCP/IP Mode

```bash
# Enable ADB over TCP/IP on port 5555
adb tcpip 5555

# Output:
# restarting in TCP mode port: 5555

# You can now disconnect USB cable!
```

### Step 4: Find Device IP Address

**Method 1: On Device**
```
Settings → About Phone → Status → IP Address
or
Settings → Network & Internet → WiFi → Connected WiFi → IP Address

Example: 192.168.1.150
```

**Method 2: Using ADB (while still connected via USB)**
```bash
adb shell ip addr show wlan0 | findstr inet    # Windows
adb shell ip addr show wlan0 | grep inet       # macOS/Linux

# Shows IP like: 192.168.1.150
```

### Step 5: Connect Wirelessly

```bash
# Connect to device using IP address
adb connect 192.168.1.150:5555

# Output:
# connected to 192.168.1.150:5555

# Verify connection
adb devices

# Output:
# List of devices attached
# 192.168.1.150:5555    device

# Now you can disconnect USB cable completely!
```

### Step 6: Test Wireless Connection

```bash
# Install app wirelessly
adb -s 192.168.1.150:5555 install test-apps/ApiDemos.apk

# View logs wirelessly
adb -s 192.168.1.150:5555 logcat

# Take screenshot
adb -s 192.168.1.150:5555 shell screencap /sdcard/screen.png
adb -s 192.168.1.150:5555 pull /sdcard/screen.png

# All ADB commands work wirelessly now!
```

### Reconnecting After Restart

```bash
# If device or computer restarts, connection is lost
# To reconnect:

# 1. Make sure device and computer on same WiFi
# 2. Connect device via USB again (one time)
# 3. Run: adb tcpip 5555
# 4. Disconnect USB
# 5. Run: adb connect 192.168.1.150:5555

# Or create a script:
```

**Windows Batch Script (reconnect-wifi.bat):**
```batch
@echo off
echo Reconnecting Android device wirelessly...
adb tcpip 5555
timeout /t 3
adb connect 192.168.1.150:5555
adb devices
pause
```

**macOS/Linux Bash Script (reconnect-wifi.sh):**
```bash
#!/bin/bash
echo "Reconnecting Android device wirelessly..."
adb tcpip 5555
sleep 3
adb connect 192.168.1.150:5555
adb devices
```

### Disconnecting WiFi Connection

```bash
# Disconnect specific device
adb disconnect 192.168.1.150:5555

# Disconnect all
adb disconnect

# To go back to USB only
adb usb
```

### Troubleshooting WiFi Connection

**Connection Refused:**
```bash
# Issue: "failed to connect to 192.168.1.150:5555"
# Solutions:
1. Check both device and computer on same WiFi
2. Reconnect via USB and run: adb tcpip 5555
3. Verify IP address hasn't changed
4. Check firewall isn't blocking port 5555
5. Restart ADB: adb kill-server && adb start-server
```

**Device Offline:**
```bash
# Issue: Device shows as "offline"
# Solutions:
1. adb disconnect
2. adb connect 192.168.1.150:5555
3. If still offline, reconnect via USB
```

**Multiple Devices:**
```bash
# List all connected devices
adb devices

# Specify device for commands
adb -s 192.168.1.150:5555 install app.apk
adb -s emulator-5554 install app.apk
```

---

## 7. WebdriverIO Project Setup

### Step 1: Create Project Directory

```bash
# Create and navigate to project folder
mkdir mobile-automation
cd mobile-automation

# Initialize Node.js project
npm init -y

# This creates package.json
```

### Step 2: Install WebdriverIO

```bash
# Install WebdriverIO CLI
npm install --save-dev @wdio/cli

# Run configuration wizard
npx wdio config

# Or shorter version:
npm init wdio@latest .
```

### Step 3: Configuration Wizard Answers

```
? Where is your automation backend located?
  › On my local machine

? Which framework do you want to use?
  › Mocha

? Do you want to use a compiler?
  › TypeScript (https://www.typescriptlang.org/)

? Where are your test specs located?
  › ./test/specs/**/*.ts

? Do you want WebdriverIO to autogenerate some test files?
  › Yes

? Which reporter do you want to use?
  › spec
  › allure (select both using space, then enter)

? Do you want to add a plugin to your test setup?
  › wait-for (use space to select, enter to continue)

? Do you want to add a service to your test setup?
  › appium (IMPORTANT: Select this!)

? What is the base url?
  › (leave empty, press enter)

? Do you want me to run `npm install`
  › Yes
```

**Installation will take 2-5 minutes**

### Step 4: Project Structure Created

```
mobile-automation/
├── node_modules/              (dependencies)
├── test/
│   ├── specs/
│   │   └── example.e2e.ts     (sample test)
│   └── pageobjects/
│       └── example.page.ts    (sample page object)
├── wdio.conf.ts              (main config file)
├── tsconfig.json             (TypeScript config)
├── package.json              (project info)
└── package-lock.json         (dependency lock)
```

### Step 5: Install Appium

```bash
# Install Appium globally
npm install -g appium

# Verify installation
appium --version
# Should show: 2.x.x

# Install drivers
appium driver install uiautomator2

# Verify driver installed
appium driver list

# Should show:
# uiautomator2@x.x.x [installed]
```

### Step 6: Configure for Android (wdio.conf.ts)

Open `wdio.conf.ts` and update:

```typescript
export const config: WebdriverIO.Config = {
    // Runner Configuration
    runner: 'local',
    
    // Test files
    specs: [
        './test/specs/**/*.ts'
    ],
    
    // Capabilities - Android Emulator
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Pixel_7_Pro_Android_14_Test',  // Your AVD name
        'appium:platformVersion': '14.0',                     // Your Android version
        'appium:automationName': 'UiAutomator2',
        'appium:app': '/absolute/path/to/your/app.apk',      // CHANGE THIS
        // For Windows: 'C:\\Users\\YourName\\mobile-automation\\test-apps\\ApiDemos.apk'
        // For macOS/Linux: '/Users/yourname/mobile-automation/test-apps/ApiDemos.apk'
        
        'appium:appPackage': 'com.example.android.apis',     // Your app package
        'appium:appActivity': '.ApiDemos',                   // Your app activity
        'appium:autoGrantPermissions': true,
        'appium:newCommandTimeout': 240,
        'appium:noReset': false,                             // Reset app state
        'appium:fullReset': false,                           // Don't uninstall between tests
    }],
    
    // Test runner settings
    logLevel: 'info',
    bail: 0,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    // Services
    services: [
        ['appium', {
            command: 'appium',
            args: {
                address: 'localhost',
                port: 4723,
                relaxedSecurity: true
            },
            logPath: './logs/'
        }]
    ],
    
    // Framework
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    
    // Reporters
    reporters: [
        'spec',
        ['allure', {
            outputDir: 'allure-results',
            disableWebdriverStepsReporting: true,
            disableWebdriverScreenshotsReporting: false,
        }]
    ],
    
    // Hooks
    beforeSession: function (config, capabilities, specs) {
        console.log('Starting test session...');
    },
    
    afterTest: async function(test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            // Take screenshot on failure
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const screenshotPath = `./screenshots/${test.title}-${timestamp}.png`;
            await driver.saveScreenshot(screenshotPath);
            console.log(`Screenshot saved: ${screenshotPath}`);
        }
    }
};
```

### Step 7: Create Directories

```bash
# Create necessary directories
mkdir -p test-apps
mkdir -p screenshots
mkdir -p logs
mkdir -p allure-results
mkdir -p allure-report

# On Windows use:
# mkdir test-apps screenshots logs allure-results allure-report
```

---

## 8. BrowserStack Configuration

### Step 1: Create BrowserStack Account

```
1. Visit: https://www.browserstack.com/users/sign_up
2. Sign up for free trial (100 minutes free)
3. Verify email
4. Login to dashboard
```

### Step 2: Get BrowserStack Credentials

```
1. Go to: https://www.browserstack.com/accounts/settings
2. Find section: "Access Key"
3. Copy:
   - Username: your_username
   - Access Key: abc123xyz456... (keep this secret!)
```

### Step 3: Install BrowserStack Service

```bash
npm install --save-dev @wdio/browserstack-service
```

### Step 4: Upload App to BrowserStack

**Method 1: Using Dashboard**
```
1. Login to BrowserStack
2. Go to: App Live or App Automate
3. Click "Upload"
4. Select your APK file
5. Copy the app URL: bs://abc123xyz
```

**Method 2: Using curl**
```bash
# Windows (PowerShell)
$username = "your_username"
$accessKey = "your_access_key"
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${accessKey}"))
Invoke-WebRequest -Uri "https://api-cloud.browserstack.com/app-automate/upload" `
  -Method Post `
  -Headers @{"Authorization"="Basic $auth"} `
  -InFile "test-apps\ApiDemos.apk"

# macOS/Linux
curl -u "your_username:your_access_key" \
  -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@test-apps/ApiDemos.apk"

# Response will show:
# {
#   "app_url": "bs://abc123xyz456",
#   "custom_id": "MyApp",
#   "shareable_id": "username/MyApp"
# }

# Save the app_url - you'll need it!
```

### Step 5: Create BrowserStack Configuration

Create `wdio.conf.bs.ts`:

```typescript
import { config as baseConfig } from './wdio.conf.ts';

export const config: WebdriverIO.Config = {
    ...baseConfig,
    
    // BrowserStack credentials
    user: process.env.BROWSERSTACK_USERNAME || 'your_username',
    key: process.env.BROWSERSTACK_ACCESS_KEY || 'your_access_key',
    
    hostname: 'hub.browserstack.com',
    
    // Capabilities for BrowserStack
    capabilities: [{
        // BrowserStack specific options
        'bstack:options': {
            projectName: 'Mobile Automation Project',
            buildName: `Build ${new Date().toISOString()}`,
            sessionName: 'Android Test Session',
            debug: true,
            networkLogs: true,
            video: true,
            appiumLogs: true,
        },
        
        // Device capabilities
        platformName: 'Android',
        'appium:platformVersion': '13.0',
        'appium:deviceName': 'Samsung Galaxy S23',  // BrowserStack device
        'appium:app': 'bs://abc123xyz456',          // Your uploaded app URL
        'appium:automationName': 'UiAutomator2',
        'appium:autoGrantPermissions': true,
    }],
    
    // BrowserStack Service
    services: [
        ['browserstack', {
            testObservability: true,
            testObservabilityOptions: {
                projectName: 'Mobile Automation',
                buildName: `Build ${Date.now()}`
            },
            browserstackLocal: false  // Set true for testing local apps
        }]
    ],
    
    // Remove local Appium service
    // (BrowserStack manages Appium)
    
    // Update test status on BrowserStack
    afterTest: async function(test, context, { error, result, passed }) {
        // Mark test status
        await driver.execute(
            `browserstack_executor: ${JSON.stringify({
                action: 'setSessionStatus',
                arguments: {
                    status: passed ? 'passed' : 'failed',
                    reason: passed ? 'Test passed' : error?.message || 'Test failed'
                }
            })}`
        );
    }
};
```

### Step 6: Set Environment Variables

**Windows:**
```powershell
# Temporary (current session only)
$env:BROWSERSTACK_USERNAME="your_username"
$env:BROWSERSTACK_ACCESS_KEY="your_access_key"

# Permanent (system-wide)
setx BROWSERSTACK_USERNAME "your_username"
setx BROWSERSTACK_ACCESS_KEY "your_access_key"
```

**macOS/Linux:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"

# Apply changes
source ~/.zshrc
```

**Or use .env file (Recommended for security):**

```bash
# Install dotenv
npm install --save-dev dotenv

# Create .env file
echo "BROWSERSTACK_USERNAME=your_username" > .env
echo "BROWSERSTACK_ACCESS_KEY=your_access_key" >> .env

# Add to .gitignore
echo ".env" >> .gitignore
```

Then in `wdio.conf.bs.ts`:
```typescript
import * as dotenv from 'dotenv';
dotenv.config();

export const config: WebdriverIO.Config = {
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    // ... rest of config
};
```

---

## 9. First Test on Emulator

### Step 1: Start Emulator

```bash
# List available AVDs
emulator -list-avds

# Start your emulator
emulator -avd Pixel_7_Pro_Android_14_Test

# Wait for emulator to fully boot (2-5 minutes)

# Verify emulator is running
adb devices
# Should show: emulator-5554   device
```

### Step 2: Create Your First Test

Create `test/specs/first-test.spec.ts`:

```typescript
describe('My First Mobile Test', () => {
    it('should launch app successfully', async () => {
        // Wait for app to load
        await driver.pause(3000);
        
        // Verify app launched
        const activity = await driver.getCurrentActivity();
        console.log('Current Activity:', activity);
        
        expect(activity).toContain('ApiDemos');
    });
    
    it('should find and click an element', async () => {
        // Find element by accessibility id
        const element = await $('~Views');
        
        // Verify element is displayed
        await expect(element).toBeDisplayed();
        
        // Click element
        await element.click();
        
        // Wait for new screen
        await driver.pause(1000);
        
        // Verify navigation
        const title = await $('android=new UiSelector().text("Views")');
        await expect(title).toBeDisplayed();
    });
    
    it('should scroll and find element', async () => {
        // Navigate to Views if not already there
        await $('~Views').click();
        
        // Scroll to element
        await $('android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("Tabs"))');
        
        // Click the element after scrolling
        const tabs = await $('android=new UiSelector().text("Tabs")');
        await tabs.click();
        
        // Verify navigation
        await driver.pause(1000);
    });
});
```

### Step 3: Update Package.json Scripts

Edit `package.json`:

```json
{
  "scripts": {
    "test": "wdio run wdio.conf.ts",
    "test:emulator": "wdio run wdio.conf.ts",
    "test:browserstack": "wdio run wdio.conf.bs.ts",
    "test:specific": "wdio run wdio.conf.ts --spec"
  }
}
```

### Step 4: Run Test on Emulator

```bash
# Method 1: Using npm script
npm run test:emulator

# Method 2: Direct command
npx wdio run wdio.conf.ts

# Method 3: Run specific test file
npx wdio run wdio.conf.ts --spec test/specs/first-test.spec.ts

# Watch the test execute on emulator!
```

### Step 5: View Results

**Console Output:**
```
[0-0] RUNNING in Android - test/specs/first-test.spec.ts
[0-0] My First Mobile Test
[0-0]    ✓ should launch app successfully
[0-0]    ✓ should find and click an element
[0-0]    ✓ should scroll and find element
[0-0] 3 passing (12.5s)
```

**Allure Report:**
```bash
# Install Allure CLI globally
npm install -g allure-commandline

# Generate report
allure generate allure-results --clean -o allure-report

# Open report
allure open allure-report
```

---

## 10. First Test on Real Device

### Prerequisites
- Real device connected via WiFi (see Section 6)
- App installed on device
- Device shows in `adb devices`

### Step 1: Get Device Information

```bash
# List connected devices
adb devices

# Get device model
adb shell getprop ro.product.model

# Get Android version
adb shell getprop ro.build.version.release

# Get device UDID
adb devices -l
```

### Step 2: Create Real Device Configuration

Create `wdio.conf.real.ts`:

```typescript
import { config as baseConfig } from './wdio.conf.ts';

export const config: WebdriverIO.Config = {
    ...baseConfig,
    
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'MyRealDevice',  // Any name
        'appium:udid': '192.168.1.150:5555',  // Your device IP or USB ID
        'appium:platformVersion': '13',       // Your device Android version
        'appium:automationName': 'UiAutomator2',
        'appium:app': '/absolute/path/to/app.apk',
        'appium:appPackage': 'com.example.android.apis',
        'appium:appActivity': '.ApiDemos',
        'appium:autoGrantPermissions': true,
        'appium:newCommandTimeout': 240,
        'appium:noReset': false,
    }]
};
```

### Step 3: Update package.json

```json
{
  "scripts": {
    "test:emulator": "wdio run wdio.conf.ts",
    "test:real": "wdio run wdio.conf.real.ts",
    "test:browserstack": "wdio run wdio.conf.bs.ts"
  }
}
```

### Step 4: Run Test on Real Device

```bash
# Ensure device connected
adb devices

# Run test
npm run test:real

# Watch test execute on your physical device!
```

### Differences on Real Device

**Advantages:**
- Faster execution than emulator
- Real hardware sensors (GPS, camera, etc.)
- Actual touch response
- Real network conditions

**Considerations:**
- Need physical access to device
- Can't easily test multiple devices
- May need to handle device-specific quirks
- Battery drains during testing

---

## 11. First Test on BrowserStack

### Prerequisites
- BrowserStack account created (Section 8)
- App uploaded to BrowserStack
- Configuration file created (wdio.conf.bs.ts)
- Environment variables set

### Step 1: Verify BrowserStack Setup

```bash
# Check environment variables
# Windows:
echo %BROWSERSTACK_USERNAME%
echo %BROWSERSTACK_ACCESS_KEY%

# macOS/Linux:
echo $BROWSERSTACK_USERNAME
echo $BROWSERSTACK_ACCESS_KEY

# Both should show your credentials
```

### Step 2: Verify App Upload

```
1. Login to BrowserStack
2. Go to App Automate
3. Your app should be listed
4. Note the app_url: bs://abc123xyz
```

### Step 3: Update BrowserStack Config

Ensure `wdio.conf.bs.ts` has correct app URL:

```typescript
capabilities: [{
    // ...
    'appium:app': 'bs://abc123xyz456',  // YOUR app URL from BrowserStack
    // ...
}]
```

### Step 4: Run Test on BrowserStack

```bash
# Run BrowserStack tests
npm run test:browserstack

# Or direct command
npx wdio run wdio.conf.bs.ts

# Test runs on BrowserStack cloud!
```

### Step 5: View Results on BrowserStack Dashboard

```
1. Go to: https://app-automate.browserstack.com/dashboard
2. Find your test session
3. View:
   - Video recording
   - Screenshots
   - Logs (Appium, device, network)
   - Text logs
   - Commands executed
```

### Step 6: Multiple Devices on BrowserStack

Update `wdio.conf.bs.ts` for parallel testing:

```typescript
capabilities: [
    // Android - Samsung Galaxy S23
    {
        'bstack:options': {
            projectName: 'Multi-Device Tests',
            buildName: 'Android Tests',
            sessionName: 'Galaxy S23',
        },
        platformName: 'Android',
        'appium:platformVersion': '13.0',
        'appium:deviceName': 'Samsung Galaxy S23',
        'appium:app': 'bs://abc123xyz'
    },
    
    // Android - Google Pixel 7
    {
        'bstack:options': {
            sessionName: 'Pixel 7',
        },
        platformName: 'Android',
        'appium:platformVersion': '13.0',
        'appium:deviceName': 'Google Pixel 7',
        'appium:app': 'bs://abc123xyz'
    },
    
    // Android - OnePlus 11
    {
        'bstack:options': {
            sessionName: 'OnePlus 11',
        },
        platformName: 'Android',
        'appium:platformVersion': '13.0',
        'appium:deviceName': 'OnePlus 11',
        'appium:app': 'bs://abc123xyz'
    }
],

// Run in parallel
maxInstances: 3
```

Then run:
```bash
npm run test:browserstack
# Tests run on 3 devices simultaneously!
```

---

## 12. Running Tests - All Methods

### Quick Reference Commands

```bash
# ========== LOCAL EMULATOR ==========
# Start emulator first
emulator -avd Pixel_7_Pro_Android_14_Test

# Run all tests
npm run test:emulator

# Run specific test file
npx wdio run wdio.conf.ts --spec test/specs/first-test.spec.ts

# Run specific test suite
npx wdio run wdio.conf.ts --suite smoke

# Run with specific grep pattern
npx wdio run wdio.conf.ts --mochaOpts.grep "should launch"


# ========== REAL DEVICE ==========
# Connect device via WiFi
adb connect 192.168.1.150:5555

# Run tests
npm run test:real


# ========== BROWSERSTACK ==========
# Set credentials (if not set)
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"

# Run tests
npm run test:browserstack


# ========== DEBUGGING ==========
# Run in debug mode
npx wdio run wdio.conf.ts --spec test/specs/first-test.spec.ts --logLevel trace

# Run single test (add .only)
it.only('should launch app', async () => {
    // This test only
});
```

### Test Suites

Update `wdio.conf.ts`:

```typescript
// Define test suites
suites: {
    smoke: [
        './test/specs/smoke/*.spec.ts'
    ],
    regression: [
        './test/specs/**/*.spec.ts'
    ],
    login: [
        './test/specs/login/*.spec.ts'
    ]
},
```

Run suites:
```bash
npx wdio run wdio.conf.ts --suite smoke
npx wdio run wdio.conf.ts --suite regression
```

### Parallel Execution

```typescript
// In wdio.conf.ts
maxInstances: 3,  // Run 3 tests in parallel

// For emulator, start multiple AVDs:
emulator -avd Device1 -port 5554
emulator -avd Device2 -port 5556
emulator -avd Device3 -port 5558
```

### CI/CD Integration

**GitHub Actions (.github/workflows/mobile-tests.yml):**

```yaml
name: Mobile Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run BrowserStack tests
      env:
        BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
        BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
      run: npm run test:browserstack
    
    - name: Generate Allure Report
      if: always()
      run: |
        npm install -g allure-commandline
        allure generate allure-results --clean -o allure-report
    
    - name: Upload Allure Report
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: allure-report
        path: allure-report
```

---

## 13. Troubleshooting

### Common Issues & Solutions

**1. "adb: command not found"**
```bash
# Solution: Add platform-tools to PATH
# Windows:
set PATH=%PATH%;%ANDROID_HOME%\platform-tools
# macOS/Linux:
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Verify:
adb version
```

**2. "emulator: command not found"**
```bash
# Solution: Add emulator to PATH
# Windows:
set PATH=%PATH%;%ANDROID_HOME%\emulator
# macOS/Linux:
export PATH=$PATH:$ANDROID_HOME/emulator

# Verify:
emulator -version
```

**3. No emulators detected**
```bash
# Check AVD list:
emulator -list-avds

# If empty, create AVD via Android Studio:
# Tools → Device Manager → Create Device
```

**4. Emulator won't start**
```bash
# Windows: Enable Hyper-V or Intel HAXM
# macOS: Check disk space (needs 10GB+)
# Linux: Enable KVM
sudo apt install qemu-kvm
sudo usermod -a -G kvm $USER
# Logout and login again
```

**5. "Session creation failed"**
```typescript
// Increase timeouts in wdio.conf.ts:
connectionRetryTimeout: 180000,
connectionRetryCount: 3,
'appium:newCommandTimeout': 300,
```

**6. "App not installed"**
```bash
# Verify app path is absolute
# Windows: C:\Users\...\app.apk
# macOS/Linux: /Users/.../app.apk

# Verify package name
aapt dump badging app.apk | grep package

# Manually install to test
adb install -r app.apk
```

**7. "Element not found"**
```typescript
// Increase wait timeout
await element.waitForDisplayed({ timeout: 10000 });

// Use better locator
// Instead of:
await $('android=new UiSelector().text("Login")')

// Try:
await $('~login-button')  // accessibility id
```

**8. BrowserStack upload fails**
```bash
# Check file size (must be < 1GB for BrowserStack)
# Check credentials are correct
# Try re-uploading via dashboard
```

**9. WiFi connection drops**
```bash
# Reconnect:
adb tcpip 5555
adb connect 192.168.1.150:5555

# Make device not sleep:
# Settings → Developer Options → Stay Awake = ON
```

**10. Tests timeout**
```typescript
// Increase Mocha timeout
mochaOpts: {
    timeout: 120000  // 2 minutes
}
```

### Debug Tips

**1. Enable verbose logging:**
```bash
npx wdio run wdio.conf.ts --logLevel trace
```

**2. Take screenshots:**
```typescript
await driver.saveScreenshot('./debug-screenshot.png');
```

**3. Get page source:**
```typescript
const source = await driver.getPageSource();
console.log(source);
```

**4. Pause execution:**
```typescript
await driver.pause(5000);  // Wait 5 seconds
await driver.debug();      // Interactive debug mode
```

**5. View Appium logs:**
```bash
# Logs are in ./logs/ directory
# Check: appium.log
```

---

## Summary Checklist

**Setup Complete When:**
- ✅ Java installed and JAVA_HOME set
- ✅ Android Studio installed with SDK
- ✅ ANDROID_HOME environment variable set
- ✅ adb and emulator commands work
- ✅ AVD created and starts successfully
- ✅ Node.js and npm installed
- ✅ WebdriverIO project created
- ✅ Appium installed globally
- ✅ Sample app downloaded and installed
- ✅ First test runs on emulator
- ✅ Real device connects via WiFi
- ✅ First test runs on real device
- ✅ BrowserStack account created
- ✅ App uploaded to BrowserStack
- ✅ First test runs on BrowserStack

**You're ready to start mobile test automation!** 🎉

---

## Next Steps

1. **Learn Page Object Model:** Organize tests better
2. **Add More Tests:** Cover your app's features
3. **Integrate CI/CD:** Automate test execution
4. **Explore Advanced Features:** Gestures, alerts, permissions
5. **Performance Testing:** Monitor app performance
6. **Visual Testing:** Screenshot comparison

---

**End of Guide**

For questions or issues, refer to:
- WebdriverIO Docs: https://webdriver.io/docs/mobile-testing
- Appium Docs: https://appium.io/docs/en/latest/
- BrowserStack Docs: https://www.browserstack.com/docs/app-automate

Happy Testing! 🚀
