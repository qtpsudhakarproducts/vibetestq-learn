# Node.js Project Structure & Configuration

## 📚 Overview

Understanding Node.js project structure and configuration is essential for building scalable applications. This guide covers project organization, package.json, dependencies, and best practices.

---

## 📁 Standard Node.js Project Structure

```
my-nodejs-project/
├── node_modules/          # Installed dependencies (auto-generated)
├── src/                   # Source code
│   ├── index.js          # Entry point
│   ├── controllers/      # Request handlers
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── config/           # Configuration files
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── public/               # Static files (HTML, CSS, images)
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── package.json         # Project metadata & dependencies
├── package-lock.json    # Locked dependency versions
├── README.md            # Project documentation
└── tsconfig.json        # TypeScript config (if using TS)
```

---

## 📦 package.json - The Heart of Your Project

`package.json` is the most important file in a Node.js project. It contains metadata and configuration.

### Creating package.json

```bash
# Interactive creation (asks questions)
npm init

# Quick creation with defaults
npm init -y
```

### Complete package.json Example

```json
{
  "name": "my-awesome-app",
  "version": "1.0.0",
  "description": "A comprehensive Node.js application",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "build": "tsc",
    "lint": "eslint src/**/*.js"
  },
  "keywords": ["nodejs", "express", "api"],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.5.0",
    "eslint": "^8.38.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo.git"
  }
}
```

---

## 🔑 package.json Key Fields Explained

### 1. name
```json
"name": "my-app"
```
- Must be lowercase
- No spaces (use hyphens or underscores)
- URL-friendly
- Unique if publishing to npm

### 2. version
```json
"version": "1.0.0"
```
- Follows Semantic Versioning (SemVer)
- Format: MAJOR.MINOR.PATCH
  - **MAJOR**: Breaking changes
  - **MINOR**: New features (backward compatible)
  - **PATCH**: Bug fixes

### 3. description
```json
"description": "A brief description of the project"
```
- Helps others understand your project
- Shows up in npm search

### 4. main
```json
"main": "index.js"
```
- Entry point of your application
- File that runs when package is imported

### 5. type
```json
"type": "module"
```
- **"module"**: Use ES6 modules (import/export)
- **"commonjs"** (default): Use CommonJS (require/module.exports)

### 6. scripts
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "test": "jest",
  "build": "tsc"
}
```
- Custom commands
- Run with: `npm run <script-name>`
- `start` and `test` can run without "run": `npm start`, `npm test`

### 7. dependencies
```json
"dependencies": {
  "express": "^4.18.2",
  "mongoose": "^7.0.0"
}
```
- Packages required in **production**
- Installed with: `npm install express`

### 8. devDependencies
```json
"devDependencies": {
  "nodemon": "^2.0.20",
  "jest": "^29.5.0"
}
```
- Packages needed only for **development/testing**
- Installed with: `npm install --save-dev nodemon`

### 9. author
```json
"author": "John Doe <john@example.com>"
```
- Your name and contact

### 10. license
```json
"license": "MIT"
```
- How others can use your code
- Common: MIT, ISC, Apache-2.0, GPL

---

## 🔄 Dependencies vs DevDependencies

### Dependencies (Production)
**What they are**: Packages your app needs to run

**Examples**:
- express (web framework)
- mongoose (database ORM)
- dotenv (environment variables)
- lodash (utility library)

**Install command**:
```bash
npm install <package-name>
# or
npm install <package-name> --save
```

### DevDependencies (Development)
**What they are**: Packages needed only during development

**Examples**:
- nodemon (auto-restart server)
- jest (testing framework)
- eslint (code linting)
- typescript (TypeScript compiler)

**Install command**:
```bash
npm install <package-name> --save-dev
# or
npm install <package-name> -D
```

### Quick Reference

| Aspect | Dependencies | DevDependencies |
|--------|--------------|-----------------|
| **Purpose** | Production runtime | Development/testing |
| **Examples** | express, mongoose | jest, nodemon |
| **Install flag** | (none) or --save | --save-dev or -D |
| **Deployed** | ✅ Yes | ❌ No |

---

## 📜 Scripts in package.json

Scripts automate common tasks.

### Common Scripts

```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "test": "jest --coverage",
  "test:watch": "jest --watch",
  "lint": "eslint src/**/*.js",
  "lint:fix": "eslint src/**/*.js --fix",
  "build": "tsc",
  "build:watch": "tsc --watch",
  "clean": "rm -rf dist",
  "deploy": "npm run build && npm run start"
}
```

### Running Scripts

```bash
# Special scripts (no "run" needed)
npm start
npm test

# Other scripts (need "run")
npm run dev
npm run build
npm run lint
```

### Script Composition

```json
"scripts": {
  "prebuild": "npm run clean",
  "build": "tsc",
  "postbuild": "npm run copy-assets",
  "copy-assets": "cp -r src/assets dist/"
}
```
- `pre<script>` runs before the script
- `post<script>` runs after the script

---

## 🌍 Environment Variables (.env)

Store sensitive configuration outside code.

### .env File
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=secret123

# API Keys
API_KEY=your_api_key_here
SECRET_TOKEN=your_secret_token

# Environment
NODE_ENV=development
PORT=3000
```

