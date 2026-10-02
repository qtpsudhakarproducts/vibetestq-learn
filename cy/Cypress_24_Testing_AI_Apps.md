# 26 - Testing AI-Powered Applications

## Introduction to Testing AI Applications

Testing AI-powered applications presents unique challenges: non-deterministic responses, dynamic content, and context-dependent behavior. This module covers strategies for testing LLMs, chatbots, and AI features with Cypress and TypeScript.

## Challenges in Testing AI Applications

### Non-Deterministic Behavior

AI applications don't always produce the same output for the same input:

```typescript
describe('AI Response Challenges', () => {
  it('handles variable AI responses', () => {
    cy.visit('/chat')
    cy.get('[data-cy="input"]').type('Tell me a joke')
    cy.get('[data-cy="send"]').click()
    
    // ❌ This might fail - AI gives different jokes each time
    // cy.get('[data-cy="response"]').should('contain', 'Why did the chicken')
    
    // ✅ Better - test response characteristics
    cy.get('[data-cy="response"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.empty')
      .and(($response) => {
        const text = $response.text()
        expect(text.length).to.be.greaterThan(10)
        expect(text).to.match(/\?/)  // Contains a question mark (joke format)
      })
  })
})
```

## Testing LLM Responses

### Response Quality Assertions

```typescript
interface AIResponse {
  text: string
  confidence?: number
  sources?: string[]
  metadata?: any
}

class AIResponseTester {
  assertResponseQuality(response: AIResponse, criteria: QualityCriteria): void {
    // Length check
    if (criteria.minLength) {
      expect(response.text.length).to.be.at.least(criteria.minLength)
    }
    
    // Coherence check (simple heuristic)
    if (criteria.requiresCoherence) {
      expect(response.text).to.match(/[.!?]$/)  // Ends with punctuation
      expect(response.text.split(' ').length).to.be.at.least(5)
    }
    
    // Contains required keywords
    if (criteria.requiredKeywords) {
      criteria.requiredKeywords.forEach(keyword => {
        expect(response.text.toLowerCase()).to.include(keyword.toLowerCase())
      })
    }
    
    // Excludes prohibited content
    if (criteria.prohibitedTerms) {
      criteria.prohibitedTerms.forEach(term => {
        expect(response.text.toLowerCase()).to.not.include(term.toLowerCase())
      })
    }
    
    // Confidence threshold
    if (criteria.minConfidence && response.confidence) {
      expect(response.confidence).to.be.at.least(criteria.minConfidence)
    }
  }
  
  assertSentiment(response: string, expected: 'positive' | 'negative' | 'neutral'): void {
    // Simple sentiment detection (in practice, use sentiment analysis library)
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love']
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'hate']
    
    const text = response.toLowerCase()
    const positiveCount = positiveWords.filter(w => text.includes(w)).length
    const negativeCount = negativeWords.filter(w => text.includes(w)).length
    
    if (expected === 'positive') {
      expect(positiveCount).to.be.greaterThan(negativeCount)
    } else if (expected === 'negative') {
      expect(negativeCount).to.be.greaterThan(positiveCount)
    }
  }
}

interface QualityCriteria {
  minLength?: number
  requiresCoherence?: boolean
  requiredKeywords?: string[]
  prohibitedTerms?: string[]
  minConfidence?: number
}

// Usage
describe('AI Response Quality', () => {
  const tester = new AIResponseTester()
  
  it('validates customer service bot response', () => {
    cy.request('POST', '/api/ai/chat', {
      message: 'How do I return a product?'
    }).then((response) => {
      tester.assertResponseQuality(response.body, {
        minLength: 50,
        requiresCoherence: true,
        requiredKeywords: ['return', 'policy'],
        prohibitedTerms: ['I don\'t know', 'error'],
        minConfidence: 0.7
      })
    })
  })
})
```

### Testing Different Input Variations

