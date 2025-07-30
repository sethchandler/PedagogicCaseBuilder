import React, { useState, useEffect } from 'react'
import { X, Key, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { setApiKey, hasApiKey, testApiKey } from '../services/openai'
import useStore from '../store'

console.log('🎯 Loading ApiKeyModal component...')

const ApiKeyModal = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const { actions } = useStore()

  console.log('🎯 ApiKeyModal render - isOpen:', isOpen)

  // Load existing API key when modal opens
  useEffect(() => {
    if (isOpen) {
      const existingKey = sessionStorage.getItem('openai-api-key')
      if (existingKey) {
        setApiKeyInput(existingKey)
      }
      setValidationResult(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    console.log('💾 Saving API key...')
    
    if (!apiKeyInput.trim()) {
      actions.addNotification('Please enter an API key', 'error')
      return
    }

    if (!apiKeyInput.startsWith('sk-')) {
      actions.addNotification('OpenAI API keys should start with "sk-"', 'error')
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      // Test the API key
      const testResult = await testApiKey(apiKeyInput.trim())
      
      if (testResult.valid) {
        // Save the key
        setApiKey(apiKeyInput.trim())
        setValidationResult({ valid: true, message: 'API key saved successfully!' })
        actions.addNotification('OpenAI API key configured successfully', 'success')
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setValidationResult({ valid: false, message: testResult.message })
        actions.addNotification(`API key validation failed: ${testResult.message}`, 'error')
      }
    } catch (error) {
      console.error('❌ API key validation error:', error)
      setValidationResult({ valid: false, message: 'Failed to validate API key' })
      actions.addNotification('Failed to validate API key', 'error')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemove = () => {
    console.log('🗑️ Removing API key...')
    setApiKey('')
    setApiKeyInput('')
    setValidationResult(null)
    actions.addNotification('API key removed', 'info')
  }

  const handleClose = () => {
    if (!hasApiKey()) {
      actions.addNotification('API key is required for AI content generation', 'warning')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Key className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              OpenAI API Key
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Enter your OpenAI API key to enable AI content generation. Your key is stored securely in your browser session only.
            </p>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value)
                    setValidationResult(null)
                  }}
                  placeholder="sk-..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isValidating}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${
                validationResult.valid
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {validationResult.valid ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span className="text-sm">{validationResult.message}</span>
              </div>
            )}

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Privacy & Security</p>
                  <ul className="text-xs space-y-1">
                    <li>• Your API key is stored only in your browser session</li>
                    <li>• The key is deleted when you close your browser tab</li>
                    <li>• We never store or transmit your key to our servers</li>
                    <li>• Get your API key from <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div>
            {hasApiKey() && (
              <button
                onClick={handleRemove}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
                disabled={isValidating}
              >
                Remove API Key
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              disabled={isValidating}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKeyInput.trim() || isValidating}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                !apiKeyInput.trim() || isValidating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isValidating ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <span>Save API Key</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiKeyModal