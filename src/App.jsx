import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import DetailView from './components/DetailView'
import Notifications from './components/Notifications'
import ApiKeyModal from './components/ApiKeyModal'
import ErrorBoundary from './components/ErrorBoundary'
import ConsistencyReportModal from './components/ConsistencyReportModal'
import useStore from './store'
import { hasApiKey } from './services/openai'

console.log('🚀 Loading App component...')

function App() {
  const { actions } = useStore()
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    console.log('⌨️ Setting up keyboard shortcuts...')
    
    const handleKeyDown = (event) => {
      // Undo (Ctrl+Z / Cmd+Z)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        console.log('⌨️ Undo shortcut triggered')
        actions.undo()
      }
      
      // Redo (Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z)
      if (((event.ctrlKey || event.metaKey) && event.key === 'y') || 
          ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
        event.preventDefault()
        console.log('⌨️ Redo shortcut triggered')
        actions.redo()
      }
      
      // Save (Ctrl+S / Cmd+S) - prevent browser save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        console.log('⌨️ Save shortcut triggered - auto-save is already active')
        actions.addNotification('Auto-save is active - your work is automatically saved', 'info')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [actions])

  // Welcome message and API key check on first load
  useEffect(() => {
    console.log('👋 App mounted, checking for welcome message and API key...')
    
    const hasShownWelcome = localStorage.getItem('pcb-welcome-shown')
    if (!hasShownWelcome) {
      setTimeout(() => {
        actions.addNotification('Welcome to Pedagogic Case Builder! Configure your OpenAI API key to get started.', 'info')
        localStorage.setItem('pcb-welcome-shown', 'true')
        
        // Show API key modal if not configured
        if (!hasApiKey()) {
          setShowApiKeyModal(true)
        }
      }, 1000)
    }
  }, [actions])

  console.log('🚀 App render')

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <ErrorBoundary>
          <Header />
        </ErrorBoundary>
        
        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
          
          {/* Detail view */}
          <ErrorBoundary>
            <DetailView />
          </ErrorBoundary>
        </div>
        
        {/* Notifications */}
        <Notifications />
        
        {/* API Key Modal */}
        <ApiKeyModal 
          isOpen={showApiKeyModal} 
          onClose={() => setShowApiKeyModal(false)} 
        />
        
        {/* Consistency Report Modal */}
        <ConsistencyReportModal />
      </div>
    </ErrorBoundary>
  )
}

export default App