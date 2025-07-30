// OpenAI API integration for the Pedagogic Case Builder

console.log('🤖 Loading OpenAI service...')

// API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-3.5-turbo'
const MAX_TOKENS = 2000
const TEMPERATURE = 0.7

// Get API key from session storage
const getApiKey = () => {
  const apiKey = sessionStorage.getItem('openai-api-key')
  console.log('🔑 API key status:', apiKey ? 'Found' : 'Not found')
  return apiKey
}

// Set API key in session storage
export const setApiKey = (apiKey) => {
  console.log('🔑 Setting API key in session storage')
  if (apiKey && apiKey.trim()) {
    sessionStorage.setItem('openai-api-key', apiKey.trim())
    return true
  } else {
    sessionStorage.removeItem('openai-api-key')
    return false
  }
}

// Check if API key is available
export const hasApiKey = () => {
  return !!getApiKey()
}

// Build prompt based on component type and dependencies
const buildPrompt = (component, dependencyComponents) => {
  console.log('📝 Building prompt for component:', component.type, component.id)
  
  let systemPrompt = ''
  let userPrompt = ''

  // System prompt based on component type
  switch (component.type) {
    case 'GOALS':
      systemPrompt = `You are an educational expert helping to create learning goals for a pedagogical case study. Create clear, measurable learning objectives that align with educational best practices.`
      break
    case 'CASE':
      systemPrompt = `You are an expert in creating realistic, engaging case studies for educational purposes. Create detailed scenarios that will help students learn and apply concepts.`
      break
    case 'WITNESS':
      systemPrompt = `You are an expert in character development for educational case studies. Create realistic, well-developed witness profiles with backgrounds, motivations, and relevant details.`
      break
    case 'DOCUMENT':
      systemPrompt = `You are an expert in creating authentic legal and business documents for educational case studies. Create realistic documents that serve the pedagogical purpose.`
      break
    default:
      systemPrompt = `You are an educational expert helping to create content for a pedagogical case study.`
  }

  // Build context from dependencies
  let context = ''
  if (dependencyComponents.length > 0) {
    context = '\n\nContext from related components:\n'
    dependencyComponents.forEach(dep => {
      context += `\n${dep.type} - "${dep.title}":\n`
      if (dep.aiGeneratedContent) {
        context += `${dep.aiGeneratedContent.substring(0, 500)}...\n`
      } else if (dep.userInput) {
        context += `User input: ${dep.userInput.substring(0, 300)}...\n`
      }
    })
  }

  // User prompt with instructions and context
  userPrompt = `Please create content for a ${component.type} component titled "${component.title}".

User requirements:
${component.userInput}

${context}

Please provide detailed, realistic content that fits the educational context and maintains consistency with the related components.`

  console.log('📝 Prompt built - system length:', systemPrompt.length, 'user length:', userPrompt.length)
  
  return { systemPrompt, userPrompt }
}

// Make API call to OpenAI
export const callOpenAI = async (prompt, options = {}) => {
  const messages = [
    { role: 'user', content: prompt }
  ];
  
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please configure your API key in settings.')
  }

  console.log('🌐 Making OpenAI API call...')

  const requestBody = {
    model: options.model || DEFAULT_MODEL,
    messages,
    max_tokens: options.max_tokens || MAX_TOKENS,
    temperature: options.temperature !== undefined ? options.temperature : TEMPERATURE
  }

  console.log('📤 Request details:', {
    model: requestBody.model,
    messageCount: messages.length,
    maxTokens: requestBody.max_tokens,
    temperature: requestBody.temperature
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

  let response
  try {
    response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw error
  }

  console.log('📥 API response status:', response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('❌ API call failed:', response.status, errorData)
    
    // Handle specific error types
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key.')
    } else if (response.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.')
    } else if (response.status === 403) {
      throw new Error('API access forbidden. Please check your OpenAI account status.')
    } else {
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`)
    }
  }

  const data = await response.json()
  console.log('✅ API call successful - tokens used:', data.usage?.total_tokens || 'unknown')
  
  return data.choices?.[0]?.message?.content || ''
}

// Make API call to OpenAI (internal use)
const makeApiCall = async (messages) => {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please configure your API key in settings.')
  }

  console.log('🌐 Making OpenAI API call...')

  const requestBody = {
    model: DEFAULT_MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE
  }

  console.log('📤 Request details:', {
    model: requestBody.model,
    messageCount: messages.length,
    maxTokens: requestBody.max_tokens,
    temperature: requestBody.temperature
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

  let response
  try {
    response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw error
  }

  console.log('📥 API response status:', response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('❌ API call failed:', response.status, errorData)
    
    // Handle specific error types
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key.')
    } else if (response.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.')
    } else if (response.status === 403) {
      throw new Error('API access forbidden. Please check your OpenAI account status.')
    } else {
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`)
    }
  }

  const data = await response.json()
  console.log('✅ API call successful - tokens used:', data.usage?.total_tokens || 'unknown')
  
  return data
}

// Generate content for a component
export const generateContent = async (component, dependencyComponents = []) => {
  console.log('⚡ Starting content generation for:', component.id, component.type)
  
  try {
    // Validate inputs
    if (!component.userInput || component.userInput.trim() === '') {
      throw new Error('User input is required for content generation.')
    }

    // Build the prompt
    const { systemPrompt, userPrompt } = buildPrompt(component, dependencyComponents)
    
    // Prepare messages for the API
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    // Better token estimation (more conservative)
    const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 3)
    console.log('📊 Estimated tokens for prompt:', estimatedTokens)
    
    if (estimatedTokens > 3500) {
      console.warn('⚠️ Prompt may be too long:', estimatedTokens, 'estimated tokens')
      throw new Error('Context is too large. Please reduce the amount of dependency content or shorten your input.')
    }
    
    if (estimatedTokens > 3000) {
      console.warn('⚠️ Prompt is approaching size limit:', estimatedTokens, 'estimated tokens')
    }

    // Make the API call
    const response = await makeApiCall(messages)
    
    // Extract the generated content
    const generatedContent = response.choices?.[0]?.message?.content
    if (!generatedContent) {
      throw new Error('No content generated. Please try again.')
    }

    console.log('✅ Content generation successful - length:', generatedContent.length)
    
    return {
      content: generatedContent,
      usage: response.usage,
      model: response.model
    }

  } catch (error) {
    console.error('❌ Content generation failed:', error.message)
    throw error
  }
}

// Test API key validity
export const testApiKey = async (apiKey) => {
  console.log('🧪 Testing API key validity...')
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    })

    if (response.ok || response.status === 429) {
      // 429 means rate limited but key is valid
      console.log('✅ API key is valid')
      return { valid: true, message: 'API key is valid' }
    } else if (response.status === 401) {
      console.log('❌ API key is invalid')
      return { valid: false, message: 'Invalid API key' }
    } else {
      console.log('⚠️ API key test inconclusive:', response.status)
      return { valid: false, message: 'Unable to verify API key' }
    }
  } catch (error) {
    console.error('❌ API key test failed:', error)
    return { valid: false, message: 'Network error during API key test' }
  }
}

// Get usage statistics (if available)
export const getUsageStats = () => {
  // This would track usage statistics if we implemented client-side tracking
  // For now, return placeholder data
  return {
    tokensUsed: 0,
    requestsToday: 0,
    estimatedCost: 0
  }
}

console.log('✅ OpenAI service loaded successfully')