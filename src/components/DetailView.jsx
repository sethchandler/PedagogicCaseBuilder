import React, { useState, useEffect } from 'react'
import { 
  Save, 
  Trash2, 
  Link, 
  Unlink, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  BookOpen,
  Target
} from 'lucide-react'
import useStore from '../store'
import { 
  COMPONENT_TYPES, 
  COMPONENT_STATUS,
  getComponentTypeDisplayName, 
  getComponentStatusInfo,
  validateComponent,
  getDependents
} from '../utils/componentUtils'

console.log('🎯 Loading DetailView component...')

const DetailView = () => {
  const { caseFile, currentComponentId, isGenerating, actions } = useStore()
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')
  const [localImageUrl, setLocalImageUrl] = useState('')
  const [localImageAltText, setLocalImageAltText] = useState('')
  const [selectedDependencies, setSelectedDependencies] = useState([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [imageUrlError, setImageUrlError] = useState('')

  const currentComponent = currentComponentId ? caseFile.get(currentComponentId) : null

  // Validate image URL
  const validateImageUrl = (url) => {
    if (!url.trim()) {
      setImageUrlError('')
      return true
    }

    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setImageUrlError('URL must start with http:// or https://')
        return false
      }

      setImageUrlError('')
      return true
    } catch (error) {
      setImageUrlError('Please enter a valid URL')
      return false
    }
  }

  const handleImageUrlChange = (url) => {
    setLocalImageUrl(url)
    validateImageUrl(url)
  }

  console.log('🎯 DetailView render - current component:', currentComponent?.id, currentComponent?.type)

  // Sync local state with current component
  useEffect(() => {
    if (currentComponent) {
      console.log('🔄 Syncing DetailView state with component:', currentComponent.id)
      setLocalTitle(currentComponent.title || '')
      setLocalContent(currentComponent.content || '')
      setLocalImageUrl(currentComponent.imageUrl || '')
      setLocalImageAltText(currentComponent.imageAltText || '')
      setSelectedDependencies([...currentComponent.dependencies])
      setImageUrlError('')
      setHasUnsavedChanges(false)
    } else {
      setLocalTitle('')
      setLocalContent('')
      setLocalImageUrl('')
      setLocalImageAltText('')
      setSelectedDependencies([])
      setImageUrlError('')
      setHasUnsavedChanges(false)
    }
  }, [currentComponent])

  // Track changes to show unsaved indicator with proper memoization
  useEffect(() => {
    if (!currentComponent) {
      setHasUnsavedChanges(false)
      return
    }

    const hasChanges = 
      localTitle !== currentComponent.title ||
      localContent !== currentComponent.content ||
      localImageUrl !== (currentComponent.imageUrl || '') ||
      localImageAltText !== (currentComponent.imageAltText || '') ||
      JSON.stringify([...selectedDependencies].sort()) !== JSON.stringify([...currentComponent.dependencies].sort())

    setHasUnsavedChanges(hasChanges)
  }, [localTitle, localContent, localImageUrl, localImageAltText, selectedDependencies, currentComponent?.title, currentComponent?.content, currentComponent?.imageUrl, currentComponent?.imageAltText, currentComponent?.dependencies])

  if (!currentComponent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <BookOpen size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Select a Component
          </h2>
          <p className="text-gray-600">
            Choose a component from the sidebar to view and edit its details.
          </p>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    console.log('💾 Saving component changes:', currentComponent.id)
    
    // Prevent saving if there are validation errors
    if (imageUrlError) {
      actions.addNotification('Please fix the image URL error before saving', 'error')
      return
    }
    
    const updates = {}
    if (localTitle !== currentComponent.title) updates.title = localTitle
    if (localContent !== currentComponent.content) updates.content = localContent
    if (localImageUrl !== (currentComponent.imageUrl || '')) updates.imageUrl = localImageUrl
    if (localImageAltText !== (currentComponent.imageAltText || '')) updates.imageAltText = localImageAltText
    if (JSON.stringify(selectedDependencies.sort()) !== JSON.stringify(currentComponent.dependencies.sort())) {
      updates.dependencies = selectedDependencies
    }

    if (Object.keys(updates).length > 0) {
      actions.updateComponent(currentComponent.id, updates)
      actions.addNotification('Component saved successfully', 'success')
    }
  }

  const handleGenerate = async () => {
    console.log('⚡ Enhancing component with AI:', currentComponent.id)
    
    // Save any changes first
    handleSave()
    
    // Use the store's AI generation action
    await actions.generateAIContent(currentComponent.id)
  }

  const handleDelete = () => {
    console.log('🗑️ Deleting component:', currentComponent.id)
    
    const dependents = getDependents(currentComponent.id, caseFile)
    if (dependents.length > 0) {
      actions.addNotification(
        `Cannot delete: ${dependents.length} other component(s) depend on this one`,
        'error'
      )
      return
    }

    if (confirm(`Are you sure you want to delete "${currentComponent.title}"?`)) {
      actions.deleteComponent(currentComponent.id)
      actions.addNotification('Component deleted successfully', 'success')
    }
  }

  const handleDependencyToggle = (componentId) => {
    console.log('🔗 Toggling dependency:', componentId)
    
    const newDependencies = selectedDependencies.includes(componentId)
      ? selectedDependencies.filter(id => id !== componentId)
      : [...selectedDependencies, componentId]
    
    setSelectedDependencies(newDependencies)
  }

  const statusInfo = getComponentStatusInfo(currentComponent.status)
  const availableComponents = Array.from(caseFile.values()).filter(comp => 
    comp.id !== currentComponent.id
  )

  const getTypeIcon = (type) => {
    const icons = {
      [COMPONENT_TYPES.GOALS]: Target,
      [COMPONENT_TYPES.CASE]: BookOpen,
      [COMPONENT_TYPES.WITNESS]: Users,
      [COMPONENT_TYPES.DOCUMENT]: FileText
    }
    return icons[type] || FileText
  }

  const TypeIcon = getTypeIcon(currentComponent.type)

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TypeIcon size={24} className="text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getComponentTypeDisplayName(currentComponent.type)}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                  {statusInfo.icon} {statusInfo.label}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    ● Unsaved changes
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                hasUnsavedChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save size={16} />
              <span>Save</span>
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !localContent.trim()}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isGenerating || !localContent.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Zap size={16} />
              <span>{isGenerating ? 'Enhancing...' : 'AI Enhance'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Enter ${getComponentTypeDisplayName(currentComponent.type).toLowerCase()} title...`}
            />
          </div>

          {/* Current Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Content
            </label>
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Enter content for this ${getComponentTypeDisplayName(currentComponent.type).toLowerCase()}...`}
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the main content for your component. You can type here directly or use AI enhancement.
            </p>
          </div>

          {/* Image Fields - Only for Document Components */}
          {currentComponent.type === 'DOCUMENT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={localImageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    imageUrlError 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="https://example.com/image.jpg"
                />
                {imageUrlError && (
                  <p className="text-xs text-red-600 mt-1">
                    {imageUrlError}
                  </p>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  <p className="mb-1">
                    Add a URL to an image. This can be any web URL that serves an image - doesn't need to end in .jpg/.png.
                  </p>
                  <p className="font-medium">Suggested hosting services:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>GitHub: Upload to your repository and use the raw URL</li>
                    <li>Imgur: Free image hosting with direct links</li>
                    <li>Google Drive: Make public and use direct link</li>
                    <li>CDN services: Cloudinary, AWS S3, etc.</li>
                  </ul>
                  <p className="mt-2 text-amber-600">
                    ⚠️ External links may break over time. Consider hosting images in the same repository as your case files.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Description (Alt Text)
                </label>
                <input
                  type="text"
                  value={localImageAltText}
                  onChange={(e) => setLocalImageAltText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the image for accessibility"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide a brief description of the image for accessibility and context.
                </p>
              </div>

              {/* Image Preview */}
              {localImageUrl && !imageUrlError && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Preview
                  </label>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img
                      src={localImageUrl}
                      alt={localImageAltText || 'Document image'}
                      className="max-w-full h-auto max-h-64 rounded shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block'
                        e.target.nextSibling.style.display = 'none'
                      }}
                    />
                    <div 
                      className="text-red-600 text-sm bg-red-50 p-3 rounded border"
                      style={{ display: 'none' }}
                    >
                      ⚠️ Could not load image from this URL. Please verify the link and ensure the image is publicly accessible.
                    </div>
                  </div>
                  {localImageAltText && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      Alt text: {localImageAltText}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dependencies */}
          {availableComponents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dependencies
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select which components this one should depend on. The AI will use their content as context.
              </p>
              
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {availableComponents.map(component => {
                  const ComponentIcon = getTypeIcon(component.type)
                  const isSelected = selectedDependencies.includes(component.id)
                  
                  return (
                    <label
                      key={component.id}
                      className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDependencyToggle(component.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <ComponentIcon size={16} className="text-gray-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {component.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getComponentTypeDisplayName(component.type)}
                        </div>
                      </div>
                      {isSelected && (
                        <Link size={14} className="text-blue-600" />
                      )}
                    </label>
                  )
                })}
              </div>
              
              {selectedDependencies.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  {selectedDependencies.length} component(s) selected as dependencies
                </div>
              )}
            </div>
          )}

          {/* AI Proposal */}
          {currentComponent.hasProposal && currentComponent.aiProposal && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  AI Proposal
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => actions.acceptProposal(currentComponent.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Replace current content with this proposal"
                  >
                    <span>↻ Replace</span>
                  </button>
                  <button
                    onClick={() => actions.appendProposal(currentComponent.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    title="Add this proposal to the end of current content"
                  >
                    <span>+ Append</span>
                  </button>
                  <button
                    onClick={() => actions.rejectProposal(currentComponent.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    title="Dismiss this proposal"
                  >
                    <span>✗ Reject</span>
                  </button>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="whitespace-pre-wrap text-sm text-gray-800">
                  {currentComponent.aiProposal}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Review this AI-generated proposal. <strong>Replace</strong> to overwrite current content, <strong>Append</strong> to add to the end, or <strong>Reject</strong> to dismiss.
              </p>
            </div>
          )}

          {/* Component Info */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Component Information</h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">ID:</span> {currentComponent.id}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {new Date(currentComponent.lastUpdated).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Dependencies:</span> {currentComponent.dependencies.length}
              </div>
              <div>
                <span className="font-medium">Status:</span> {statusInfo.label}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailView