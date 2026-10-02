# AWS for Test Automation: Beginner's Guide to Running Playwright Tests

A practical, hands-on guide for test automation engineers who want to run Playwright tests on AWS.

> **✨ Updated for February 2026**  
> This guide uses the latest versions:
> - **Ubuntu 24.04 LTS** (Noble Numbat) - Latest stable release
> - **Playwright 1.58** - Latest version with improved performance
> - **Node.js 20 LTS** - Recommended for Playwright
> - **Auto-updating AMI IDs** - No more hardcoded, outdated AMIs!

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [AWS Free Tier Overview](#aws-free-tier-overview)
4. [Setup Guide](#setup-guide)
5. [Running Your First Playwright Test](#running-your-first-playwright-test)
6. [CI/CD Integration](#cicd-integration)
7. [Cost Management](#cost-management)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps](#next-steps)

---

## Introduction

### What's New in 2026? 🆕

This guide has been updated with the latest technology:

**AWS Updates:**
- ✅ **Ubuntu 24.04 LTS** (Noble Numbat) - Released April 2024, supported until 2029
- ✅ **Auto-updating AMI IDs** - Uses AWS SSM Parameter Store to always get the latest AMI
- ✅ **EBS GP3 volumes** - Faster and more cost-effective storage
- ✅ **Latest GitHub Actions** - Updated to v4 for better performance

**Playwright Updates:**
- ✅ **Playwright 1.58** - Latest stable release (January 2026)
- ✅ **Improved locators** - Smarter element detection
- ✅ **Better debugging** - Enhanced trace viewer and error messages
- ✅ **Faster execution** - Performance optimizations

**Best Practices:**
- ✅ **Node.js 20 LTS** - Long-term support until 2026
- ✅ **Modern AWS CLI syntax** - Updated commands
- ✅ **Security improvements** - Latest security patches included

---

### Why AWS for Playwright Tests?

Running Playwright tests on AWS gives you:

- **Scalability**: Run tests in parallel across multiple machines
- **Cost efficiency**: Pay only for what you use (or use Free Tier)
- **Consistency**: Same environment every time
- **Integration**: Easy connection to CI/CD pipelines
- **Learning**: Industry-standard cloud skills

### What You'll Build

By the end of this guide, you'll have:

1. EC2 instance running Playwright tests
2. S3 bucket storing test reports
3. GitHub Actions triggering tests automatically
4. Basic monitoring and alerts

**Time required**: 2-3 hours  
**Cost**: $0 (using Free Tier)

---

## Prerequisites

### Required Knowledge

- Basic terminal/command line usage
- Basic understanding of Playwright
- Git basics
- Basic understanding of CI/CD concepts

### Required Tools

- AWS Account (sign up at aws.amazon.com)
- GitHub account
- Local terminal (Mac/Linux) or PowerShell/WSL (Windows)
- Text editor (VS Code recommended)

### Required Setup

Before starting:

**Mac/Linux:**
```bash
# Verify you have these installed locally
node --version   # v18 or higher
npm --version
git --version
```

**Windows (PowerShell):**
```powershell
# Verify you have these installed locally
node --version   # v18 or higher
npm --version
git --version
```

---

## AWS Free Tier Overview

### What's Included (for Testing)

| Service | Free Tier Limit | Use Case |
|---------|----------------|----------|
| **EC2** | 750 hours/month (t2.micro or t3.micro) | Run test machines |
| **S3** | 5 GB storage, 20,000 GET requests | Store test reports |
| **Lambda** | 1 million requests/month | Serverless test triggers |
| **CodeBuild** | 100 build minutes/month | CI/CD builds |
| **CloudWatch** | 10 custom metrics, 10 alarms | Monitoring |

### Free Tier Duration

- **12 months**: EC2, S3, Lambda, CodeBuild
- **Always free**: CloudWatch Logs (5 GB), Lambda (1M requests)

### Important Notes

⚠️ **Free Tier applies to new AWS accounts only**  
⚠️ **Usage resets monthly, not cumulatively**  
⚠️ **Must stay within limits to avoid charges**

---

## Setup Guide

### Step 1: Create AWS Account

1. Go to aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the signup process
4. Add payment method (required even for Free Tier)
5. Verify email and phone

### Step 2: Set Up AWS CLI

The AWS CLI lets you control AWS from your terminal.

#### Install AWS CLI

**Mac:**
```bash
# Using Homebrew (recommended)
brew install awscli

# Verify installation
aws --version
```

**Windows (PowerShell - Run as Administrator):**
```powershell
# Download and install AWS CLI
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# After installation, close and reopen PowerShell, then verify
aws --version
```

Or manually download from: https://awscli.amazonaws.com/AWSCLIV2.msi

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

#### Configure AWS CLI

**Mac/Linux:**
```bash
aws configure
```

**Windows (PowerShell):**
```powershell
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Get from AWS Console → IAM → Users → Security credentials
- **AWS Secret Access Key**: Shown once when creating access key (save it!)
- **Default region**: `us-east-1` (recommended for Free Tier)
- **Default output format**: `json`

**Example interaction:**
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: json
```

**Verify setup:**

**Mac/Linux:**
```bash
aws sts get-caller-identity
```

**Windows (PowerShell):**
```powershell
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

### Step 3: Create SSH Key Pair

You need this to connect to EC2 instances.

**Mac/Linux:**
```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh

# Create key pair
aws ec2 create-key-pair \
  --key-name playwright-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/playwright-key.pem

# Set correct permissions (important for security)
chmod 400 ~/.ssh/playwright-key.pem

# Verify file was created
ls -la ~/.ssh/playwright-key.pem
```

**Windows (PowerShell):**
```powershell
# Create .ssh directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.ssh

# Create key pair and save to file
aws ec2 create-key-pair `
  --key-name playwright-key `
  --query 'KeyMaterial' `
  --output text | Out-File -Encoding ascii -FilePath $env:USERPROFILE\.ssh\playwright-key.pem

# Verify file was created
Get-Item $env:USERPROFILE\.ssh\playwright-key.pem
```

**Note for Windows users:** You'll need to set permissions on the key file:
1. Right-click on `playwright-key.pem` → Properties
2. Security tab → Advanced
3. Disable inheritance → Remove all inherited permissions
4. Add → Select your user account → Grant "Full control"
5. Remove all other users

Or use Git Bash (if installed):
```bash
chmod 400 ~/.ssh/playwright-key.pem
```

### Step 4: Create Security Group

Security groups control network access to your EC2 instance.

**Find your current IP address:**

**Mac/Linux:**
```bash
curl ifconfig.me
```

**Windows (PowerShell):**
```powershell
(Invoke-WebRequest -Uri "https://ifconfig.me").Content
```

**Or visit:** https://whatismyipaddress.com/

Copy your IP address (e.g., `203.0.113.45`) - you'll need it in the next step.

---

**Create security group and allow SSH access:**

**Mac/Linux:**
```bash
# Replace YOUR_IP with your actual IP from above
YOUR_IP="203.0.113.45"

# Create security group
aws ec2 create-security-group \
  --group-name playwright-sg \
  --description "Security group for Playwright tests"

# Allow SSH access from your IP only
aws ec2 authorize-security-group-ingress \
  --group-name playwright-sg \
  --protocol tcp \
  --port 22 \
  --cidr ${YOUR_IP}/32
```

**Windows (PowerShell):**
```powershell
# Replace YOUR_IP with your actual IP from above
$YOUR_IP = "203.0.113.45"

# Create security group
aws ec2 create-security-group `
  --group-name playwright-sg `
  --description "Security group for Playwright tests"

# Allow SSH access from your IP only
aws ec2 authorize-security-group-ingress `
  --group-name playwright-sg `
  --protocol tcp `
  --port 22 `
  --cidr "$YOUR_IP/32"
```

**Expected output:**
```json
{
    "Return": true,
    "SecurityGroupRules": [...]
}
```

⚠️ **Security Note:** The `/32` means only YOUR IP can connect. This is secure!

### Step 5: Launch EC2 Instance

Launch a Free Tier eligible instance (Ubuntu 24.04 LTS):

**Important:** We'll use AWS SSM Parameter Store to automatically get the latest Ubuntu 24.04 AMI ID. This ensures you always get the most up-to-date image with security patches.

**Mac/Linux:**
```bash
# Launch instance with latest Ubuntu 24.04 AMI (auto-retrieved)
aws ec2 run-instances \
  --image-id resolve:ssm:/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id \
  --instance-type t2.micro \
  --key-name playwright-key \
  --security-groups playwright-sg \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=playwright-runner}]'
```

**Windows (PowerShell):**
```powershell
# Launch instance with latest Ubuntu 24.04 AMI (auto-retrieved)
aws ec2 run-instances `
  --image-id resolve:ssm:/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id `
  --instance-type t2.micro `
  --key-name playwright-key `
  --security-groups playwright-sg `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=playwright-runner}]'
```

**What's happening?**
- `resolve:ssm:...` automatically fetches the latest Ubuntu 24.04 LTS AMI ID
- This means you always get the newest security patches
- No need to manually find AMI IDs!

**Expected output:** JSON with instance details (InstanceId, State, etc.)

---

**Get instance details:**

**Mac/Linux:**
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=playwright-runner" \
  --query "Reservations[0].Instances[0].[InstanceId,PublicIpAddress,State.Name]" \
  --output table
```

**Windows (PowerShell):**
```powershell
aws ec2 describe-instances `
  --filters "Name=tag:Name,Values=playwright-runner" `
  --query "Reservations[0].Instances[0].[InstanceId,PublicIpAddress,State.Name]" `
  --output table
```

**Expected output:**
```
-----------------------------------------
|          DescribeInstances            |
+---------------+------------------------+
|  i-1234567890abcdef0  |  54.123.45.67  |  running  |
+---------------+------------------------+
```

**Copy the Public IP Address** (e.g., `54.123.45.67`) - you'll need this to connect!

⏱️ **Wait 2-3 minutes** for the instance to fully start before connecting.

### Step 6: Connect to EC2 Instance

**Mac/Linux (Terminal):**
```bash
# Replace YOUR_INSTANCE_IP with the IP from previous step
ssh -i ~/.ssh/playwright-key.pem ubuntu@YOUR_INSTANCE_IP

# Example:
# ssh -i ~/.ssh/playwright-key.pem ubuntu@54.123.45.67
```

**Windows Option 1 - PowerShell (with OpenSSH):**
```powershell
# Replace YOUR_INSTANCE_IP with the IP from previous step
ssh -i $env:USERPROFILE\.ssh\playwright-key.pem ubuntu@YOUR_INSTANCE_IP

# Example:
# ssh -i $env:USERPROFILE\.ssh\playwright-key.pem ubuntu@54.123.45.67
```

**Windows Option 2 - Git Bash (Recommended):**
```bash
ssh -i ~/.ssh/playwright-key.pem ubuntu@YOUR_INSTANCE_IP
```

**Windows Option 3 - PuTTY:**
1. Download PuTTY from: https://www.putty.org/
2. Convert `.pem` to `.ppk` using PuTTYgen:
   - Open PuTTYgen
   - Load → Select `playwright-key.pem`
   - Save private key → Save as `playwright-key.ppk`
3. Open PuTTY:
   - Host Name: `ubuntu@YOUR_INSTANCE_IP`
   - Connection → SSH → Auth → Browse → Select `playwright-key.ppk`
   - Click Open

---

**First time connecting - Accept fingerprint:**

You'll see this warning (this is normal):
```
The authenticity of host '54.123.45.67' can't be established.
ECDSA key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and press Enter.

---

**Troubleshooting connection issues:**

**If you see "Permission denied":**

**Mac/Linux:**
```bash
# Fix file permissions
chmod 400 ~/.ssh/playwright-key.pem
```

**Windows (PowerShell):**
```powershell
# Use icacls to fix permissions
icacls $env:USERPROFILE\.ssh\playwright-key.pem /inheritance:r
icacls $env:USERPROFILE\.ssh\playwright-key.pem /grant:r "$($env:USERNAME):(R)"
```

**If connection times out:**
- Wait 2-3 minutes for instance to fully start
- Verify security group allows your current IP
- Check if your IP changed (WiFi networks can change your IP)

**If connection is refused:**
- Instance may still be initializing - wait longer
- Check instance is "running" (not "pending")

---

**Success! You should see:**
```
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-1026-aws x86_64)

ubuntu@ip-172-31-xx-xx:~$ 
```

You're now connected to your EC2 instance! 🎉

---

## Running Your First Playwright Test

Now you're connected to your EC2 instance. Let's set it up and run tests!

This section covers **4 different scenarios** based on where your tests are:

1. **[Create Fresh Tests](#scenario-1-create-fresh-tests-from-scratch)** - Start from scratch (beginner-friendly)
2. **[Upload Existing Repository](#scenario-2-upload-existing-local-repository)** - You have tests on your local machine
3. **[Clone Remote Repository](#scenario-3-clone-remote-repository)** - Tests are on GitHub/GitLab
4. **[GitHub Actions](#scenario-4-automated-execution-via-github-actions)** - Automated CI/CD pipeline

---

## Scenario 1: Create Fresh Tests from Scratch

**Best for:** Learning, first-time setup, starting new projects

### Install Node.js and Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20 LTS - recommended for Playwright)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version  # Should show v20.x
npm --version

# Install Playwright system dependencies
sudo npx playwright install-deps
```

### Create Test Project

```bash
# Create project directory
mkdir playwright-tests && cd playwright-tests

# Initialize npm project
npm init -y

# Install Playwright
npm install -D @playwright/test

# Install Playwright browsers
npx playwright install
```

### Create Your First Test

```bash
# Create test directory
mkdir tests

# Create test file
cat > tests/example.spec.js << 'EOF'
const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  
  const title = await page.title();
  expect(title).toContain('Playwright');
  
  console.log('✅ Test passed! Page title:', title);
});

test('search functionality', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  
  // Click search
  await page.getByRole('button', { name: 'Search' }).click();
  
  // Type search query
  await page.getByPlaceholder('Search docs').fill('testing');
  
  // Verify results appear
  await expect(page.getByRole('link', { name: /test/i }).first()).toBeVisible();
  
  console.log('✅ Search test passed!');
});
EOF
```

### Create Playwright Config

```bash
cat > playwright.config.js << 'EOF'
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
});
EOF
```

### Run Tests

```bash
npx playwright test
```

**Expected output:**
```
Running 2 tests using 1 worker

  ✓  tests/example.spec.js:3:1 › basic test (2s)
  ✓  tests/example.spec.js:11:1 › search functionality (3s)

  2 passed (5s)
```

### View HTML Report

```bash
npx playwright show-report
```

Since you're on a headless server, you'll need to upload the report to S3 to view it (covered in next sections).

---

## Scenario 2: Upload Existing Local Repository

**Best for:** You already have Playwright tests on your laptop and want to run them on EC2

### Step 1: Prepare Your Local Repository

**On your local machine:**

Make sure your project has:
- `package.json` with Playwright dependency
- `playwright.config.js` configuration file
- Tests in a `tests/` directory

### Step 2: Upload Repository to EC2

**Mac/Linux (from your local machine):**
```bash
# Navigate to your project directory
cd /path/to/your/playwright-project

# Upload entire project to EC2
scp -i ~/.ssh/playwright-key.pem -r ./* ubuntu@YOUR_INSTANCE_IP:~/playwright-tests/

# Example:
# scp -i ~/.ssh/playwright-key.pem -r ./* ubuntu@54.123.45.67:~/playwright-tests/
```

**Windows (PowerShell - from your local machine):**
```powershell
# Navigate to your project directory
cd C:\path\to\your\playwright-project

# Upload entire project to EC2
scp -i $env:USERPROFILE\.ssh\playwright-key.pem -r * ubuntu@YOUR_INSTANCE_IP:~/playwright-tests/

# Example:
# scp -i $env:USERPROFILE\.ssh\playwright-key.pem -r * ubuntu@54.123.45.67:~/playwright-tests/
```

**Alternative: Using rsync (Mac/Linux only - more efficient):**
```bash
# Rsync is faster and smarter about file transfers
rsync -avz -e "ssh -i ~/.ssh/playwright-key.pem" \
  --exclude 'node_modules' \
  --exclude 'playwright-report' \
  --exclude 'test-results' \
  ./* ubuntu@YOUR_INSTANCE_IP:~/playwright-tests/
```

**What to exclude:**
- `node_modules/` - Will be reinstalled on EC2
- `playwright-report/` - Generated on EC2
- `test-results/` - Generated on EC2
- `.git/` - Optional, depends on your workflow

### Step 3: Setup on EC2

**SSH into EC2:**
```bash
ssh -i ~/.ssh/playwright-key.pem ubuntu@YOUR_INSTANCE_IP
```

**Install dependencies:**
```bash
cd ~/playwright-tests

# Install Node.js if not already installed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install project dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

### Step 4: Run Your Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/login.spec.js

# Run tests with specific tag
npx playwright test --grep @smoke
```

### Step 5: Upload Report to S3

```bash
# Replace with your bucket name
BUCKET_NAME="playwright-reports-YOUR_USERNAME"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Upload report
aws s3 sync playwright-report/ s3://${BUCKET_NAME}/${TIMESTAMP}/ --delete

# Print URL
echo "📊 Report URL: https://${BUCKET_NAME}.s3.amazonaws.com/${TIMESTAMP}/index.html"
```

---

## Scenario 3: Clone Remote Repository

**Best for:** Tests are already on GitHub, GitLab, or Bitbucket

### Step 1: Install Git (if needed)

**On EC2:**
```bash
# Git is usually pre-installed on Ubuntu, but just in case
sudo apt update
sudo apt install -y git

# Verify installation
git --version
```

### Step 2: Clone Your Repository

**For Public Repositories:**
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/your-playwright-repo.git

# Navigate to project
cd your-playwright-repo
```

**For Private Repositories (with SSH key):**

First, generate SSH key on EC2 and add to GitHub:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter for all prompts (use default location)

# Display public key
cat ~/.ssh/id_ed25519.pub

# Copy this output and add to GitHub:
# GitHub → Settings → SSH and GPG keys → New SSH key
```

Then clone:
```bash
git clone git@github.com:YOUR_USERNAME/your-playwright-repo.git
cd your-playwright-repo
```

**For Private Repositories (with Personal Access Token):**

```bash
# Clone with token
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/your-playwright-repo.git

# Or set credentials
git config --global credential.helper store
git clone https://github.com/YOUR_USERNAME/your-playwright-repo.git
# Enter token when prompted
```

### Step 3: Install Node.js and Dependencies

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install project dependencies
npm install

# Install Playwright browsers with system dependencies
npx playwright install --with-deps
```

### Step 4: Run Tests

```bash
# Run all tests
npx playwright test

# Run with specific configuration
npx playwright test --config=playwright.config.ci.js

# Run specific project (if using multiple browsers)
npx playwright test --project=chromium
```

### Step 5: Upload Report to S3

```bash
BUCKET_NAME="playwright-reports-YOUR_USERNAME"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Upload report
aws s3 sync playwright-report/ s3://${BUCKET_NAME}/${TIMESTAMP}/

# Print URL
echo "📊 Report: https://${BUCKET_NAME}.s3.amazonaws.com/${TIMESTAMP}/index.html"
```

### Step 6: Keep Tests Updated

```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies if package.json changed
npm install

# Run tests
npx playwright test
```

**Create an update script:**
```bash
cat > update-and-test.sh << 'EOF'
#!/bin/bash

BUCKET_NAME="playwright-reports-YOUR_USERNAME"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔄 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🎭 Running tests..."
npx playwright test

echo "☁️ Uploading report to S3..."
aws s3 sync playwright-report/ s3://${BUCKET_NAME}/${TIMESTAMP}/

echo ""
echo "✅ Done!"
echo "📊 Report: https://${BUCKET_NAME}.s3.amazonaws.com/${TIMESTAMP}/index.html"
EOF

chmod +x update-and-test.sh

# Run anytime
./update-and-test.sh
```

---

## Scenario 4: Automated Execution via GitHub Actions

**Best for:** Continuous testing, scheduled runs, team collaboration

### Step 1: Prepare Repository Structure

Your repository should have:
```
your-project/
├── tests/
│   ├── login.spec.js
│   └── checkout.spec.js
├── playwright.config.js
├── package.json
└── .github/
    └── workflows/
        └── playwright.yml
```

### Step 2: Create GitHub Actions Workflow

**On your local machine, create `.github/workflows/playwright.yml`:**

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 9 * * 1-5'  # 9 AM UTC, Mon-Fri
  workflow_dispatch:  # Manual trigger

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npx playwright test
        continue-on-error: true
      
      - name: Configure AWS credentials
        if: always()
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Upload report to S3
        if: always()
        run: |
          TIMESTAMP=$(date +%Y%m%d-%H%M%S)
          BRANCH=${GITHUB_REF##*/}
          aws s3 sync playwright-report/ s3://${{ secrets.S3_BUCKET_NAME }}/${BRANCH}/${TIMESTAMP}/
          echo "📊 Report URL: https://${{ secrets.S3_BUCKET_NAME }}.s3.amazonaws.com/${BRANCH}/${TIMESTAMP}/index.html" >> $GITHUB_STEP_SUMMARY
      
      - name: Upload artifacts to GitHub
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ github.run_number }}
          path: playwright-report/
          retention-days: 30
```

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these secrets:

| Secret Name | Value | Where to get it |
|-------------|-------|----------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | AWS Console → IAM → Users → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | Shown when creating access key |
| `AWS_REGION` | `us-east-1` | Your AWS region |
| `S3_BUCKET_NAME` | `playwright-reports-yourname` | Your S3 bucket name |

### Step 4: Push and Test

```bash
# Add workflow file
git add .github/workflows/playwright.yml
git commit -m "Add GitHub Actions workflow for Playwright tests"
git push origin main
```

**Watch the workflow run:**
1. Go to your repository on GitHub
2. Click **"Actions"** tab
3. See your workflow running!

### Step 5: Manual Trigger

You can manually trigger tests:

1. Go to **Actions** tab
2. Click **"Playwright Tests"** workflow
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

### Advanced: Scheduled Tests with Notifications

**Add Slack notification:**

```yaml
      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "❌ Playwright tests failed!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Playwright Tests Failed*\n\n*Branch:* ${{ github.ref }}\n*Commit:* ${{ github.sha }}\n*Author:* ${{ github.actor }}"
                  }
                }
              ]
            }
```

**Add email notification:**

```yaml
      - name: Send email on failure
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 465
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          subject: "❌ Playwright Tests Failed - ${{ github.ref }}"
          body: |
            Playwright tests failed!
            
            Repository: ${{ github.repository }}
            Branch: ${{ github.ref }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
            
            View report: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          to: your-team@example.com
          from: GitHub Actions
```

### Advanced: Matrix Testing (Multiple Browsers)

**Run tests on multiple browsers:**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      # ... previous steps ...
      
      - name: Run Playwright tests
        run: npx playwright test --project=${{ matrix.browser }}
      
      - name: Upload report to S3
        if: always()
        run: |
          TIMESTAMP=$(date +%Y%m%d-%H%M%S)
          aws s3 sync playwright-report/ s3://${{ secrets.S3_BUCKET_NAME }}/${{ matrix.browser }}/${TIMESTAMP}/
```

---

## Comparison: Which Scenario to Choose?

| Scenario | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **1. Fresh Tests** | Learning, new projects | • Easy to follow<br>• Full control<br>• Understand every step | • Time-consuming<br>• Manual setup |
| **2. Upload Existing** | Existing local tests, quick testing | • Use existing work<br>• Quick to start<br>• Full control | • Manual upload needed<br>• Sync issues |
| **3. Clone Remote** | Tests in Git, team projects | • Version controlled<br>• Easy updates<br>• Reproducible | • Requires Git setup<br>• Access management |
| **4. GitHub Actions** | Production, CI/CD, teams | • Fully automated<br>• Scheduled runs<br>• No EC2 needed | • Complex setup<br>• GitHub dependency |

**Recommended approach:**
1. Start with **Scenario 1** (Fresh) to learn
2. Move to **Scenario 3** (Clone) for real projects
3. Add **Scenario 4** (GitHub Actions) for automation

---

## Complete Example: End-to-End Workflow

Here's a complete workflow combining all scenarios:

### Development Workflow

**1. Develop locally (on your laptop):**
```bash
# Create/modify tests
npm install
npx playwright test
```

**2. Push to GitHub:**
```bash
git add .
git commit -m "Add new test cases"
git push origin main
```

**3. GitHub Actions runs automatically:**
- Tests execute on every push
- Reports upload to S3
- Team gets notified of results

**4. Manual EC2 testing (when needed):**
```bash
# SSH to EC2
ssh -i ~/.ssh/playwright-key.pem ubuntu@YOUR_IP

# Pull latest
cd playwright-tests
git pull origin main
npm install
npx playwright test
```

**5. View results:**
- GitHub Actions artifacts
- S3 reports
- Local terminal output

---

## Troubleshooting Common Issues

### Issue 1: Tests Pass Locally but Fail on EC2

**Causes:**
- Different screen sizes
- Missing fonts
- Timezone differences
- Missing dependencies

**Solutions:**
```javascript
// playwright.config.js - Make tests more resilient
module.exports = defineConfig({
  use: {
    viewport: { width: 1280, height: 720 },  // Fixed viewport
    locale: 'en-US',  // Fixed locale
    timezoneId: 'America/New_York',  // Fixed timezone
  },
});
```

### Issue 2: Upload to S3 Fails

**Check IAM permissions:**
```bash
# Verify EC2 has correct role
aws sts get-caller-identity

# Check S3 access
aws s3 ls s3://your-bucket-name/
```

### Issue 3: Git Clone Fails (Private Repo)

**Use SSH instead of HTTPS:**
```bash
# Generate SSH key on EC2
ssh-keygen -t ed25519 -C "ec2-instance"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
```

### Issue 4: Tests Run Forever

**Add timeouts:**
```javascript
test.setTimeout(30000);  // 30 seconds per test

// Or in config
module.exports = defineConfig({
  timeout: 30000,
  expect: { timeout: 5000 },
});
```

---

## Next Steps

After successfully running tests, check out:
- **[Storing Reports in S3](#storing-reports-in-s3)** - Detailed S3 setup
- **[CI/CD Integration](#cicd-integration)** - Advanced automation
- **[Cost Management](#cost-management)** - Optimize spending
- **[Troubleshooting](#troubleshooting)** - Common issues

---

## Storing Reports in S3

### Step 1: Create S3 Bucket

**Important:** Run these commands on your **local machine** (not on EC2).

**Choose a unique bucket name:**
- Must be globally unique across ALL AWS accounts
- Use lowercase letters, numbers, hyphens only
- Example: `playwright-reports-john-2025`

---

**Mac/Linux:**
```bash
# Replace YOUR_USERNAME with your name/company
BUCKET_NAME="playwright-reports-YOUR_USERNAME"

# Create bucket
aws s3 mb s3://${BUCKET_NAME}

# Verify bucket was created
aws s3 ls | grep playwright
```

**Windows (PowerShell):**
```powershell
# Replace YOUR_USERNAME with your name/company
$BUCKET_NAME = "playwright-reports-YOUR_USERNAME"

# Create bucket
aws s3 mb s3://$BUCKET_NAME

# Verify bucket was created
aws s3 ls | Select-String "playwright"
```

**Expected output:**
```
make_bucket: playwright-reports-YOUR_USERNAME
```

---

**Enable public read access (optional - for sharing reports):**

⚠️ **Note:** This makes reports publicly accessible. Skip if handling sensitive data.

**Mac/Linux:**
```bash
BUCKET_NAME="playwright-reports-YOUR_USERNAME"

# Create policy file
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
  }]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy \
  --bucket ${BUCKET_NAME} \
  --policy file://bucket-policy.json

# Verify policy
aws s3api get-bucket-policy --bucket ${BUCKET_NAME}
```

**Windows (PowerShell):**
```powershell
$BUCKET_NAME = "playwright-reports-YOUR_USERNAME"

# Create policy JSON
$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
  }]
}
"@

# Save to file
$policy | Out-File -Encoding ascii -FilePath bucket-policy.json

# Apply bucket policy
aws s3api put-bucket-policy `
  --bucket $BUCKET_NAME `
  --policy file://bucket-policy.json

# Verify policy
aws s3api get-bucket-policy --bucket $BUCKET_NAME
```

**Keep your bucket name handy** - you'll need it later!

### Step 2: Configure IAM Role for EC2

Your EC2 instance needs permission to upload files to S3.

**Run on your local machine:**

---

**Mac/Linux:**
```bash
# Create IAM role trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name PlaywrightS3Role \
  --assume-role-policy-document file://trust-policy.json

# Attach S3 access policy
aws iam attach-role-policy \
  --role-name PlaywrightS3Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name PlaywrightS3Profile

# Add role to profile
aws iam add-role-to-instance-profile \
  --instance-profile-name PlaywrightS3Profile \
  --role-name PlaywrightS3Role

# Get your instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=playwright-runner" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# Attach profile to EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id $INSTANCE_ID \
  --iam-instance-profile Name=PlaywrightS3Profile

echo "✅ IAM role attached successfully!"
```

**Windows (PowerShell):**
```powershell
# Create IAM role trust policy
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
"@

$trustPolicy | Out-File -Encoding ascii -FilePath trust-policy.json

# Create IAM role
aws iam create-role `
  --role-name PlaywrightS3Role `
  --assume-role-policy-document file://trust-policy.json

# Attach S3 access policy
aws iam attach-role-policy `
  --role-name PlaywrightS3Role `
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create instance profile
aws iam create-instance-profile `
  --instance-profile-name PlaywrightS3Profile

# Add role to profile
aws iam add-role-to-instance-profile `
  --instance-profile-name PlaywrightS3Profile `
  --role-name PlaywrightS3Role

# Get your instance ID
$INSTANCE_ID = (aws ec2 describe-instances `
  --filters "Name=tag:Name,Values=playwright-runner" "Name=instance-state-name,Values=running" `
  --query "Reservations[0].Instances[0].InstanceId" `
  --output text)

Write-Host "Instance ID: $INSTANCE_ID"

# Attach profile to EC2 instance
aws ec2 associate-iam-instance-profile `
  --instance-id $INSTANCE_ID `
  --iam-instance-profile Name=PlaywrightS3Profile

Write-Host "✅ IAM role attached successfully!"
```

**Expected output:**
```json
{
    "IamInstanceProfileAssociation": {
        "AssociationId": "iip-assoc-...",
        "InstanceId": "i-...",
        "IamInstanceProfile": {...}
    }
}
```

**What just happened?**
- Created an IAM role that allows EC2 to access S3
- Attached this role to your EC2 instance
- Now your EC2 can upload reports without needing AWS credentials!

### Step 3: Upload Reports from EC2

**Back on your EC2 instance:**

```bash
# Run tests
npx playwright test

# Upload HTML report to S3
aws s3 sync playwright-report/ s3://playwright-reports-YOUR_USERNAME/$(date +%Y%m%d-%H%M%S)/

# Get report URL
echo "Report URL: https://playwright-reports-YOUR_USERNAME.s3.amazonaws.com/$(date +%Y%m%d-%H%M%S)/index.html"
```

### Step 4: Create Upload Script

```bash
cat > upload-report.sh << 'EOF'
#!/bin/bash

BUCKET="playwright-reports-YOUR_USERNAME"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Run tests
npx playwright test

# Upload report
aws s3 sync playwright-report/ s3://${BUCKET}/${TIMESTAMP}/ \
  --delete \
  --exclude ".git/*"

# Print URL
echo ""
echo "✅ Report uploaded successfully!"
echo "📊 View report: https://${BUCKET}.s3.amazonaws.com/${TIMESTAMP}/index.html"
EOF

chmod +x upload-report.sh
```

**Run script:**
```bash
./upload-report.sh
```

---

## CI/CD Integration

Let's automate everything with GitHub Actions!

### Step 1: Prepare GitHub Repository

**On your local machine:**

---

**Mac/Linux:**
```bash
# Create new repository directory
mkdir playwright-aws-demo
cd playwright-aws-demo
git init

# Copy test files from EC2 to your local machine
scp -i ~/.ssh/playwright-key.pem -r ubuntu@YOUR_INSTANCE_IP:~/playwright-tests/* .

# Alternative: manually create test structure
mkdir tests
# Copy your test files here

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
playwright-report/
test-results/
playwright/.cache/
.env
*.pem
EOF

# Create package.json (if you don't have one)
cat > package.json << 'EOF'
{
  "name": "playwright-aws-demo",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.58.0"
  }
}
EOF

# Initial commit
git add .
git commit -m "Initial commit: Playwright AWS setup"

# Create repository on GitHub (do this in browser first)
# Then push to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/playwright-aws-demo.git
git push -u origin main
```

**Windows (PowerShell):**
```powershell
# Create new repository directory
New-Item -ItemType Directory -Path playwright-aws-demo
Set-Location playwright-aws-demo
git init

# Copy test files from EC2 to your local machine
scp -i $env:USERPROFILE\.ssh\playwright-key.pem -r ubuntu@YOUR_INSTANCE_IP:~/playwright-tests/* .

# Alternative: manually create test structure
New-Item -ItemType Directory -Path tests
# Copy your test files here

# Create .gitignore
@"
node_modules/
playwright-report/
test-results/
playwright/.cache/
.env
*.pem
"@ | Out-File -Encoding ascii .gitignore

# Create package.json (if you don't have one)
@"
{
  "name": "playwright-aws-demo",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.58.0"
  }
}
"@ | Out-File -Encoding ascii package.json

# Initial commit
git add .
git commit -m "Initial commit: Playwright AWS setup"

# Create repository on GitHub (do this in browser first)
# Then push to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/playwright-aws-demo.git
git push -u origin main
```

**Create GitHub Repository (in browser):**
1. Go to github.com
2. Click "+" → "New repository"
3. Name: `playwright-aws-demo`
4. Keep it Public or Private
5. Don't initialize with README
6. Click "Create repository"
7. Run the git commands above

### Step 2: Store AWS Credentials in GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (e.g., `us-east-1`)
   - `S3_BUCKET_NAME` (e.g., `playwright-reports-YOUR_USERNAME`)

### Step 3: Create GitHub Actions Workflow

```bash
mkdir -p .github/workflows

cat > .github/workflows/playwright-tests.yml << 'EOF'
name: Playwright Tests on AWS

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 9 * * 1-5'  # Run Mon-Fri at 9 AM UTC

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npx playwright test
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Upload report to S3
        if: always()
        run: |
          TIMESTAMP=$(date +%Y%m%d-%H%M%S)
          aws s3 sync playwright-report/ s3://${{ secrets.S3_BUCKET_NAME }}/${TIMESTAMP}/ --delete
          echo "📊 Report URL: https://${{ secrets.S3_BUCKET_NAME }}.s3.amazonaws.com/${TIMESTAMP}/index.html"
      
      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
EOF
```

### Step 4: Push and Test

```bash
git add .github/workflows/playwright-tests.yml
git commit -m "Add GitHub Actions workflow"
git push
```

Go to GitHub → Actions tab to see your workflow run!

---

## Advanced: EC2 On-Demand Testing

For better cost control, launch EC2 only when needed.

### Create Launch Script

```bash
cat > .github/workflows/ec2-playwright.yml << 'EOF'
name: Playwright Tests on EC2

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: '0 9 * * 1-5'

jobs:
  launch-ec2:
    runs-on: ubuntu-latest
    outputs:
      instance-id: ${{ steps.launch.outputs.instance-id }}
      instance-ip: ${{ steps.launch.outputs.instance-ip }}
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Launch EC2 instance
        id: launch
        run: |
          INSTANCE_ID=$(aws ec2 run-instances \
            --image-id resolve:ssm:/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id \
            --instance-type t2.micro \
            --key-name playwright-key \
            --security-group-ids sg-xxxxx \
            --iam-instance-profile Name=PlaywrightS3Profile \
            --user-data file://user-data.sh \
            --query 'Instances[0].InstanceId' \
            --output text)
          
          echo "instance-id=$INSTANCE_ID" >> $GITHUB_OUTPUT
          
          # Wait for instance to start
          aws ec2 wait instance-running --instance-ids $INSTANCE_ID
          
          # Get IP
          INSTANCE_IP=$(aws ec2 describe-instances \
            --instance-ids $INSTANCE_ID \
            --query 'Reservations[0].Instances[0].PublicIpAddress' \
            --output text)
          
          echo "instance-ip=$INSTANCE_IP" >> $GITHUB_OUTPUT
  
  run-tests:
    needs: launch-ec2
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Wait for EC2 to be ready
        run: sleep 60
      
      - name: Copy tests to EC2
        run: |
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > key.pem
          chmod 400 key.pem
          scp -i key.pem -o StrictHostKeyChecking=no -r * ubuntu@${{ needs.launch-ec2.outputs.instance-ip }}:~/
      
      - name: Run tests on EC2
        run: |
          ssh -i key.pem -o StrictHostKeyChecking=no ubuntu@${{ needs.launch-ec2.outputs.instance-ip }} << 'ENDSSH'
            cd ~
            npm ci
            npx playwright install --with-deps
            npx playwright test
            ./upload-report.sh
          ENDSSH
  
  cleanup:
    needs: [launch-ec2, run-tests]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Terminate EC2 instance
        run: |
          aws ec2 terminate-instances --instance-ids ${{ needs.launch-ec2.outputs.instance-id }}
          echo "✅ EC2 instance terminated"
EOF
```

---

## Cost Management

### Monitor Your Usage

**Check EC2 instances:**

**Mac/Linux:**
```bash
# List all running instances
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,LaunchTime]' \
  --output table

# Count total running hours this month
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].[InstanceId,LaunchTime]' \
  --output table
```

**Windows (PowerShell):**
```powershell
# List all running instances
aws ec2 describe-instances `
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,LaunchTime]' `
  --output table

# Count total running hours this month
aws ec2 describe-instances `
  --filters "Name=instance-state-name,Values=running" `
  --query 'Reservations[*].Instances[*].[InstanceId,LaunchTime]' `
  --output table
```

---

**Check S3 storage:**

**Mac/Linux:**
```bash
# List all buckets
aws s3 ls

# Check size of specific bucket
aws s3 ls s3://playwright-reports-YOUR_USERNAME --recursive --summarize --human-readable

# Get total storage across all buckets
aws s3 ls --recursive --summarize --human-readable
```

**Windows (PowerShell):**
```powershell
# List all buckets
aws s3 ls

# Check size of specific bucket
aws s3 ls s3://playwright-reports-YOUR_USERNAME --recursive --summarize --human-readable

# Get total storage across all buckets
aws s3 ls --recursive --summarize --human-readable
```

---

**Check volumes (storage attached to EC2):**

**Mac/Linux:**
```bash
aws ec2 describe-volumes \
  --query 'Volumes[*].[VolumeId,State,Size,Attachments[0].InstanceId]' \
  --output table
```

**Windows (PowerShell):**
```powershell
aws ec2 describe-volumes `
  --query 'Volumes[*].[VolumeId,State,Size,Attachments[0].InstanceId]' `
  --output table
```

**Look for "available" volumes** - these are detached and still costing money!

### Set Up Billing Alerts

1. AWS Console → Billing → Budgets
2. Create budget:
   - Type: Cost budget
   - Amount: $5
   - Alert threshold: 80%

### Stop EC2 When Not Using

**Mac/Linux:**
```bash
# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=playwright-runner" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

# Stop instance (keeps storage, can restart)
aws ec2 stop-instances --instance-ids $INSTANCE_ID

# Start instance again when needed
aws ec2 start-instances --instance-ids $INSTANCE_ID

# Terminate instance (deletes everything - use carefully!)
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
```

**Windows (PowerShell):**
```powershell
# Get instance ID
$INSTANCE_ID = (aws ec2 describe-instances `
  --filters "Name=tag:Name,Values=playwright-runner" `
  --query "Reservations[0].Instances[0].InstanceId" `
  --output text)

# Stop instance (keeps storage, can restart)
aws ec2 stop-instances --instance-ids $INSTANCE_ID

# Start instance again when needed
aws ec2 start-instances --instance-ids $INSTANCE_ID

# Terminate instance (deletes everything - use carefully!)
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
```

**Cost comparison:**
- **Stopped instance:** ~$1-2/month (just storage)
- **Running instance:** ~$8-10/month (compute + storage)
- **Terminated:** $0 (everything deleted)

### Auto-Stop Script

Run this on your EC2 instance to auto-stop after tests:

```bash
cat > auto-stop.sh << 'EOF'
#!/bin/bash

# Run tests
npx playwright test

# Upload report
./upload-report.sh

# Stop instance
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
aws ec2 stop-instances --instance-ids $INSTANCE_ID
EOF

chmod +x auto-stop.sh
```

---

## Troubleshooting

### Common Issues

#### 1. Can't Connect to EC2

**Problem:** SSH connection refused

**Solutions:**

**Mac/Linux:**
```bash
# Check instance is running (not pending or stopped)
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=playwright-runner" \
  --query "Reservations[0].Instances[0].[State.Name,PublicIpAddress]" \
  --output table

# Verify security group allows your IP
aws ec2 describe-security-groups \
  --group-names playwright-sg \
  --query 'SecurityGroups[0].IpPermissions'

# Check your current IP (might have changed)
curl ifconfig.me

# Fix key permissions
chmod 400 ~/.ssh/playwright-key.pem
```

**Windows (PowerShell):**
```powershell
# Check instance is running (not pending or stopped)
aws ec2 describe-instances `
  --filters "Name=tag:Name,Values=playwright-runner" `
  --query "Reservations[0].Instances[0].[State.Name,PublicIpAddress]" `
  --output table

# Verify security group allows your IP
aws ec2 describe-security-groups `
  --group-names playwright-sg `
  --query 'SecurityGroups[0].IpPermissions'

# Check your current IP (might have changed)
(Invoke-WebRequest -Uri "https://ifconfig.me").Content

# Fix key permissions using icacls
icacls $env:USERPROFILE\.ssh\playwright-key.pem /inheritance:r
icacls $env:USERPROFILE\.ssh\playwright-key.pem /grant:r "$($env:USERNAME):(R)"
```

**Common causes:**
- Instance state is "pending" → Wait 2-3 minutes
- Your IP changed (WiFi networks) → Update security group
- Wrong key file → Verify you're using the right `.pem` file

#### 2. Tests Fail on EC2

**Problem:** Playwright tests work locally but fail on EC2

**Solutions:**
```bash
# Ensure headless mode is enabled
# In playwright.config.js:
use: {
  headless: true,
}

# Install missing dependencies
sudo npx playwright install-deps

# Check memory (t2.micro has limited RAM)
free -h
```

#### 3. S3 Upload Fails

**Problem:** Permission denied when uploading to S3

**Solutions:**
```bash
# Verify IAM role is attached
aws sts get-caller-identity

# Check bucket exists
aws s3 ls

# Verify bucket policy
aws s3api get-bucket-policy --bucket YOUR_BUCKET_NAME
```

#### 4. Running Out of Free Tier

**Problem:** Getting charged unexpectedly

**Check what's running:**

**Mac/Linux:**
```bash
# List ALL running instances
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,LaunchTime]' \
  --output table

# Check storage volumes (including detached ones)
aws ec2 describe-volumes \
  --query 'Volumes[*].[VolumeId,State,Size,Attachments[0].InstanceId]' \
  --output table

# Check S3 storage usage
aws s3 ls --recursive --summarize --human-readable

# List snapshots (these cost money!)
aws ec2 describe-snapshots \
  --owner-ids self \
  --query 'Snapshots[*].[SnapshotId,StartTime,VolumeSize]' \
  --output table
```

**Windows (PowerShell):**
```powershell
# List ALL running instances
aws ec2 describe-instances `
  --filters "Name=instance-state-name,Values=running" `
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,LaunchTime]' `
  --output table

# Check storage volumes (including detached ones)
aws ec2 describe-volumes `
  --query 'Volumes[*].[VolumeId,State,Size,Attachments[0].InstanceId]' `
  --output table

# Check S3 storage usage
aws s3 ls --recursive --summarize --human-readable

# List snapshots (these cost money!)
aws ec2 describe-snapshots `
  --owner-ids self `
  --query 'Snapshots[*].[SnapshotId,StartTime,VolumeSize]' `
  --output table
```

**Common cost culprits:**
- ❌ Instances left running 24/7
- ❌ Using t3.medium instead of t2.micro (wrong instance type)
- ❌ Detached volumes still attached to account
- ❌ Snapshots accumulating
- ❌ Elastic IPs not attached to running instances

**Solutions:**

**Mac/Linux:**
```bash
# Stop all running instances
for id in $(aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].InstanceId' \
  --output text); do
  aws ec2 stop-instances --instance-ids $id
done

# Delete unattached volumes
for vol in $(aws ec2 describe-volumes \
  --filters "Name=status,Values=available" \
  --query 'Volumes[*].VolumeId' \
  --output text); do
  aws ec2 delete-volume --volume-id $vol
done

# Delete old snapshots (be careful!)
# List first, then delete manually if needed
aws ec2 describe-snapshots --owner-ids self
```

**Windows (PowerShell):**
```powershell
# Stop all running instances
$instances = (aws ec2 describe-instances `
  --filters "Name=instance-state-name,Values=running" `
  --query 'Reservations[*].Instances[*].InstanceId' `
  --output text) -split '\s+'

foreach ($id in $instances) {
  aws ec2 stop-instances --instance-ids $id
}

# Delete unattached volumes
$volumes = (aws ec2 describe-volumes `
  --filters "Name=status,Values=available" `
  --query 'Volumes[*].VolumeId' `
  --output text) -split '\s+'

foreach ($vol in $volumes) {
  aws ec2 delete-volume --volume-id $vol
}

# Delete old snapshots (be careful!)
# List first, then delete manually if needed
aws ec2 describe-snapshots --owner-ids self
```

---

## Next Steps

### Immediate Improvements

1. **Parallel Testing**
   ```bash
   # In playwright.config.js
   workers: 4,  // Run 4 tests in parallel
   ```

2. **Multiple Browsers**
   ```javascript
   projects: [
     { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
     { name: 'webkit', use: { ...devices['Desktop Safari'] } },
   ],
   ```

3. **Slack Notifications**
   ```yaml
   - name: Notify Slack
     if: failure()
     uses: slackapi/slack-github-action@v1
     with:
       webhook: ${{ secrets.SLACK_WEBHOOK }}
       payload: |
         {
           "text": "❌ Playwright tests failed!"
         }
   ```

### Scale Up (Paid Tier)

When you outgrow Free Tier:

1. **Larger instances**: t3.medium ($0.04/hour) for faster tests
2. **Auto Scaling Groups**: Scale test runners automatically
3. **Selenium Grid**: Distribute tests across multiple browsers
4. **AWS Lambda**: Run lightweight smoke tests
5. **CodePipeline**: Full CI/CD pipeline

### Learning Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Playwright Documentation](https://playwright.dev/)
- [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/)
- [GitHub Actions Documentation](https://docs.github.com/actions)

---

## Complete Example Repository

See a working example at:
**github.com/YOUR_USERNAME/playwright-aws-demo**

Contains:
- ✅ Playwright tests
- ✅ GitHub Actions workflow
- ✅ S3 upload scripts
- ✅ Cost monitoring
- ✅ Full documentation

---

## Summary Checklist

After completing this guide, you should have:

- [ ] AWS account set up with Free Tier
- [ ] EC2 instance running Playwright tests
- [ ] S3 bucket storing test reports
- [ ] GitHub Actions triggering tests automatically
- [ ] Billing alerts configured
- [ ] Basic monitoring in place

**Total setup time:** 2-3 hours  
**Monthly cost:** $0 (within Free Tier limits)

---

## Need Help?

**Common questions:**

**Q: How many tests can I run per month for free?**  
A: With 750 EC2 hours, you can run one t2.micro instance 24/7 or run tests on-demand within that limit.

**Q: What happens after 12 months?**  
A: You start paying standard rates. A t2.micro costs ~$8/month if running 24/7.

**Q: Can I run Playwright on Lambda?**  
A: Yes, but requires additional setup. Lambda is better for API tests or lightweight smoke tests.

**Q: How do I share reports with my team?**  
A: Upload to S3 with public read access, or use GitHub Actions artifacts.

---

## Final Tips

1. **Always terminate instances when done**
2. **Set up billing alerts immediately**
3. **Start small, scale gradually**
4. **Monitor your Free Tier usage weekly**
5. **Keep security groups restrictive**

---

**Ready to start?** Jump to [Setup Guide](#setup-guide) and launch your first test runner!

**Questions?** Open an issue on GitHub or reach out to the community.

---

## Quick Reference: Commands by Platform

### Common AWS Commands

| Task | Mac/Linux | Windows PowerShell |
|------|-----------|-------------------|
| **Find your IP** | `curl ifconfig.me` | `(Invoke-WebRequest -Uri "https://ifconfig.me").Content` |
| **Create SSH key** | `aws ec2 create-key-pair --key-name playwright-key --query 'KeyMaterial' --output text > ~/.ssh/playwright-key.pem` | `aws ec2 create-key-pair --key-name playwright-key --query 'KeyMaterial' --output text \| Out-File -Encoding ascii -FilePath $env:USERPROFILE\.ssh\playwright-key.pem` |
| **Set key permissions** | `chmod 400 ~/.ssh/playwright-key.pem` | `icacls $env:USERPROFILE\.ssh\playwright-key.pem /inheritance:r; icacls $env:USERPROFILE\.ssh\playwright-key.pem /grant:r "$($env:USERNAME):(R)"` |
| **Connect to EC2** | `ssh -i ~/.ssh/playwright-key.pem ubuntu@IP` | `ssh -i $env:USERPROFILE\.ssh\playwright-key.pem ubuntu@IP` |
| **Copy files from EC2** | `scp -i ~/.ssh/playwright-key.pem -r ubuntu@IP:~/path .` | `scp -i $env:USERPROFILE\.ssh\playwright-key.pem -r ubuntu@IP:~/path .` |

### S3 Commands

| Task | Command (Both Platforms) |
|------|-------------------------|
| **Create bucket** | `aws s3 mb s3://bucket-name` |
| **List buckets** | `aws s3 ls` |
| **Upload file** | `aws s3 cp file.txt s3://bucket-name/` |
| **Upload folder** | `aws s3 sync ./folder s3://bucket-name/folder` |
| **Check bucket size** | `aws s3 ls s3://bucket-name --recursive --summarize --human-readable` |
| **Delete bucket** | `aws s3 rb s3://bucket-name --force` |

### EC2 Instance Management

| Task | Mac/Linux | Windows PowerShell |
|------|-----------|-------------------|
| **Launch instance** | `aws ec2 run-instances --image-id ami-xxx --instance-type t2.micro --key-name playwright-key --security-groups playwright-sg` | Same command with backticks (`) instead of backslashes (\) |
| **List instances** | `aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' --output table` | Same command |
| **Get instance IP** | `aws ec2 describe-instances --filters "Name=tag:Name,Values=playwright-runner" --query "Reservations[0].Instances[0].PublicIpAddress" --output text` | Same command |
| **Stop instance** | `aws ec2 stop-instances --instance-ids i-xxx` | Same command |
| **Start instance** | `aws ec2 start-instances --instance-ids i-xxx` | Same command |
| **Terminate instance** | `aws ec2 terminate-instances --instance-ids i-xxx` | Same command |

### Cost Monitoring

| Task | Command (Both Platforms) |
|------|-------------------------|
| **List running instances** | `aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"` |
| **List volumes** | `aws ec2 describe-volumes --query 'Volumes[*].[VolumeId,State,Size]' --output table` |
| **List snapshots** | `aws ec2 describe-snapshots --owner-ids self` |
| **Check S3 usage** | `aws s3 ls --recursive --summarize --human-readable` |

### File Operations

**Mac/Linux:**
```bash
# Create multi-line file
cat > filename.txt << 'EOF'
content here
EOF

# View file
cat filename.txt

# Edit file
nano filename.txt  # or vim filename.txt
```

**Windows PowerShell:**
```powershell
# Create multi-line file
@"
content here
"@ | Out-File -Encoding ascii filename.txt

# View file
Get-Content filename.txt

# Edit file
notepad filename.txt
```

### Troubleshooting Commands

**Check AWS CLI configuration:**
```bash
# Both platforms
aws configure list
aws sts get-caller-identity
```

**Check instance status:**
```bash
# Both platforms
aws ec2 describe-instance-status --instance-ids i-xxx
```

**Check security groups:**
```bash
# Both platforms
aws ec2 describe-security-groups --group-names playwright-sg
```

---

## Platform-Specific Installation Guides

### Mac Setup

**Prerequisites:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Git
brew install git

# Install AWS CLI
brew install awscli
```

### Windows Setup

**Prerequisites:**

1. **Node.js:**
   - Download from: https://nodejs.org/
   - Install LTS version
   - Verify: `node --version`

2. **Git:**
   - Download from: https://git-scm.com/download/win
   - During install, select "Git Bash" option
   - Verify: `git --version`

3. **AWS CLI:**
   - Download from: https://awscli.amazonaws.com/AWSCLIV2.msi
   - Run installer as Administrator
   - Verify: `aws --version`

4. **SSH Client:**
   - Windows 10/11: OpenSSH is built-in
   - Verify: `ssh -V`
   - Alternative: Install Git Bash or PuTTY

**PowerShell vs Git Bash:**
- **PowerShell:** Native Windows shell, uses different syntax
- **Git Bash:** Unix-like shell on Windows, uses Linux/Mac syntax
- **Recommendation:** Use Git Bash for AWS CLI commands (easier to follow most tutorials)

### Linux Setup

**Prerequisites (Ubuntu/Debian):**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installations
node --version
git --version
aws --version
```

---

## Environment Variables

### Set Variables (for easier commands)

**Mac/Linux:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export AWS_REGION="us-east-1"
export EC2_KEY_PATH="$HOME/.ssh/playwright-key.pem"
export S3_BUCKET="playwright-reports-YOUR_USERNAME"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

**Windows PowerShell:**
```powershell
# Add to PowerShell profile
# Open profile: notepad $PROFILE

$env:AWS_REGION = "us-east-1"
$env:EC2_KEY_PATH = "$env:USERPROFILE\.ssh\playwright-key.pem"
$env:S3_BUCKET = "playwright-reports-YOUR_USERNAME"

# Reload profile
. $PROFILE
```

**Use variables:**
```bash
# Mac/Linux
ssh -i $EC2_KEY_PATH ubuntu@IP
aws s3 ls s3://$S3_BUCKET

# Windows PowerShell
ssh -i $env:EC2_KEY_PATH ubuntu@IP
aws s3 ls s3://$env:S3_BUCKET
```

---

## One-Line Commands for Common Tasks

### Launch Complete Setup

**Mac/Linux:**
```bash
# One command to create everything (using latest Ubuntu 24.04 AMI)
aws ec2 run-instances --image-id resolve:ssm:/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id --instance-type t2.micro --key-name playwright-key --security-groups playwright-sg --iam-instance-profile Name=PlaywrightS3Profile --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=playwright-runner}]' && sleep 60 && aws ec2 describe-instances --filters "Name=tag:Name,Values=playwright-runner" --query "Reservations[0].Instances[0].PublicIpAddress" --output text
```

### Clean Everything

**Mac/Linux:**
```bash
# WARNING: This deletes everything!
aws ec2 terminate-instances --instance-ids $(aws ec2 describe-instances --filters "Name=tag:Name,Values=playwright-runner" --query "Reservations[0].Instances[0].InstanceId" --output text) && aws s3 rb s3://playwright-reports-YOUR_USERNAME --force && aws ec2 delete-security-group --group-name playwright-sg && aws ec2 delete-key-pair --key-name playwright-key
```

**Windows PowerShell:**
```powershell
# WARNING: This deletes everything!
$INSTANCE_ID = (aws ec2 describe-instances --filters "Name=tag:Name,Values=playwright-runner" --query "Reservations[0].Instances[0].InstanceId" --output text)
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
aws s3 rb s3://playwright-reports-YOUR_USERNAME --force
aws ec2 delete-security-group --group-name playwright-sg
aws ec2 delete-key-pair --key-name playwright-key
```

---

*Last updated: February 2026*  
*Tested on: AWS Free Tier, Ubuntu 24.04 LTS, Playwright 1.58+, Node.js 20 LTS*
