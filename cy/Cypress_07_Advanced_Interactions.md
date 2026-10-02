# 07 - Advanced Interactions

## Introduction to Advanced Interactions

Beyond basic clicks and typing, Cypress provides capabilities for complex user interactions. This module covers drag-and-drop, file uploads, slider manipulation, and other advanced interaction patterns with TypeScript.

## Drag and Drop

### Using cypress-drag-drop Plugin

Cypress doesn't have native drag-and-drop, but the plugin makes it easy:

```bash
npm install --save-dev @4tw/cypress-drag-drop
```

```typescript
// cypress/support/e2e.ts
import '@4tw/cypress-drag-drop'

describe('Drag and Drop with Plugin', () => {
  it('drags element to target', () => {
    cy.visit('/drag-drop')
    
    // Simple drag and drop
    cy.get('.draggable').drag('.drop-zone')
    
    // Verify drop
    cy.get('.drop-zone').should('contain', 'Dropped!')
  })
  
  it('drags with options', () => {
    cy.get('.item')
      .drag('.target', {
        force: true,
        waitForAnimations: true
      })
  })
})
```

### Manual Drag and Drop Implementation

```typescript
describe('Manual Drag and Drop', () => {
  it('implements drag and drop with events', () => {
    cy.visit('/sortable-list')
    
    const dataTransfer = new DataTransfer()
    
    // Drag start
    cy.get('.item-1')
      .trigger('dragstart', { dataTransfer })
    
    // Drag over
    cy.get('.item-3')
      .trigger('dragover', { dataTransfer })
    
    // Drop
    cy.get('.item-3')
      .trigger('drop', { dataTransfer })
    
    // Drag end
    cy.get('.item-1')
      .trigger('dragend')
    
    // Verify new order
    cy.get('.item').first().should('have.class', 'item-3')
  })
})
```

### Mouse-Based Drag and Drop

```typescript
describe('Mouse-Based Drag', () => {
  it('drags using mouse events', () => {
    cy.visit('/canvas-drag')
    
    cy.get('.draggable')
      .trigger('mousedown', { which: 1, pageX: 100, pageY: 100 })
      .trigger('mousemove', { which: 1, pageX: 300, pageY: 200 })
      .trigger('mouseup', { force: true })
  })
  
  it('drags with precise coordinates', () => {
    const startX = 100
    const startY = 100
    const endX = 300
    const endY = 200
    
    cy.get('.element')
      .trigger('mousedown', { which: 1, pageX: startX, pageY: startY })
      .trigger('mousemove', { which: 1, pageX: endX, pageY: endY })
      .trigger('mouseup')
    
    // Verify position
    cy.get('.element')
      .should('have.css', 'left', `${endX}px`)
      .should('have.css', 'top', `${endY}px`)
  })
})
```

### Type-Safe Drag and Drop

```typescript
interface DragOptions {
  force?: boolean
  waitForAnimations?: boolean
  position?: { x: number; y: number }
}

class DragDropHelper {
  static dragTo(
    sourceSelector: string,
    targetSelector: string,
    options: DragOptions = {}
  ) {
    const dataTransfer = new DataTransfer()
    
    cy.get(sourceSelector).trigger('dragstart', { dataTransfer })
    
    if (options.waitForAnimations) {
      cy.wait(300)
    }
    
    cy.get(targetSelector)
      .trigger('dragover', { dataTransfer })
      .trigger('drop', { dataTransfer, force: options.force })
    
    cy.get(sourceSelector).trigger('dragend')
  }
}

describe('Type-Safe Drag and Drop', () => {
  it('uses typed drag helper', () => {
    cy.visit('/kanban')
    
    DragDropHelper.dragTo(
      '[data-cy="task-1"]',
      '[data-cy="column-done"]',
      { waitForAnimations: true }
    )
  })
})
```

## File Uploads

### Single File Upload

```typescript
describe('File Uploads', () => {
  it('uploads single file', () => {
    cy.visit('/upload')
    
    // Upload from fixtures
    cy.get('input[type="file"]')
      .selectFile('cypress/fixtures/example.json')
    
    // Verify upload
    cy.get('.file-name').should('contain', 'example.json')
  })
  
  it('uploads with alias', () => {
    cy.fixture('users.json').as('usersFile')
    
    cy.get('input[type="file"]')
      .selectFile('@usersFile')
  })
  
  it('uploads file not in fixtures', () => {
    cy.get('input[type="file"]')
      .selectFile('path/to/file/document.pdf')
  })
})
```

