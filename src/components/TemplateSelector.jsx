import React, { useState } from 'react'
import { X, BookOpen, Users, FileText, Target, ArrowRight } from 'lucide-react'
import { getAvailableTemplates, loadTemplate } from '../utils/templates'
import { COMPONENT_TYPES } from '../utils/componentUtils'
import useStore from '../store'

console.log('🎯 Loading TemplateSelector component...')

const TemplateSelector = ({ isOpen, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const { actions } = useStore()
  const templates = getAvailableTemplates()

  console.log('🎯 TemplateSelector render - isOpen:', isOpen, 'templates:', templates.length)

  if (!isOpen) return null

  const handleLoadTemplate = () => {
    if (!selectedTemplate) {
      actions.addNotification('Please select a template', 'warning')
      return
    }

    console.log('📋 Loading template:', selectedTemplate)
    
    try {
      const components = loadTemplate(selectedTemplate)
      
      // Add all components to the case file
      components.forEach(component => {
        actions.addComponent(component)
      })
      
      actions.addNotification(`Template loaded successfully! Added ${components.length} components.`, 'success')
      onClose()
      
      // Select the first component (usually the case description)
      if (components.length > 0) {
        actions.setCurrentComponent(components[0].id)
      }
      
    } catch (error) {
      console.error('❌ Failed to load template:', error)
      actions.addNotification('Failed to load template', 'error')
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      [COMPONENT_TYPES.GOALS]: Target,
      [COMPONENT_TYPES.CASE]: BookOpen,
      [COMPONENT_TYPES.WITNESS]: Users,
      [COMPONENT_TYPES.DOCUMENT]: FileText
    }
    return icons[type] || FileText
  }

  const getTemplatePreview = (templateId) => {
    try {
      const components = loadTemplate(templateId)
      const typeCount = {}
      
      components.forEach(comp => {
        typeCount[comp.type] = (typeCount[comp.type] || 0) + 1
      })
      
      return Object.entries(typeCount).map(([type, count]) => {
        const Icon = getTypeIcon(type)
        return { type, count, Icon }
      })
    } catch (error) {
      console.error('❌ Failed to preview template:', error)
      return []
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <BookOpen className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Select a Template
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex overflow-hidden" style={{ height: '600px' }}>
          {/* Template List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Available Templates
              </h3>
              <div className="space-y-3">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {template.description}
                        </p>
                        
                        {/* Component preview */}
                        <div className="flex items-center space-x-4">
                          {getTemplatePreview(template.id).map(({ type, count, Icon }) => (
                            <div key={type} className="flex items-center space-x-1 text-xs text-gray-500">
                              <Icon size={14} />
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {selectedTemplate === template.id && (
                        <div className="ml-3 text-blue-600">
                          <ArrowRight size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Template Preview */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              {selectedTemplate ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Template Preview
                  </h3>
                  
                  {(() => {
                    try {
                      const components = loadTemplate(selectedTemplate)
                      return (
                        <div className="space-y-4">
                          {components.map((component, index) => {
                            const Icon = getTypeIcon(component.type)
                            return (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Icon size={16} className="text-gray-600" />
                                  <h4 className="font-medium text-gray-900">
                                    {component.title}
                                  </h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {component.userInput.length > 150 
                                    ? component.userInput.substring(0, 150) + '...'
                                    : component.userInput
                                  }
                                </p>
                                {component.dependencies.length > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Depends on {component.dependencies.length} component(s)
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    } catch (error) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-red-600">Failed to load template preview</p>
                        </div>
                      )
                    }
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Template
                  </h3>
                  <p className="text-gray-600">
                    Choose a template from the list to see a preview of its components.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedTemplate && (
              <>
                Template will add {getTemplatePreview(selectedTemplate).reduce((sum, item) => sum + item.count, 0)} components to your case file.
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLoadTemplate}
              disabled={!selectedTemplate}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                selectedTemplate
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Load Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateSelector