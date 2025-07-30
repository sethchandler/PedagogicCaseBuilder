import React, { useState } from 'react'
import { Undo2, Redo2, Save, Download, Upload, Settings, Key } from 'lucide-react'
import useStore from '../store'
import { hasApiKey } from '../services/openai'
import ApiKeyModal from './ApiKeyModal'

console.log('🎯 Loading Header component...')

const Header = () => {
  const { history, historyIndex, lastSaveTimestamp, isGenerating, actions } = useStore()
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1
  const apiKeyConfigured = hasApiKey()

  console.log('🎯 Header render - undo available:', canUndo, 'redo available:', canRedo)

  const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (file) {
      console.log('📤 File selected for import:', file.name)
      actions.importCaseFile(file)
      event.target.value = '' // Reset input
    }
  }

  const formatLastSave = (timestamp) => {
    if (!timestamp) return 'Never saved'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Saved just now'
    if (diffMins === 1) return 'Saved 1 minute ago'
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`
    
    return `Saved at ${date.toLocaleTimeString()}`
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PC</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Pedagogic Case Builder
            </h1>
          </div>
          
          {/* Generation status indicator */}
          {isGenerating && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium">Generating...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Undo/Redo buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                console.log('⏪ Undo button clicked')
                actions.undo()
              }}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-colors ${
                canUndo 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} />
            </button>
            
            <button
              onClick={() => {
                console.log('⏩ Redo button clicked')
                actions.redo()
              }}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-colors ${
                canRedo 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={18} />
            </button>
          </div>

          {/* Save status */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Save size={16} />
            <span>{formatLastSave(lastSaveTimestamp)}</span>
          </div>

          {/* Import/Export buttons */}
          <div className="flex items-center space-x-1">
            <label
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
              title="Import Case File"
            >
              <Upload size={18} />
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
            
            <button
              onClick={() => {
                console.log('📥 Export button clicked')
                actions.exportCaseFile()
              }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              title="Export Case File"
            >
              <Download size={18} />
            </button>
          </div>

          {/* API Key Configuration */}
          <button
            onClick={() => {
              console.log('🔑 API key button clicked')
              setShowApiKeyModal(true)
            }}
            className={`p-2 rounded-lg transition-colors ${
              apiKeyConfigured
                ? 'text-green-600 hover:bg-green-50'
                : 'text-red-600 hover:bg-red-50'
            }`}
            title={apiKeyConfigured ? 'API Key Configured' : 'Configure API Key'}
          >
            <Key size={18} />
          </button>

          {/* Settings button (placeholder for future features) */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
            title="Settings"
            onClick={() => {
              console.log('⚙️ Settings button clicked (not implemented yet)')
              actions.addNotification('Settings panel coming in future updates', 'info')
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      
      {/* API Key Modal */}
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)} 
      />
    </header>
  )
}

export default Header