### Multiple File Upload

```typescript
describe('Multiple File Upload', () => {
  it('uploads multiple files', () => {
    cy.visit('/multi-upload')
    
    cy.get('input[type="file"][multiple]')
      .selectFile([
        'cypress/fixtures/file1.txt',
        'cypress/fixtures/file2.txt',
        'cypress/fixtures/file3.txt'
      ])
    
    cy.get('.uploaded-files').children().should('have.length', 3)
  })
})
```

### Upload with File Object

```typescript
describe('File Object Upload', () => {
  it('creates and uploads file programmatically', () => {
    cy.visit('/upload')
    
    const fileContent = 'Hello, Cypress!'
    const fileName = 'test.txt'
    const mimeType = 'text/plain'
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: mimeType,
      lastModified: Date.now()
    })
    
    cy.get('.file-name').should('contain', fileName)
  })
  
  it('uploads base64 encoded file', () => {
    cy.fixture('image.png', 'base64').then((fileContent) => {
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'image.png',
        mimeType: 'image/png'
      })
    })
  })
})
```

### Drag and Drop File Upload

```typescript
describe('Drag and Drop Upload', () => {
  it('uploads file via drag and drop', () => {
    cy.visit('/drag-drop-upload')
    
    cy.get('.drop-zone')
      .selectFile('cypress/fixtures/document.pdf', {
        action: 'drag-drop'
      })
    
    cy.get('.uploaded-file').should('be.visible')
  })
  
  it('uploads multiple files via drag and drop', () => {
    cy.get('.drop-zone')
      .selectFile([
        'cypress/fixtures/file1.txt',
        'cypress/fixtures/file2.txt'
      ], {
        action: 'drag-drop'
      })
  })
})
```

### Type-Safe File Upload

```typescript
interface UploadFile {
  path: string
  fileName?: string
  mimeType?: string
}

class FileUploadHelper {
  static uploadSingle(selector: string, file: UploadFile) {
    cy.get(selector).selectFile(file.path)
  }
  
  static uploadMultiple(selector: string, files: UploadFile[]) {
    const filePaths = files.map(f => f.path)
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
      mimeType
    })
  }
}

describe('Type-Safe File Upload', () => {
  it('uses upload helper', () => {
    cy.visit('/upload')
    
    const file: UploadFile = {
      path: 'cypress/fixtures/document.pdf',
      fileName: 'document.pdf',
      mimeType: 'application/pdf'
    }
    
    FileUploadHelper.uploadSingle('input[type="file"]', file)
  })
})
```

## Sliders and Range Inputs

### Range Input Manipulation

```typescript
describe('Range Sliders', () => {
  it('sets range input value', () => {
    cy.visit('/range-slider')
    
    // Set value directly
    cy.get('input[type="range"]')
      .invoke('val', 75)
      .trigger('input')
      .trigger('change')
    
    // Verify value
    cy.get('.range-value').should('contain', '75')
  })
  
  it('moves slider by keyboard', () => {
    cy.get('input[type="range"]')
      .focus()
      .type('{rightarrow}{rightarrow}{rightarrow}')
      .should('have.value', '53')
  })
})
```

### Custom Slider Manipulation

```typescript
describe('Custom Sliders', () => {
  it('interacts with custom slider', () => {
    cy.visit('/custom-slider')
    
    // Get slider dimensions
    cy.get('.slider-track').then(($track) => {
      const trackWidth = $track.width() || 0
      const targetValue = 0.75 // 75%
      const targetX = trackWidth * targetValue
      
      cy.get('.slider-handle')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: targetX })
        .trigger('mouseup')
    })
    
    cy.get('.slider-value').should('contain', '75')
  })
  
  it('sets slider to specific percentage', () => {
    const setSliderValue = (percentage: number) => {
      cy.get('.slider-track').then(($track) => {
        const rect = $track[0].getBoundingClientRect()
        const x = rect.left + (rect.width * percentage / 100)
        
        cy.get('.slider-handle')
          .trigger('mousedown', { which: 1 })
          .trigger('mousemove', { clientX: x, clientY: rect.top })
          .trigger('mouseup', { force: true })
      })
    }
    
    setSliderValue(80)
    cy.get('.slider-value').should('contain', '80')
  })
})
```

### Type-Safe Slider Helper