### Using dotenv

**Install**:
```bash
npm install dotenv
```

**Load in your app**:
```javascript
// At the top of your main file
require('dotenv').config();

// Access variables
const port = process.env.PORT || 3000;
const dbHost = process.env.DB_HOST;

console.log(`Server running on port ${port}`);
```

### .env.example
Create a template without sensitive data:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=
DB_PASSWORD=

# API Keys
API_KEY=
SECRET_TOKEN=
```

**Add .env to .gitignore!**

---

## 🚫 .gitignore File

Prevent committing unnecessary files.

### Standard .gitignore for Node.js

```gitignore
# Dependencies
node_modules/
package-lock.json  # (optional, depends on team)

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log
npm-debug.log*

# Build output
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/
.nyc_output/

# Temporary files
*.tmp
.cache/
```

---

## 📊 Semantic Versioning (SemVer)

### Version Format: MAJOR.MINOR.PATCH

```
1.2.3
│ │ │
│ │ └─ PATCH: Bug fixes (backward compatible)
│ └─── MINOR: New features (backward compatible)
└───── MAJOR: Breaking changes
```

### Version Ranges in package.json

```json
"dependencies": {
  "express": "4.18.2",      // Exact version
  "mongoose": "^7.0.0",     // Compatible with 7.x.x
  "lodash": "~4.17.21",     // Compatible with 4.17.x
  "axios": "*"              // Any version (not recommended)
}
```

**Symbols**:
- `^` (caret): Compatible updates (MINOR and PATCH)
- `~` (tilde): Compatible patches (PATCH only)
- No symbol: Exact version only

---

## 📦 npm Commands Cheat Sheet

### Installation

```bash
# Install all dependencies
npm install

# Install specific package
npm install express

# Install as dev dependency
npm install --save-dev jest

# Install globally
npm install -g typescript

# Install specific version
npm install express@4.18.2
```

### Management

```bash
# Update packages
npm update

# Check for outdated packages
npm outdated

# Uninstall package
npm uninstall express

# List installed packages
npm list
npm list --depth=0  # Top-level only

# Audit for vulnerabilities
npm audit
npm audit fix
```

### Scripts

```bash
# Run script
npm run <script-name>

# Special scripts
npm start
npm test
```

---

## 🔒 package-lock.json

### What It Does:
- **Locks exact dependency versions**
- Ensures consistent installs across environments
- Records entire dependency tree
- Created/updated by `npm install`

### Should You Commit It?
✅ **Yes** for applications  
❌ **No** for libraries (use .gitignore)

---

## 🏗️ Common Project Structures

### 1. Simple Express API
```
project/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── index.js
├── tests/
├── .env
├── .gitignore
└── package.json
```

### 2. Full-Stack Application
```
project/
├── client/              # Frontend (React/Vue/Angular)
│   ├── public/
│   ├── src/
│   └── package.json
├── server/             # Backend (Node.js)
│   ├── src/
│   ├── tests/
│   └── package.json
├── .gitignore
└── README.md
```

### 3. Microservices
```
project/
├── services/
│   ├── auth-service/
│   ├── user-service/
│   └── payment-service/
├── shared/
│   └── utils/
├── docker-compose.yml
└── README.md
```

---

## 🎯 Best Practices

### 1. Use .gitignore
✅ Always ignore node_modules/  
✅ Never commit .env files  
✅ Ignore build artifacts

### 2. Manage Dependencies
✅ Keep dependencies updated  
✅ Remove unused packages  
✅ Use exact versions for critical packages  
✅ Audit regularly: `npm audit`

### 3. Scripts Organization
✅ Create scripts for common tasks  
✅ Use descriptive names  
✅ Document complex scripts

### 4. Environment Variables
✅ Use .env for configuration  
✅ Provide .env.example template  
✅ Never hardcode secrets

### 5. Documentation
✅ Write comprehensive README.md  
✅ Document all scripts  
✅ Include setup instructions  
✅ List prerequisites

---

## 📝 Sample README.md Template

```markdown
# Project Name

Brief description of what this project does.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Installation

\`\`\`bash
# Clone repository
git clone https://github.com/username/project.git

# Navigate to directory
cd project

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
\`\`\`

## Usage

\`\`\`bash
# Development mode
npm run dev

# Production mode
npm start

# Run tests
npm test
\`\`\`

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production

## Environment Variables

See `.env.example` for required variables.

## License

MIT
```

---

## 🎓 Summary

Key Concepts:
✅ **package.json**: Project configuration and metadata  
✅ **dependencies**: Production packages  
✅ **devDependencies**: Development packages  
✅ **scripts**: Automate common tasks  
✅ **.env**: Store configuration  
✅ **.gitignore**: Exclude files from Git  
✅ **SemVer**: Version management  

**Next Steps**: Practice creating projects, managing dependencies, and organizing code!

---

## 🔗 Resources

- npm Documentation: https://docs.npmjs.com/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Semantic Versioning: https://semver.org/