```typescript
describe('AI Input Variations', () => {
  const inputVariations = [
    { input: 'What is the weather?', category: 'direct' },
    { input: 'Can you tell me about the weather?', category: 'polite' },
    { input: 'weather?', category: 'minimal' },
    { input: 'WEATHER', category: 'caps' },
    { input: 'wether', category: 'typo' }
  ]
  
  inputVariations.forEach(({ input, category }) => {
    it(`handles ${category} input: "${input}"`, () => {
      cy.visit('/chat')
      cy.get('[data-cy="input"]').type(input)
      cy.get('[data-cy="send"]').click()
      
      cy.get('[data-cy="response"]', { timeout: 15000 })
        .should('be.visible')
        .and('not.be.empty')
        .and(($el) => {
          const response = $el.text()
          expect(response.toLowerCase()).to.include('weather')
        })
    })
  })
})
```

## Testing Chatbots

### Conversation Flow Testing

```typescript
interface ConversationTurn {
  user: string
  expectedPatterns: RegExp[]
  timeout?: number
}

class ChatbotTester {
  testConversation(turns: ConversationTurn[]): void {
    cy.visit('/chat')
    
    turns.forEach((turn, index) => {
      cy.log(`Turn ${index + 1}: ${turn.user}`)
      
      // Send user message
      cy.get('[data-cy="input"]').clear().type(turn.user)
      cy.get('[data-cy="send"]').click()
      
      // Wait for bot response
      cy.get('[data-cy="messages"]')
        .find('.bot-message')
        .last({ timeout: turn.timeout || 10000 })
        .should(($message) => {
          const text = $message.text()
          
          // Check if response matches expected patterns
          const matchesPattern = turn.expectedPatterns.some(pattern => 
            pattern.test(text)
          )
          
          expect(matchesPattern, 
            `Response "${text}" should match one of the expected patterns`
          ).to.be.true
        })
    })
  }
}

// Usage
describe('Chatbot Conversations', () => {
  const tester = new ChatbotTester()
  
  it('handles product inquiry conversation', () => {
    tester.testConversation([
      {
        user: 'I need help with a product',
        expectedPatterns: [/help/i, /assist/i, /product/i]
      },
      {
        user: 'Laptop',
        expectedPatterns: [/laptop/i, /computer/i, /which.*model/i]
      },
      {
        user: 'Under $1000',
        expectedPatterns: [/\$/, /price/i, /budget/i, /recommend/i]
      }
    ])
  })
})
```

### Context Retention Testing

```typescript
describe('AI Context Retention', () => {
  it('maintains conversation context', () => {
    cy.visit('/chat')
    
    // First message establishes context
    cy.get('[data-cy="input"]').type('My name is John')
    cy.get('[data-cy="send"]').click()
    cy.wait(2000)
    
    // Second message references context
    cy.get('[data-cy="input"]').type('What is my name?')
    cy.get('[data-cy="send"]').click()
    
    // AI should remember the name
    cy.get('[data-cy="messages"]')
      .find('.bot-message')
      .last()
      .should('contain', 'John')
  })
  
  it('handles multi-turn context', () => {
    cy.visit('/chat')
    
    const conversation = [
      { user: 'I have a blue car', check: null },
      { user: 'It was made in 2020', check: null },
      { user: 'What color is my car?', check: 'blue' },
      { user: 'When was it made?', check: '2020' }
    ]
    
    conversation.forEach(turn => {
      cy.get('[data-cy="input"]').clear().type(turn.user)
      cy.get('[data-cy="send"]').click()
      cy.wait(2000)
      
      if (turn.check) {
        cy.get('[data-cy="messages"]')
          .find('.bot-message')
          .last()
          .should('contain', turn.check)
      }
    })
  })
})
```

## Testing AI-Generated Content

### Content Validation