```typescript
class SliderHelper {
  static setRangeValue(selector: string, value: number) {
    cy.get<HTMLInputElement>(selector)
      .invoke('val', value)
      .trigger('input')
      .trigger('change')
  }
  
  static moveRangeBySteps(selector: string, steps: number) {
    const key = steps > 0 ? '{rightarrow}' : '{leftarrow}'
    const absSteps = Math.abs(steps)
    
    cy.get(selector).focus()
    
    for (let i = 0; i < absSteps; i++) {
      cy.get(selector).type(key)
    }
  }
  
  static setCustomSlider(
    trackSelector: string,
    handleSelector: string,
    percentage: number
  ) {
    cy.get(trackSelector).then(($track) => {
      const rect = $track[0].getBoundingClientRect()
      const targetX = rect.left + (rect.width * percentage / 100)
      
      cy.get(handleSelector)
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: targetX, clientY: rect.top + rect.height / 2 })
        .trigger('mouseup')
    })
  }
}

describe('Type-Safe Slider Operations', () => {
  it('uses slider helper', () => {
    cy.visit('/sliders')
    
    SliderHelper.setRangeValue('#volume', 80)
    SliderHelper.moveRangeBySteps('#brightness', 5)
    SliderHelper.setCustomSlider('.price-slider', '.price-handle', 75)
  })
})
```

## Keyboard Interactions

### Complex Key Combinations

```typescript
describe('Keyboard Shortcuts', () => {
  it('performs complex key combinations', () => {
    cy.visit('/editor')
    
    // Select all
    cy.get('textarea').type('{ctrl}a')
    
    // Copy
    cy.get('textarea').type('{ctrl}c')
    
    // Paste
    cy.get('.output').type('{ctrl}v')
    
    // Undo
    cy.get('textarea').type('{ctrl}z')
    
    // Redo
    cy.get('textarea').type('{ctrl}{shift}z')
  })
  
  it('uses modifier keys', () => {
    // With Shift
    cy.get('input').type('{shift}Hello{shift}')
    
    // With Ctrl
    cy.get('textarea').type('{ctrl}Hello{ctrl}')
    
    // With Alt
    cy.get('input').type('{alt}h')
    
    // Multiple modifiers
    cy.get('textarea').type('{ctrl}{shift}f')
  })
})
```

### Arrow Key Navigation

```typescript
describe('Arrow Key Navigation', () => {
  it('navigates with arrow keys', () => {
    cy.visit('/grid')
    
    cy.get('.cell-1-1').focus()
    cy.focused().type('{rightarrow}')
    cy.focused().should('have.class', 'cell-1-2')
    
    cy.focused().type('{downarrow}')
    cy.focused().should('have.class', 'cell-2-2')
    
    cy.focused().type('{leftarrow}')
    cy.focused().should('have.class', 'cell-2-1')
    
    cy.focused().type('{uparrow}')
    cy.focused().should('have.class', 'cell-1-1')
  })
})
```

### Type-Safe Keyboard Helper

```typescript
type KeyCode = 'enter' | 'esc' | 'backspace' | 'del' | 'tab'
type ArrowKey = 'uparrow' | 'downarrow' | 'leftarrow' | 'rightarrow'
type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'cmd'

class KeyboardHelper {
  static pressKey(selector: string, key: KeyCode) {
    cy.get(selector).type(`{${key}}`)
  }
  
  static pressArrow(selector: string, arrow: ArrowKey) {
    cy.get(selector).type(`{${arrow}}`)
  }
  
  static pressWithModifier(
    selector: string,
    modifier: ModifierKey,
    key: string
  ) {
    cy.get(selector).type(`{${modifier}}${key}`)
  }
  
  static selectAll(selector: string) {
    cy.get(selector).type('{ctrl}a')
  }
  
  static copy(selector: string) {
    cy.get(selector).type('{ctrl}c')
  }
  
  static paste(selector: string) {
    cy.get(selector).type('{ctrl}v')
  }
}

describe('Type-Safe Keyboard', () => {
  it('uses keyboard helper', () => {
    cy.visit('/editor')
    
    KeyboardHelper.selectAll('textarea')
    KeyboardHelper.copy('textarea')
    KeyboardHelper.paste('.output')
    KeyboardHelper.pressKey('input', 'enter')
  })
})
```

## Mouse Hover Simulation

### Triggering Hover Events

```typescript
describe('Hover Simulation', () => {
  it('simulates hover with trigger', () => {
    cy.visit('/hover-menu')
    
    // Trigger mouseenter
    cy.get('.menu-item').trigger('mouseenter')
    cy.get('.submenu').should('be.visible')
    
    // Trigger mouseover
    cy.get('.tooltip-trigger').trigger('mouseover')
    cy.get('.tooltip').should('be.visible')
    
    // Trigger mouseleave
    cy.get('.menu-item').trigger('mouseleave')
    cy.get('.submenu').should('not.be.visible')
  })
  
  it('hovers with coordinates', () => {
    cy.get('.hover-area')
      .trigger('mouseover', { clientX: 100, clientY: 100 })
    
    cy.get('.coordinates').should('contain', '100, 100')
  })
})
```

### Hover with Real Events Plugin

```bash
npm install --save-dev cypress-real-events
```

```typescript
// cypress/support/e2e.ts
import 'cypress-real-events'

describe('Real Hover Events', () => {
  it('performs real hover', () => {
    cy.visit('/hover')
    
    cy.get('.hoverable').realHover()
    cy.get('.hover-effect').should('be.visible')
  })
  
  it('hovers with mouse position', () => {
    cy.get('.element').realHover({ position: 'topLeft' })
  })
})
```

## Canvas Interactions

```typescript
describe('Canvas Interactions', () => {
  it('draws on canvas', () => {
    cy.visit('/canvas')
    
    cy.get('canvas').then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Draw line
        ctx.beginPath()
        ctx.moveTo(50, 50)
        ctx.lineTo(200, 200)
        ctx.stroke()
      }
    })
  })
  
  it('clicks on canvas coordinates', () => {
    cy.get('canvas').click(100, 150)
    cy.get('.clicked-coordinates').should('contain', '100, 150')
  })
  
  it('drags on canvas', () => {
    cy.get('canvas')
      .trigger('mousedown', { clientX: 50, clientY: 50 })
      .trigger('mousemove', { clientX: 200, clientY: 200 })
      .trigger('mouseup')
  })
})
```

## Right Click Context Menu

```typescript
describe('Context Menu', () => {
  it('opens context menu', () => {
    cy.visit('/context-menu')
    
    cy.get('.content').rightclick()
    cy.get('.context-menu').should('be.visible')
  })
  
  it('selects context menu option', () => {
    cy.get('.item').rightclick()
    cy.get('.context-menu').contains('Delete').click()
    cy.get('.confirmation').should('be.visible')
  })
  
  it('prevents default context menu', () => {
    cy.get('.custom-context').rightclick()
    cy.get('.custom-menu').should('be.visible')
  })
})
```

## Clipboard Operations

```typescript
describe('Clipboard', () => {
  it('reads from clipboard', () => {
    cy.visit('/clipboard')
    
    cy.window().then((win) => {
      // Set clipboard content
      cy.wrap(win.navigator.clipboard.writeText('test text'))
      
      // Read clipboard
      cy.wrap(win.navigator.clipboard.readText())
        .should('equal', 'test text')
    })
  })
  
  it('copies to clipboard', () => {
    cy.get('.copy-button').click()
    
    cy.window().then((win) => {
      return win.navigator.clipboard.readText()
    }).should('contain', 'Copied text')
  })
})
```

## Touch Gestures (Mobile)

```typescript
describe('Touch Gestures', () => {
  it('simulates tap', () => {
    cy.viewport('iphone-x')
    cy.visit('/mobile')
    
    cy.get('.button').trigger('touchstart')
    cy.get('.button').trigger('touchend')
  })
  
  it('simulates swipe', () => {
    cy.get('.swipeable')
      .trigger('touchstart', { touches: [{ clientX: 300, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchend')
  })
  
  it('simulates pinch zoom', () => {
    cy.get('.zoomable')
      .trigger('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      })
      .trigger('touchmove', {
        touches: [
          { clientX: 50, clientY: 50 },
          { clientX: 250, clientY: 250 }
        ]
      })
      .trigger('touchend')
  })
})
```

## Custom Commands for Advanced Interactions

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      dragAndDrop(targetSelector: string): Chainable<void>
      uploadFile(filePath: string): Chainable<void>
      setSlider(value: number): Chainable<void>
      hoverElement(): Chainable<void>
      doubleClickWithDelay(delay?: number): Chainable<void>
    }
  }
}

