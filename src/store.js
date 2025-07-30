import { create } from 'zustand'
import { generateContent, hasApiKey } from './services/openai'
import { getDependencyChain } from './utils/componentUtils'
import { analyzeConsistency } from './services/consistencyAnalysis'

console.log('📦 Initializing Zustand store...')

const useStore = create((set, get) => ({
  // Core state as specified in technical spec
  caseFile: new Map(),
  history: [],
  historyIndex: -1,
  currentComponentId: null,
  searchQuery: '',
  isGenerating: false,
  lastSaveTimestamp: null,
  notifications: [],
  activeGenerationRequests: new Set(), // Track active API requests
  consistencyReport: null, // Holds AI consistency analysis results

  // Actions
  actions: {
    // Add a new component to the case file
    addComponent: (component) => {
      console.log('🆕 Adding new component:', component.id, component.type)
      const state = get()
      const newCaseFile = new Map(state.caseFile)
      
      // Generate unique ID if not provided
      if (!component.id) {
        component.id = `${component.type.toLowerCase()}-${Date.now()}`
      }
      
      // Set default values according to schema
      const newComponent = {
        id: component.id,
        type: component.type,
        title: component.title || `New ${component.type}`,
        status: 'SKETCH',
        userInput: component.userInput || '',
        aiGeneratedContent: component.aiGeneratedContent || '',
        dependencies: component.dependencies || [],
        lastUpdated: new Date().toISOString(),
        ...component
      }
      
      newCaseFile.set(component.id, newComponent)
      
      // Save state to history before making changes
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(new Map(state.caseFile))
      
      set({
        caseFile: newCaseFile,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        currentComponentId: component.id
      })
      
      console.log('✅ Component added successfully. Total components:', newCaseFile.size)
    },

    // Update an existing component
    updateComponent: (componentId, updates) => {
      console.log('📝 Updating component:', componentId, updates)
      const state = get()
      const component = state.caseFile.get(componentId)
      
      if (!component) {
        console.error('❌ Component not found:', componentId)
        return
      }
      
      // Check for circular dependencies if updating dependencies
      if (updates.dependencies) {
        console.log('🔄 Checking for circular dependencies...')
        if (state.actions.hasCircularDependency(componentId, updates.dependencies)) {
          console.error('❌ Circular dependency detected, blocking update')
          state.actions.addNotification('Cannot create dependency. This would cause a circular reference.', 'error')
          return
        }
      }
      
      const newCaseFile = new Map(state.caseFile)
      const updatedComponent = {
        ...component,
        ...updates,
        lastUpdated: new Date().toISOString()
      }
      
      newCaseFile.set(componentId, updatedComponent)
      
      // Save state to history before making changes
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(new Map(state.caseFile))
      
      set({
        caseFile: newCaseFile,
        history: newHistory,
        historyIndex: newHistory.length - 1
      })
      
      console.log('✅ Component updated successfully')
    },

    // Delete a component
    deleteComponent: (componentId) => {
      console.log('🗑️ Deleting component:', componentId)
      const state = get()
      const newCaseFile = new Map(state.caseFile)
      
      // Remove component
      newCaseFile.delete(componentId)
      
      // Remove this component from other components' dependencies
      for (const [id, component] of newCaseFile) {
        if (component.dependencies.includes(componentId)) {
          const updatedComponent = {
            ...component,
            dependencies: component.dependencies.filter(dep => dep !== componentId),
            lastUpdated: new Date().toISOString()
          }
          newCaseFile.set(id, updatedComponent)
        }
      }
      
      // Save state to history
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(new Map(state.caseFile))
      
      set({
        caseFile: newCaseFile,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        currentComponentId: state.currentComponentId === componentId ? null : state.currentComponentId
      })
      
      console.log('✅ Component deleted successfully')
    },

    // Check for circular dependencies (DAG validation)
    hasCircularDependency: (componentId, dependencies) => {
      console.log('🔍 Checking circular dependency for:', componentId, 'with deps:', dependencies)
      const state = get()
      
      const hasCycle = (currentId, targetDeps, visited = new Set(), recursionStack = new Set()) => {
        if (recursionStack.has(currentId)) {
          console.log('🚨 Cycle detected at component:', currentId)
          return true
        }
        
        if (visited.has(currentId)) {
          return false
        }
        
        visited.add(currentId)
        recursionStack.add(currentId)
        
        const currentComponent = state.caseFile.get(currentId)
        const depsToCheck = currentId === componentId ? targetDeps : (currentComponent?.dependencies || [])
        
        for (const depId of depsToCheck) {
          if (hasCycle(depId, [], visited, recursionStack)) {
            return true
          }
        }
        
        recursionStack.delete(currentId)
        return false
      }
      
      const result = hasCycle(componentId, dependencies)
      console.log('🔍 Circular dependency check result:', result)
      return result
    },

    // Undo functionality
    undo: () => {
      console.log('↶ Performing undo...')
      const state = get()
      
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1
        const previousState = state.history[newIndex]
        
        set({
          caseFile: new Map(previousState),
          historyIndex: newIndex
        })
        
        console.log('✅ Undo successful, history index:', newIndex)
      } else {
        console.log('⚠️ No more undo history available')
      }
    },

    // Redo functionality
    redo: () => {
      console.log('↷ Performing redo...')
      const state = get()
      
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1
        const nextState = state.history[newIndex]
        
        set({
          caseFile: new Map(nextState),
          historyIndex: newIndex
        })
        
        console.log('✅ Redo successful, history index:', newIndex)
      } else {
        console.log('⚠️ No more redo history available')
      }
    },

    // Set current component for detail view
    setCurrentComponent: (componentId) => {
      console.log('👁️ Setting current component:', componentId)
      set({ currentComponentId: componentId })
    },

    // Search functionality
    setSearchQuery: (query) => {
      console.log('🔍 Setting search query:', query)
      set({ searchQuery: query })
    },

    // Notification system
    addNotification: (message, type = 'info') => {
      console.log('📢 Adding notification:', type, message)
      const state = get()
      const notification = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toISOString()
      }
      
      set({
        notifications: [...state.notifications, notification]
      })
      
      // Auto-remove notification after 5 seconds
      const timeoutId = setTimeout(() => {
        state.actions.removeNotification(notification.id)
      }, 5000)
      
      // Store timeout ID for potential cleanup
      notification.timeoutId = timeoutId
    },

    removeNotification: (notificationId) => {
      console.log('🗑️ Removing notification:', notificationId)
      const state = get()
      
      // Clear timeout if it exists
      const notification = state.notifications.find(n => n.id === notificationId)
      if (notification?.timeoutId) {
        clearTimeout(notification.timeoutId)
      }
      
      set({
        notifications: state.notifications.filter(n => n.id !== notificationId)
      })
    },

    // Auto-save functionality
    autoSave: () => {
      const state = get()
      console.log('💾 Auto-saving to localStorage...')
      
      try {
        const saveData = {
          caseFile: Array.from(state.caseFile.entries()),
          timestamp: new Date().toISOString()
        }
        
        localStorage.setItem('pedagogic-case-builder', JSON.stringify(saveData))
        
        set({ lastSaveTimestamp: saveData.timestamp })
        console.log('✅ Auto-save successful at:', saveData.timestamp)
        
      } catch (error) {
        console.error('❌ Auto-save failed:', error)
        state.actions.addNotification('Failed to save data locally', 'error')
      }
    },

    // Load from localStorage
    loadFromStorage: () => {
      console.log('📂 Loading from localStorage...')
      
      try {
        const saved = localStorage.getItem('pedagogic-case-builder')
        if (saved) {
          const data = JSON.parse(saved)
          const caseFile = new Map(data.caseFile)
          
          set({
            caseFile,
            lastSaveTimestamp: data.timestamp,
            history: [new Map(caseFile)],
            historyIndex: 0
          })
          
          console.log('✅ Data loaded successfully. Components:', caseFile.size)
          return true
        }
      } catch (error) {
        console.error('❌ Failed to load from storage:', error)
      }
      
      return false
    },

    // Export case file with proper save dialog
    exportCaseFile: async () => {
      const state = get()
      console.log('📤 Exporting case file...')
      
      const exportData = {
        caseFile: Array.from(state.caseFile.entries()),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
      
      const jsonContent = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      
      // Use File System Access API if available (modern browsers)
      if ('showSaveFilePicker' in window) {
        try {
          console.log('🎯 Using File System Access API for save dialog')
          
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: `case-file-${new Date().toISOString().split('T')[0]}.json`,
            types: [
              {
                description: 'JSON files',
                accept: {
                  'application/json': ['.json'],
                },
              },
            ],
          })
          
          const writable = await fileHandle.createWritable()
          await writable.write(jsonContent)
          await writable.close()
          
          console.log('✅ Case file saved successfully with save dialog')
          state.actions.addNotification('Case file saved successfully!', 'success')
          return
          
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('💾 Save cancelled by user')
            return
          }
          console.error('❌ Save dialog failed:', error)
          // Fall back to download method
        }
      }
      
      // Fallback: Traditional download method
      console.log('📤 Using fallback download method')
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `case-file-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('✅ Case file downloaded successfully')
      state.actions.addNotification('Case file downloaded to your Downloads folder', 'info')
    },

    // Import case file
    importCaseFile: (file) => {
      console.log('📥 Importing case file:', file.name)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          const caseFile = new Map(data.caseFile)
          
          // Save current state to history before importing
          const state = get()
          const newHistory = [...state.history, new Map(state.caseFile)]
          
          set({
            caseFile,
            history: newHistory,
            historyIndex: newHistory.length - 1
          })
          
          console.log('✅ Case file imported successfully. Components:', caseFile.size)
          state.actions.addNotification('Case file imported successfully', 'success')
          
        } catch (error) {
          console.error('❌ Failed to import case file:', error)
          get().actions.addNotification('Failed to import case file', 'error')
        }
      }
      
      reader.readAsText(file)
    },

    // Set generation status
    setGenerating: (isGenerating) => {
      console.log('⚡ Setting generation status:', isGenerating)
      set({ isGenerating })
    },

    // Clear all data (reset app)
    clearAllData: () => {
      console.log('🗑️ Clearing all application data...')
      
      // Clear localStorage
      localStorage.removeItem('pedagogic-case-builder')
      
      // Reset state
      set({
        caseFile: new Map(),
        history: [],
        historyIndex: -1,
        currentComponentId: null,
        searchQuery: '',
        notifications: []
      })
      
      console.log('✅ All data cleared successfully')
    },

    // Generate AI content for a component
    generateAIContent: async (componentId) => {
      console.log('🤖 Starting AI content generation for:', componentId)
      const state = get()
      
      // Prevent concurrent requests for the same component
      if (state.activeGenerationRequests.has(componentId)) {
        console.log('⚠️ Generation already in progress for:', componentId)
        state.actions.addNotification('Content generation already in progress for this component', 'warning')
        return
      }
      
      const component = state.caseFile.get(componentId)
      
      if (!component) {
        console.error('❌ Component not found for generation:', componentId)
        state.actions.addNotification('Component not found', 'error')
        return
      }

      // Check if API key is available
      if (!hasApiKey()) {
        console.error('❌ No API key available for generation')
        state.actions.addNotification('OpenAI API key required for content generation', 'error')
        return
      }

      // Validate user input
      if (!component.userInput || component.userInput.trim() === '') {
        console.error('❌ No user input for generation')
        state.actions.addNotification('User input is required for content generation', 'error')
        return
      }

      // Track this request
      set(state => ({
        activeGenerationRequests: new Set([...state.activeGenerationRequests, componentId])
      }))

      try {
        // Set generating status
        state.actions.setGenerating(true)
        state.actions.updateComponent(componentId, { status: 'GENERATING' })

        // Get dependency chain for context
        const dependencyChain = getDependencyChain(componentId, state.caseFile)
        console.log('🔗 Using dependency chain for context, length:', dependencyChain.length)

        // Generate content
        const result = await generateContent(component, dependencyChain)
        
        // Check if component still exists (user might have deleted it)
        const currentState = get()
        if (!currentState.caseFile.has(componentId)) {
          console.log('⚠️ Component was deleted during generation:', componentId)
          return
        }
        
        // Update component with generated content
        state.actions.updateComponent(componentId, {
          status: 'GENERATED',
          aiGeneratedContent: result.content
        })

        console.log('✅ AI content generation successful')
        state.actions.addNotification('Content generated successfully!', 'success')

        // Log usage info if available
        if (result.usage) {
          console.log('📊 Token usage:', result.usage)
        }

      } catch (error) {
        console.error('❌ AI content generation failed:', error.message)
        
        // Check if component still exists before updating
        const currentState = get()
        if (currentState.caseFile.has(componentId)) {
          // Update component status to error
          state.actions.updateComponent(componentId, { status: 'ERROR' })
        }
        
        // Show user-friendly error message
        let errorMessage = 'Failed to generate content'
        if (error.message.includes('API key')) {
          errorMessage = 'Invalid API key. Please check your OpenAI configuration.'
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'API rate limit exceeded. Please try again later.'
        } else if (error.message.includes('too large')) {
          errorMessage = 'Context too large. Try reducing dependencies or input length.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection.'
        }
        
        state.actions.addNotification(errorMessage, 'error')
      } finally {
        // Remove from active requests
        set(state => ({
          activeGenerationRequests: new Set([...state.activeGenerationRequests].filter(id => id !== componentId))
        }))
        
        state.actions.setGenerating(false)
      }
    },

    // AI-powered consistency check for content analysis
    runConsistencyCheck: async () => {
      console.log('🔍 Running AI consistency check...')
      const state = get()
      
      // Check if API key is available
      if (!hasApiKey()) {
        console.error('❌ No API key available for consistency check')
        state.actions.addNotification('OpenAI API key required for consistency analysis', 'error')
        return
      }
      
      // Check if there's content to analyze
      const components = Array.from(state.caseFile.values())
      const hasContent = components.some(c => c.aiGeneratedContent || c.userInput)
      
      if (!hasContent) {
        state.actions.addNotification('Please add some content to analyze for inconsistencies', 'warning')
        return
      }
      
      try {
        state.actions.setGenerating(true)
        state.actions.addNotification('Analyzing case for inconsistencies...', 'info')
        
        // Run the AI analysis
        const result = await analyzeConsistency(state.caseFile)
        
        if (result.success && result.inconsistencies.length > 0) {
          // Store results and trigger modal
          set({ 
            consistencyReport: {
              inconsistencies: result.inconsistencies,
              analyzedAt: result.analyzedAt,
              showModal: true
            }
          })
          
          state.actions.addNotification(
            `Found ${result.inconsistencies.length} potential inconsistencies`, 
            'warning'
          )
        } else if (result.success && result.inconsistencies.length === 0) {
          state.actions.addNotification('No inconsistencies found! Your case appears consistent.', 'success')
        }
        
      } catch (error) {
        console.error('❌ Consistency check failed:', error)
        state.actions.addNotification(
          error.message || 'Failed to analyze consistency', 
          'error'
        )
      } finally {
        state.actions.setGenerating(false)
      }
    },
    
    // Update consistency report status
    updateConsistencyStatus: (issueId, newStatus) => {
      const state = get()
      if (!state.consistencyReport) return
      
      const updatedIssues = state.consistencyReport.inconsistencies.map(issue =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      )
      
      set({
        consistencyReport: {
          ...state.consistencyReport,
          inconsistencies: updatedIssues
        }
      })
    },
    
    // Close consistency report modal
    closeConsistencyReport: () => {
      set(state => ({
        consistencyReport: state.consistencyReport ? 
          { ...state.consistencyReport, showModal: false } : null
      }))
    }
  }
}))

// Initialize auto-save interval
let autoSaveInterval
if (typeof window !== 'undefined') {
  console.log('⚙️ Setting up auto-save interval...')
  
  // Load existing data on startup
  useStore.getState().actions.loadFromStorage()
  
  // Auto-save every 10 seconds
  autoSaveInterval = setInterval(() => {
    useStore.getState().actions.autoSave()
  }, 10000)
  
  // Clean up interval on page unload
  window.addEventListener('beforeunload', () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
      autoSaveInterval = null
    }
  })
}

export default useStore