```typescript
describe('AI Content Generation', () => {
  it('generates appropriate product descriptions', () => {
    cy.request('POST', '/api/ai/generate-description', {
      product: 'Wireless Headphones',
      features: ['Bluetooth', 'Noise Cancelling', '30hr Battery']
    }).then((response) => {
      const description = response.body.description
      
      // Validate content presence
      expect(description).to.include('Wireless')
      expect(description).to.include('Bluetooth')
      expect(description).to.include('30')
      
      // Validate length
      expect(description.length).to.be.within(100, 500)
      
      // Validate no placeholder text
      expect(description).to.not.include('[')
      expect(description).to.not.include('TODO')
      expect(description).to.not.include('placeholder')
      
      // Validate proper formatting
      expect(description).to.match(/[.!]$/)  // Ends with punctuation
    })
  })
  
  it('generates safe content', () => {
    cy.request('POST', '/api/ai/generate-content', {
      topic: 'Family vacation'
    }).then((response) => {
      const content = response.body.text
      
      // No inappropriate content
      const inappropriateTerms = ['violence', 'explicit']
      inappropriateTerms.forEach(term => {
        expect(content.toLowerCase()).to.not.include(term)
      })
    })
  })
})
```

## Testing AI Recommendations

### Recommendation Quality

```typescript
describe('AI Recommendations', () => {
  it('provides relevant product recommendations', () => {
    cy.request('POST', '/api/ai/recommend', {
      userId: 'user123',
      context: 'Looking for running shoes'
    }).then((response) => {
      const recommendations = response.body.products
      
      expect(recommendations).to.be.an('array')
      expect(recommendations.length).to.be.at.least(3)
      
      // All recommendations should be relevant
      recommendations.forEach((product: any) => {
        const name = product.name.toLowerCase()
        expect(
          name.includes('shoe') || 
          name.includes('running') ||
          name.includes('sneaker')
        ).to.be.true
      })
      
      // Should have diversity
      const uniqueCategories = new Set(recommendations.map((p: any) => p.category))
      expect(uniqueCategories.size).to.be.at.least(2)
    })
  })
})
```

## Performance Testing for AI

### Response Time Monitoring

```typescript
describe('AI Performance', () => {
  it('responds within acceptable timeframe', () => {
    const startTime = Date.now()
    
    cy.request('POST', '/api/ai/chat', {
      message: 'Hello'
    }).then((response) => {
      const duration = Date.now() - startTime
      
      // AI should respond within 5 seconds
      expect(duration).to.be.lessThan(5000)
      
      // Log performance metric
      cy.task('logMetric', {
        metric: 'ai_response_time',
        value: duration,
        timestamp: new Date().toISOString()
      })
    })
  })
  
  it('handles concurrent requests', () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      cy.request('POST', '/api/ai/chat', {
        message: `Test message ${i}`
      })
    )
    
    Cypress.Promise.all(requests).then((responses) => {
      responses.forEach((response, i) => {
        expect(response.status).to.eq(200)
        expect(response.body.text).to.exist
      })
    })
  })
})
```

## Mocking AI Responses

### Deterministic Testing

```typescript
describe('Mocked AI Responses', () => {
  beforeEach(() => {
    // Mock AI API for deterministic testing
    cy.intercept('POST', '/api/ai/**', (req) => {
      const mockResponses: Record<string, string> = {
        'hello': 'Hello! How can I help you today?',
        'weather': 'I can help you check the weather. What location?',
        'goodbye': 'Goodbye! Have a great day!'
      }
      
      const userMessage = req.body.message.toLowerCase()
      const mockResponse = Object.keys(mockResponses).find(key => 
        userMessage.includes(key)
      )
      
      req.reply({
        statusCode: 200,
        body: {
          text: mockResponses[mockResponse || 'hello'],
          confidence: 0.95
        }
      })
    })
  })
  
  it('tests UI with mocked AI', () => {
    cy.visit('/chat')
    cy.get('[data-cy="input"]').type('hello')
    cy.get('[data-cy="send"]').click()
    
    cy.get('[data-cy="response"]')
      .should('contain', 'Hello! How can I help you today?')
  })
})
```

