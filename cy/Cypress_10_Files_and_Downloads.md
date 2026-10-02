# 10 - Files and Downloads

## Introduction to File Operations

Cypress provides comprehensive capabilities for working with files - from reading fixtures to handling downloads and file system operations. This module covers all file-related operations with TypeScript.

## File Uploads (Detailed)

### Basic File Upload

```typescript
describe('File Upload', () => {
  it('uploads file from fixtures', () => {
    cy.visit('/upload')
    
    // Upload single file
    cy.get('input[type="file"]')
      .selectFile('cypress/fixtures/example.pdf')
    
    // Verify upload
    cy.get('.uploaded-file-name').should('contain', 'example.pdf')
  })
  
  it('uploads file with different action', () => {
    // Default is 'select'
    cy.get('input[type="file"]')
      .selectFile('cypress/fixtures/document.pdf', { action: 'select' })
    
    // Drag and drop
    cy.get('.drop-zone')
      .selectFile('cypress/fixtures/document.pdf', { action: 'drag-drop' })
  })
})
```

### File Upload Options

```typescript
interface FileUploadOptions {
  action?: 'select' | 'drag-drop'
  force?: boolean
  encoding?: 'utf8' | 'base64' | 'binary'
}

describe('File Upload Options', () => {
  it('uses various upload options', () => {
    const options: Partial<Cypress.SelectFileOptions> = {
      force: true,
      action: 'drag-drop'
    }
    
    cy.get('input[type="file"]')
      .selectFile('cypress/fixtures/file.txt', options)
  })
  
  it('uploads with specific encoding', () => {
    cy.fixture('image.png', 'base64').then((fileContent) => {
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'image.png',
        mimeType: 'image/png',
        lastModified: Date.now()
      })
    })
  })
})
```

### Multiple File Upload

```typescript
describe('Multiple Files', () => {
  it('uploads multiple files at once', () => {
    cy.visit('/multi-upload')
    
    cy.get('input[type="file"][multiple]')
      .selectFile([
        'cypress/fixtures/doc1.pdf',
        'cypress/fixtures/doc2.pdf',
        'cypress/fixtures/doc3.pdf'
      ])
    
    cy.get('.uploaded-files .file-item')
      .should('have.length', 3)
  })
  
  it('uploads files one by one', () => {
    const files = ['file1.txt', 'file2.txt', 'file3.txt']
    
    files.forEach((file) => {
      cy.get('input[type="file"]')
        .selectFile(`cypress/fixtures/${file}`)
      
      cy.get('.file-list').should('contain', file)
    })
  })
})
```

### Type-Safe File Upload

```typescript
interface UploadableFile {
  path?: string
  contents?: Cypress.Buffer
  fileName: string
  mimeType?: string
  lastModified?: number
}

class FileUploader {
  static uploadFromFixture(selector: string, fixturePath: string) {
    cy.get(selector).selectFile(`cypress/fixtures/${fixturePath}`)
  }
  
  static uploadMultiple(selector: string, files: string[]) {
    const filePaths = files.map(f => `cypress/fixtures/${f}`)
    cy.get(selector).selectFile(filePaths)
  }
  
  static uploadWithContent(
    selector: string,
    content: string,
    fileName: string,
    mimeType: string = 'text/plain'
  ) {
    cy.get(selector).selectFile({
      contents: Cypress.Buffer.from(content),
      fileName,
      mimeType,
      lastModified: Date.now()
    })
  }
  
  static uploadDragDrop(selector: string, filePath: string) {
    cy.get(selector).selectFile(filePath, { action: 'drag-drop' })
  }
}

describe('Type-Safe Upload', () => {
  it('uses file uploader class', () => {
    cy.visit('/upload')
    
    FileUploader.uploadFromFixture('input[type="file"]', 'document.pdf')
    
    FileUploader.uploadWithContent(
      'input[type="file"]',
      'Test content',
      'test.txt',
      'text/plain'
    )
    
    FileUploader.uploadMultiple('input[type="file"]', [
      'file1.txt',
      'file2.txt'
    ])
  })
})
```

## Reading Files

### cy.readFile()

```typescript
describe('Reading Files', () => {
  it('reads file content', () => {
    // Read text file
    cy.readFile('cypress/fixtures/data.txt')
      .should('contain', 'expected content')
    
    // Read JSON file
    cy.readFile<{ name: string; age: number }>('cypress/fixtures/user.json')
      .its('name')
      .should('equal', 'John Doe')
  })
  
  it('reads with encoding', () => {
    // UTF-8 (default)
    cy.readFile('file.txt')
    
    // Base64
    cy.readFile('image.png', 'base64')
      .should('be.a', 'string')
    
    // Binary
    cy.readFile('file.pdf', 'binary')
  })
})
```

### Type-Safe File Reading

```typescript
interface UserData {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
}

interface Config {
  apiUrl: string
  timeout: number
  retries: number
}

describe('Type-Safe File Reading', () => {
  it('reads typed JSON files', () => {
    cy.readFile<UserData>('cypress/fixtures/user.json')
      .then((user) => {
        expect(user.username).to.be.a('string')
        expect(user.role).to.be.oneOf(['admin', 'user'])
      })
    
    cy.readFile<Config>('cypress/fixtures/config.json')
      .then((config) => {
        expect(config.timeout).to.be.a('number')
        expect(config.apiUrl).to.include('https://')
      })
  })
  
  it('validates file structure', () => {
    cy.readFile<UserData>('cypress/fixtures/user.json')
      .should((user) => {
        expect(user).to.have.property('id')
        expect(user).to.have.property('username')
        expect(user).to.have.property('email')
        expect(user).to.have.property('role')
      })
  })
})
```

### Reading Files in Node (Tasks)

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'
import * as fs from 'fs'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        readFileFromSystem(filePath: string): string | null {
          try {
            return fs.readFileSync(filePath, 'utf8')
          } catch (e) {
            return null
          }
        },
        
        readJsonFile(filePath: string): any {
          const content = fs.readFileSync(filePath, 'utf8')
          return JSON.parse(content)
        },
        
        fileExists(filePath: string): boolean {
          return fs.existsSync(filePath)
        }
      })
      
      return config
    }
  }
})

// In test
describe('Reading with Tasks', () => {
  it('reads file via Node task', () => {
    cy.task<string>('readFileFromSystem', 'path/to/file.txt')
      .should('contain', 'expected content')
  })
  
  it('checks file existence', () => {
    cy.task<boolean>('fileExists', 'downloads/report.pdf')
      .should('be.true')
  })
})
```

## Writing Files

### cy.writeFile()

```typescript
describe('Writing Files', () => {
  it('writes text to file', () => {
    const content = 'This is test content'
    
    cy.writeFile('cypress/downloads/output.txt', content)
    
    // Verify
    cy.readFile('cypress/downloads/output.txt')
      .should('equal', content)
  })
  
  it('writes JSON to file', () => {
    const data = {
      name: 'Test User',
      timestamp: new Date().toISOString()
    }
    
    cy.writeFile('cypress/downloads/data.json', data)
    
    cy.readFile('cypress/downloads/data.json')
      .its('name')
      .should('equal', 'Test User')
  })
  
  it('appends to file', () => {
    cy.writeFile('cypress/downloads/log.txt', 'First line\n')
    cy.writeFile('cypress/downloads/log.txt', 'Second line\n', { flag: 'a+' })
    
    cy.readFile('cypress/downloads/log.txt')
      .should('contain', 'First line')
      .and('contain', 'Second line')
  })
})
```

### Type-Safe File Writing

```typescript
interface TestResult {
  testName: string
  status: 'passed' | 'failed'
  duration: number
  timestamp: string
}

interface LogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  timestamp: string
}

class FileWriter {
  static writeJson<T>(filePath: string, data: T): void {
    cy.writeFile(filePath, data)
  }
  
  static writeText(filePath: string, content: string): void {
    cy.writeFile(filePath, content)
  }
  
  static appendText(filePath: string, content: string): void {
    cy.writeFile(filePath, content, { flag: 'a+' })
  }
  
  static writeLog(entry: LogEntry): void {
    const logPath = 'cypress/logs/test.log'
    const logLine = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}\n`
    
    cy.writeFile(logPath, logLine, { flag: 'a+' })
  }
}

describe('Type-Safe File Writing', () => {
  it('writes typed data', () => {
    const result: TestResult = {
      testName: 'Login Test',
      status: 'passed',
      duration: 1500,
      timestamp: new Date().toISOString()
    }
    
    FileWriter.writeJson('cypress/results/test-result.json', result)
    
    cy.readFile<TestResult>('cypress/results/test-result.json')
      .should((data) => {
        expect(data.testName).to.equal('Login Test')
        expect(data.status).to.equal('passed')
      })
  })
  
  it('writes log entries', () => {
    const logEntry: LogEntry = {
      level: 'info',
      message: 'Test started',
      timestamp: new Date().toISOString()
    }
    
    FileWriter.writeLog(logEntry)
  })
})
```

## File Downloads

### Verifying Downloads

```typescript
describe('File Downloads', () => {
  it('downloads and verifies file', () => {
    cy.visit('/downloads')
    
    // Trigger download
    cy.get('[data-cy="download-pdf"]').click()
    
    // Verify file exists
    const downloadsFolder = Cypress.config('downloadsFolder')
    cy.readFile(`${downloadsFolder}/document.pdf`).should('exist')
  })
  
  it('verifies download content', () => {
    cy.get('[data-cy="download-csv"]').click()
    
    cy.readFile('cypress/downloads/data.csv')
      .should('contain', 'Name,Email,Age')
  })
  
  it('downloads with custom filename', () => {
    cy.get('[data-cy="download-report"]').click()
    
    const fileName = `report-${new Date().toISOString().split('T')[0]}.pdf`
    cy.readFile(`cypress/downloads/${fileName}`).should('exist')
  })
})
```

### Programmatic Downloads

```typescript
describe('Programmatic Downloads', () => {
  it('downloads file via API request', () => {
    cy.request({
      url: '/api/download/report',
      method: 'GET',
      encoding: 'binary'
    }).then((response) => {
      const fileName = 'downloaded-report.pdf'
      cy.writeFile(`cypress/downloads/${fileName}`, response.body, 'binary')
      
      cy.readFile(`cypress/downloads/${fileName}`, 'binary').should('exist')
    })
  })
  
  it('downloads and parses CSV', () => {
    cy.request('/api/export/users.csv')
      .then((response) => {
        cy.writeFile('cypress/downloads/users.csv', response.body)
        
        cy.readFile('cypress/downloads/users.csv')
          .should('include', 'john@example.com')
      })
  })
})
```

### Type-Safe Download Verification

```typescript
interface DownloadOptions {
  timeout?: number
  verifyContent?: boolean
  deleteAfter?: boolean
}

class DownloadHelper {
  static verifyDownload(
    fileName: string,
    options: DownloadOptions = {}
  ): void {
    const timeout = options.timeout || 10000
    const filePath = `cypress/downloads/${fileName}`
    
    cy.readFile(filePath, { timeout }).should('exist')
    
    if (options.deleteAfter) {
      cy.task('deleteFile', filePath)
    }
  }
  
  static downloadViaRequest(
    url: string,
    fileName: string,
    encoding: 'utf8' | 'binary' = 'binary'
  ): void {
    cy.request({
      url,
      method: 'GET',
      encoding
    }).then((response) => {
      cy.writeFile(`cypress/downloads/${fileName}`, response.body, encoding)
    })
  }
  
  static verifyCSVContent(
    fileName: string,
    expectedHeaders: string[]
  ): void {
    cy.readFile(`cypress/downloads/${fileName}`)
      .then((content: string) => {
        const lines = content.split('\n')
        const headers = lines[0].split(',')
        
        expectedHeaders.forEach((header) => {
          expect(headers).to.include(header)
        })
      })
  }
}

describe('Type-Safe Downloads', () => {
  it('verifies downloaded file', () => {
    cy.visit('/downloads')
    cy.get('[data-cy="download-btn"]').click()
    
    DownloadHelper.verifyDownload('report.pdf', {
      timeout: 15000,
      verifyContent: true
    })
  })
  
  it('downloads via API and verifies', () => {
    DownloadHelper.downloadViaRequest(
      '/api/export/data',
      'export.json',
      'utf8'
    )
    
    cy.readFile('cypress/downloads/export.json')
      .should('have.property', 'data')
  })
  
  it('verifies CSV structure', () => {
    cy.get('[data-cy="export-csv"]').click()
    
    DownloadHelper.verifyCSVContent('users.csv', [
      'Name',
      'Email',
      'Role'
    ])
  })
})
```

## Working with Fixtures

### Loading Fixtures

```typescript
describe('Fixtures', () => {
  it('loads fixture data', () => {
    cy.fixture('users.json').then((users) => {
      // Use fixture data
      cy.visit('/login')
      cy.get('#username').type(users[0].username)
      cy.get('#password').type(users[0].password)
    })
  })
  
  it('uses fixture alias', () => {
    cy.fixture('config.json').as('config')
    
    cy.get('@config').then((config: any) => {
      cy.visit(config.baseUrl)
    })
  })
  
  it('loads multiple fixtures', () => {
    cy.fixture('users.json').as('users')
    cy.fixture('products.json').as('products')
    cy.fixture('settings.json').as('settings')
    
    cy.get('@users').then((users: any) => {
      cy.log(`Loaded ${users.length} users`)
    })
  })
})
```

### Type-Safe Fixtures

```typescript
// cypress/fixtures/types.ts
export interface User {
  id: string
  username: string
  email: string
  password: string
  role: 'admin' | 'user'
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
}

export interface AppConfig {
  apiUrl: string
  timeout: number
  retries: number
  features: {
    darkMode: boolean
    notifications: boolean
  }
}

describe('Type-Safe Fixtures', () => {
  it('uses typed fixtures', () => {
    cy.fixture<User[]>('users.json').then((users) => {
      const admin = users.find(u => u.role === 'admin')
      
      if (admin) {
        cy.get('#username').type(admin.username)
        cy.get('#password').type(admin.password)
      }
    })
  })
  
  it('uses typed config', () => {
    cy.fixture<AppConfig>('config.json').then((config) => {
      expect(config.apiUrl).to.be.a('string')
      expect(config.timeout).to.be.a('number')
      expect(config.features.darkMode).to.be.a('boolean')
    })
  })
})
```

### Dynamic Fixtures

```typescript
describe('Dynamic Fixtures', () => {
  it('generates fixture at runtime', () => {
    const dynamicData = {
      timestamp: new Date().toISOString(),
      userId: `user_${Date.now()}`,
      randomValue: Math.random()
    }
    
    cy.writeFile('cypress/fixtures/dynamic.json', dynamicData)
    
    cy.fixture('dynamic.json').then((data) => {
      expect(data.userId).to.include('user_')
    })
  })
  
  it('modifies existing fixture', () => {
    cy.fixture('users.json').then((users: User[]) => {
      // Add new user
      const newUser: User = {
        id: 'new_id',
        username: 'newuser',
        email: 'new@example.com',
        password: 'newpass',
        role: 'user'
      }
      
      users.push(newUser)
      
      cy.writeFile('cypress/fixtures/users.json', users)
    })
  })
})
```

## File System Tasks

### Custom File Operations

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'
import * as fs from 'fs'
import * as path from 'path'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        deleteFile(filePath: string): null {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
          return null
        },
        