Cypress.Commands.add('dragAndDrop', 
  { prevSubject: 'element' },
  (subject, targetSelector: string) => {
    const dataTransfer = new DataTransfer()
    cy.wrap(subject).trigger('dragstart', { dataTransfer })
    cy.get(targetSelector)
      .trigger('drop', { dataTransfer })
    cy.wrap(subject).trigger('dragend')
  }
)

Cypress.Commands.add('uploadFile',
  { prevSubject: 'element' },
  (subject, filePath: string) => {
    cy.wrap(subject).selectFile(filePath)
  }
)

Cypress.Commands.add('setSlider',
  { prevSubject: 'element' },
  (subject, value: number) => {
    cy.wrap(subject)
      .invoke('val', value)
      .trigger('input')
      .trigger('change')
  }
)

Cypress.Commands.add('hoverElement',
  { prevSubject: 'element' },
  (subject) => {
    cy.wrap(subject)
      .trigger('mouseenter')
      .trigger('mouseover')
  }
)

Cypress.Commands.add('doubleClickWithDelay',
  { prevSubject: 'element' },
  (subject, delay: number = 300) => {
    cy.wrap(subject).click()
    cy.wait(delay)
    cy.wrap(subject).click()
  }
)

// Usage
describe('Custom Commands', () => {
  it('uses advanced custom commands', () => {
    cy.visit('/app')
    
    cy.get('.draggable').dragAndDrop('.drop-target')
    cy.get('input[type="file"]').uploadFile('cypress/fixtures/file.txt')
    cy.get('input[type="range"]').setSlider(75)
    cy.get('.hover-menu').hoverElement()
    cy.get('.item').doubleClickWithDelay(500)
  })
})
```

## Best Practices

### 1. Use Appropriate Method for Interaction

```typescript
// ✅ Good - Native input for files
cy.get('input[type="file"]').selectFile('file.pdf')

// ❌ Avoid - Complex manual implementation
cy.get('input[type="file"]').then(...)
```

### 2. Wait for Animations

```typescript
// ✅ Good - Wait for animations
cy.get('.modal').should('be.visible')
cy.wait(300) // Animation duration
cy.get('.modal-content').click()

// Or use force
cy.get('.modal-content').click({ force: true })
```

### 3. Verify State After Interaction

```typescript
// ✅ Good - Verify after drag
cy.get('.item').dragAndDrop('.target')
cy.get('.target').should('contain', 'Item moved')

// ✅ Good - Verify after upload
cy.get('input[type="file"]').selectFile('file.txt')
cy.get('.file-name').should('contain', 'file.txt')
```

### 4. Type-Safe Implementations

```typescript
// ✅ Good - Type-safe helper
interface InteractionOptions {
  force?: boolean
  waitTime?: number
  verifyResult?: boolean
}

function performComplexInteraction(
  selector: string,
  options: InteractionOptions = {}
) {
  cy.get(selector).click({ force: options.force })
  
  if (options.waitTime) {
    cy.wait(options.waitTime)
  }
  
  if (options.verifyResult) {
    cy.get('.result').should('be.visible')
  }
}
```

## Summary

- Cypress handles complex interactions through plugins and manual event triggering
- File uploads use `selectFile()` command with flexible options
- Drag-and-drop requires plugin or manual DataTransfer implementation
- Sliders can be controlled via value setting or mouse events
- Keyboard interactions support complex key combinations
- Hover is simulated through event triggers
- Custom commands encapsulate complex interaction patterns
- TypeScript provides type safety for all interaction methods
- Always verify state after advanced interactions

## Next Steps

- **06 - Files and Downloads**: File system operations and download verification
- **09 - Waits and Timeouts**: Understanding timing for complex interactions
- **22 - Media and Screenshots**: Visual verification of interactions

## Quick Reference

```typescript
// Drag and drop
cy.get('.item').drag('.target')

// File upload
cy.get('input[type="file"]').selectFile('file.pdf')
cy.get('input[type="file"]').selectFile(['f1.txt', 'f2.txt'])

// Slider
cy.get('input[type="range"]').invoke('val', 75).trigger('change')

// Keyboard
cy.get('input').type('{ctrl}a')
cy.get('input').type('{enter}')

// Hover
cy.get('.menu').trigger('mouseenter')

// Right click
cy.get('.item').rightclick()

// Custom command
cy.get('.item').dragAndDrop('.target')
```