## Error Handling

### AI Failure Scenarios

```typescript
describe('AI Error Handling', () => {
  it('handles AI service unavailable', () => {
    cy.intercept('POST', '/api/ai/chat', {
      statusCode: 503,
      body: { error: 'Service temporarily unavailable' }
    })
    
    cy.visit('/chat')
    cy.get('[data-cy="input"]').type('Test message')
    cy.get('[data-cy="send"]').click()
    
    cy.get('[data-cy="error"]')
      .should('be.visible')
      .and('contain', 'unavailable')
  })
  
  it('handles timeout', () => {
    cy.intercept('POST', '/api/ai/chat', (req) => {
      req.reply({
        delay: 30000,  // 30 second delay
        body: { text: 'Response' }
      })
    })
    
    cy.visit('/chat')
    cy.get('[data-cy="input"]').type('Test')
    cy.get('[data-cy="send"]').click()
    
    // Should show loading indicator
    cy.get('[data-cy="loading"]').should('be.visible')
    
    // Should eventually show timeout message
    cy.get('[data-cy="error"]', { timeout: 15000 })
      .should('contain', 'timeout')
  })
})
```

## Best Practices

### 1. Focus on Behavior, Not Exact Output

```typescript
// ✅ Good - tests behavior
cy.get('[data-cy="response"]').should(($el) => {
  const text = $el.text()
  expect(text.length).to.be.greaterThan(20)
  expect(text).to.match(/weather|temperature|forecast/i)
})

// ❌ Avoid - expects exact output
cy.get('[data-cy="response"]')
  .should('contain', 'The weather today is sunny with a high of 75°F')
```

### 2. Test AI Integration, Not AI Itself

```typescript
// ✅ Good - tests your app's AI integration
it('sends request to AI service correctly', () => {
  cy.intercept('POST', '/api/ai/chat').as('aiRequest')
  cy.visit('/chat')
  cy.get('[data-cy="input"]').type('Test')
  cy.get('[data-cy="send"]').click()
  
  cy.wait('@aiRequest').its('request.body').should('include', {
    message: 'Test',
    userId: 'user123'
  })
})

// ❌ Avoid - testing AI model quality
it('AI gives perfect answers', () => {
  // This tests the AI provider, not your app
})
```

### 3. Use Timeouts Appropriately

```typescript
// ✅ Good - AI-appropriate timeouts
cy.get('[data-cy="ai-response"]', { timeout: 15000 })
  .should('be.visible')

// ❌ Avoid - default timeout for AI
cy.get('[data-cy="ai-response"]')  // May timeout with default 4s
  .should('be.visible')
```

## Summary

- AI applications require different testing strategies
- Test response characteristics, not exact content
- Handle non-deterministic behavior
- Test conversation flow and context retention
- Validate content quality and safety
- Monitor AI performance and timeouts
- Mock AI responses for deterministic tests
- Focus on integration, not AI model quality
- Use appropriate timeouts for AI operations
- Test error handling and fallbacks

## Next Steps

- **28 - Cypress Agents**: AI-powered test automation
- **31 - Capstone Project**: Build AI-tested application
- **24 - Best Practices**: AI testing best practices

## Quick Reference

```typescript
// Response quality testing
tester.assertResponseQuality(response, {
  minLength: 50,
  requiredKeywords: ['product', 'price'],
  minConfidence: 0.7
})

// Conversation testing
tester.testConversation([
  { user: 'Hello', expectedPatterns: [/hi/i, /hello/i] }
])

// Mock AI responses
cy.intercept('POST', '/api/ai/**', {
  body: { text: 'Mocked response' }
})

// Performance testing
const start = Date.now()
cy.request('/api/ai/chat')
  .then(() => {
    expect(Date.now() - start).to.be.lessThan(5000)
  })
```