        deleteFolder(folderPath: string): null {
          if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true })
          }
          return null
        },
        
        createFolder(folderPath: string): null {
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
          }
          return null
        },
        
        listFiles(folderPath: string): string[] {
          if (!fs.existsSync(folderPath)) {
            return []
          }
          return fs.readdirSync(folderPath)
        },
        
        getFileStats(filePath: string): any {
          if (!fs.existsSync(filePath)) {
            return null
          }
          return fs.statSync(filePath)
        },
        
        copyFile(source: string, destination: string): null {
          fs.copyFileSync(source, destination)
          return null
        },
        
        renameFile(oldPath: string, newPath: string): null {
          fs.renameSync(oldPath, newPath)
          return null
        }
      })
      
      return config
    }
  }
})

describe('File System Operations', () => {
  it('manages files and folders', () => {
    // Create folder
    cy.task('createFolder', 'cypress/temp')
    
    // Write file
    cy.writeFile('cypress/temp/test.txt', 'content')
    
    // List files
    cy.task<string[]>('listFiles', 'cypress/temp')
      .should('include', 'test.txt')
    
    // Get file stats
    cy.task('getFileStats', 'cypress/temp/test.txt')
      .should('have.property', 'size')
    
    // Copy file
    cy.task('copyFile', 
      'cypress/temp/test.txt',
      'cypress/temp/test-copy.txt'
    )
    
    // Rename file
    cy.task('renameFile',
      'cypress/temp/test-copy.txt',
      'cypress/temp/renamed.txt'
    )
    
    // Delete file
    cy.task('deleteFile', 'cypress/temp/renamed.txt')
    
    // Delete folder
    cy.task('deleteFolder', 'cypress/temp')
  })
})
```

## Cleaning Downloads Folder

```typescript
describe('Download Cleanup', () => {
  beforeEach(() => {
    // Clean downloads before each test
    cy.task('deleteFolder', 'cypress/downloads')
    cy.task('createFolder', 'cypress/downloads')
  })
  
  afterEach(() => {
    // Optional: Clean after test
    cy.task('deleteFolder', 'cypress/downloads')
  })
  
  it('ensures clean download state', () => {
    cy.task<string[]>('listFiles', 'cypress/downloads')
      .should('have.length', 0)
    
    // Perform download
    cy.visit('/downloads')
    cy.get('[data-cy="download"]').click()
    
    // Verify single file
    cy.task<string[]>('listFiles', 'cypress/downloads')
      .should('have.length', 1)
  })
})
```

## Binary Files

```typescript
describe('Binary Files', () => {
  it('reads binary file', () => {
    cy.readFile('cypress/fixtures/image.png', 'binary')
      .should('have.length.gt', 0)
  })
  
  it('writes binary file', () => {
    cy.readFile('cypress/fixtures/image.png', 'binary')
      .then((content) => {
        cy.writeFile('cypress/downloads/image-copy.png', content, 'binary')
      })
    
    cy.readFile('cypress/downloads/image-copy.png', 'binary')
      .should('exist')
  })
  
  it('downloads binary file via request', () => {
    cy.request({
      url: '/api/download/image.png',
      method: 'GET',
      encoding: 'binary'
    }).then((response) => {
      cy.writeFile('cypress/downloads/downloaded.png', response.body, 'binary')
    })
  })
})
```

## Best Practices

### 1. Use Appropriate Paths

```typescript
// ✅ Good - Relative to project root
cy.readFile('cypress/fixtures/data.json')
cy.writeFile('cypress/downloads/output.txt', 'content')

