import React, { useState, useMemo } from 'react'
import { Search, Plus, FileText, Users, BookOpen, Target, X, Library } from 'lucide-react'
import useStore from '../store'
import TemplateSelector from './TemplateSelector'
import { 
  COMPONENT_TYPES, 
  getComponentTypeDisplayName, 
  getComponentStatusInfo,
  filterComponents,
  sortComponents
} from '../utils/componentUtils'

console.log('🎯 Loading Sidebar component...')

const Sidebar = () => {
  const { caseFile, currentComponentId, searchQuery, actions } = useStore()
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  console.log('🎯 Sidebar render - components:', caseFile.size, 'current:', currentComponentId)

  // Convert Map to Array for processing with better memoization
  const componentsArray = useMemo(() => {
    return Array.from(caseFile.values())
  }, [caseFile])

  // Filter and sort components with proper dependencies
  const filteredAndSortedComponents = useMemo(() => {
    console.log('🔄 Filtering and sorting components, count:', componentsArray.length)
    const filtered = filterComponents(componentsArray, searchQuery)
    return sortComponents(filtered, 'lastUpdated', 'desc')
  }, [componentsArray, searchQuery])

  // Group components by type with better memoization
  const componentsByType = useMemo(() => {
    console.log('🔄 Grouping components by type')
    const groups = {}
    
    Object.values(COMPONENT_TYPES).forEach(type => {
      groups[type] = []
    })
    
    filteredAndSortedComponents.forEach(comp => {
      if (groups[comp.type]) {
        groups[comp.type].push(comp)
      }
    })
    
    return groups
  }, [filteredAndSortedComponents])

  const handleAddComponent = (type) => {
    console.log('➕ Adding new component of type:', type)
    actions.addComponent({
      type,
      title: `New ${getComponentTypeDisplayName(type)}`,
      userInput: '',
      dependencies: []
    })
    setShowAddMenu(false)
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

  const ComponentItem = ({ component }) => {
    const statusInfo = getComponentStatusInfo(component.status)
    const Icon = getTypeIcon(component.type)
    const isSelected = component.id === currentComponentId

    return (
      <div
        key={component.id}
        onClick={() => {
          console.log('👁️ Selecting component:', component.id)
          actions.setCurrentComponent(component.id)
        }}
        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
          isSelected 
            ? 'bg-blue-50 border-blue-200 text-blue-900' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start space-x-3">
          <Icon size={18} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm truncate">
                {component.title}
              </h4>
              <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                {statusInfo.icon}
              </span>
            </div>
            
            {component.userInput && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {component.userInput.substring(0, 100)}
                {component.userInput.length > 100 && '...'}
              </p>
            )}
            
            {component.dependencies.length > 0 && (
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <span>Depends on {component.dependencies.length} component(s)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ComponentGroup = ({ type, components }) => {
    if (components.length === 0) return null

    const Icon = getTypeIcon(type)
    const displayName = getComponentTypeDisplayName(type)

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Icon size={16} className="text-gray-600" />
          <h3 className="font-semibold text-sm text-gray-800">{displayName}</h3>
          <span className="text-xs text-gray-500">({components.length})</span>
        </div>
        
        <div className="space-y-2">
          {components.map(component => (
            <ComponentItem key={component.id} component={component} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => {
              console.log('🔍 Search query changed:', e.target.value)
              actions.setSearchQuery(e.target.value)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => actions.setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Add component and template buttons */}
      <div className="p-4 border-b border-gray-200 bg-white space-y-3">
        {/* Template selector button */}
        <button
          onClick={() => {
            console.log('📋 Template selector button clicked - opening modal')
            console.log('📋 Current showTemplateSelector state:', showTemplateSelector)
            setShowTemplateSelector(true)
            console.log('📋 Set showTemplateSelector to true')
          }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Library size={18} />
          <span>Use Template</span>
        </button>

        {/* Add component button */}
        <div className="relative">
          <button
            onClick={() => {
              console.log('➕ Add menu toggled:', !showAddMenu)
              setShowAddMenu(!showAddMenu)
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Component</span>
          </button>

          {/* Add menu dropdown */}
          {showAddMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {Object.values(COMPONENT_TYPES).map(type => {
                const Icon = getTypeIcon(type)
                const displayName = getComponentTypeDisplayName(type)
                
                return (
                  <button
                    key={type}
                    onClick={() => handleAddComponent(type)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Icon size={18} className="text-gray-600" />
                    <span className="text-sm">{displayName}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Components list */}
      <div className="flex-1 overflow-y-auto p-4">
        {componentsArray.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Components Yet</h3>
            <p className="text-gray-600 text-sm">
              Get started by clicking 'Use Template' or 'Add Component' in the toolbar above.
            </p>
          </div>
        ) : filteredAndSortedComponents.length === 0 ? (
          <div className="text-center py-8">
            <Search size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">
              No components match your search.
            </p>
          </div>
        ) : (
          <>
            {Object.entries(componentsByType).map(([type, components]) => (
              <ComponentGroup key={type} type={type} components={components} />
            ))}
          </>
        )}
      </div>

      {/* Click outside to close add menu */}
      {showAddMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowAddMenu(false)}
        />
      )}

      {/* Template Selector Modal */}
      {console.log('🔥 Sidebar rendering TemplateSelector with isOpen:', showTemplateSelector)}
      <TemplateSelector 
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
      />
    </div>
  )
}

export default Sidebar