// ❌ Avoid - Absolute paths (not portable)
cy.readFile('/Users/me/project/file.txt')
```

### 2. Type Your File Data

```typescript
// ✅ Good - Typed data
interface Config {
  apiUrl: string
}

cy.fixture<Config>('config.json').then((config) => {
  expect(config.apiUrl).to.be.a('string')
})

// ❌ Avoid - Untyped
cy.fixture('config.json').then((config: any) => {
  // No type safety
})
```

### 3. Clean Up After Tests

```typescript
// ✅ Good - Clean up
afterEach(() => {
  cy.task('deleteFolder', 'cypress/temp')
})

// ✅ Good - Verify before cleanup
after(() => {
  cy.task<string[]>('listFiles', 'cypress/downloads')
    .then((files) => {
      if (files.length > 0) {
        cy.task('deleteFolder', 'cypress/downloads')
      }
    })
})
```

### 4. Handle Large Files Carefully

```typescript
// ✅ Good - Stream large files in Node
// cypress.config.ts
on('task', {
  downloadLargeFile(url: string): Promise<null> {
    return new Promise((resolve) => {
      const file = fs.createWriteStream('large-file.zip')
      https.get(url, (response) => {
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve(null)
        })
      })
    })
  }
})
```

## Summary

- Cypress provides comprehensive file operations: read, write, upload, download
- `cy.readFile()` and `cy.writeFile()` work with text and binary files
- `selectFile()` handles file uploads with flexible options
- Downloads can be verified by reading from downloads folder
- Fixtures provide test data with full TypeScript support
- Custom tasks extend file system capabilities in Node process
- Always use relative paths for portability
- Clean up temporary files after tests
- Type your file data for better maintainability

## Next Steps

- **07 - Navigation and Pages**: URL navigation and page management
- **14 - Fixtures and Hooks**: Advanced fixture patterns
- **19 - API Testing**: API-based file downloads

## Quick Reference

```typescript
// Read file
cy.readFile('path/to/file.txt')
cy.readFile<Type>('file.json')

// Write file
cy.writeFile('path/to/file.txt', 'content')
cy.writeFile('file.json', { data: 'value' })

// Upload file
cy.get('input[type="file"]').selectFile('file.pdf')
cy.get('input').selectFile(['f1.txt', 'f2.txt'])

// Fixture
cy.fixture('data.json')
cy.fixture<Type>('data.json').as('data')

// Download verification
cy.readFile('cypress/downloads/file.pdf').should('exist')

// Tasks
cy.task('deleteFile', 'path/to/file')
cy.task('listFiles', 'folder/path')
```
