// Component utility functions for the Pedagogic Case Builder

console.log('🔧 Loading component utilities...')

// Component types as specified in technical spec
export const COMPONENT_TYPES = {
  GOALS: 'GOALS',
  CASE: 'CASE', 
  WITNESS: 'WITNESS',
  DOCUMENT: 'DOCUMENT'
}

// Component statuses
export const COMPONENT_STATUS = {
  SKETCH: 'SKETCH',
  GENERATING: 'GENERATING', 
  GENERATED: 'GENERATED',
  ERROR: 'ERROR'
}

// Create a new component with default values
export const createComponent = (type, title = '', content = '') => {
  console.log('🏗️ Creating new component:', type, title)
  
  return {
    id: `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: title || `New ${type}`,
    status: COMPONENT_STATUS.SKETCH,
    content, // Single unified content field
    aiProposal: '', // AI suggestions go here temporarily
    hasProposal: false, // Flag to show/hide proposal section
    dependencies: [],
    lastUpdated: new Date().toISOString()
  }
}

// Get component type display name
export const getComponentTypeDisplayName = (type) => {
  const displayNames = {
    [COMPONENT_TYPES.GOALS]: 'Learning Goals',
    [COMPONENT_TYPES.CASE]: 'Case Description',
    [COMPONENT_TYPES.WITNESS]: 'Witness',
    [COMPONENT_TYPES.DOCUMENT]: 'Document'
  }
  return displayNames[type] || type
}

// Get component status display info
export const getComponentStatusInfo = (status) => {
  const statusInfo = {
    [COMPONENT_STATUS.SKETCH]: { 
      label: 'Draft', 
      color: 'text-gray-600 bg-gray-100',
      icon: '📝'
    },
    [COMPONENT_STATUS.GENERATING]: { 
      label: 'Generating...', 
      color: 'text-blue-600 bg-blue-100',
      icon: '⚡'
    },
    [COMPONENT_STATUS.GENERATED]: { 
      label: 'Generated', 
      color: 'text-green-600 bg-green-100',
      icon: '✅'
    },
    [COMPONENT_STATUS.ERROR]: { 
      label: 'Error', 
      color: 'text-red-600 bg-red-100',
      icon: '❌'
    }
  }
  return statusInfo[status] || statusInfo[COMPONENT_STATUS.SKETCH]
}

// Validate component data
export const validateComponent = (component) => {
  console.log('🔍 Validating component:', component?.id)
  
  const errors = []
  
  if (!component) {
    errors.push('Component is required')
    return errors
  }
  
  if (!component.id) {
    errors.push('Component ID is required')
  }
  
  if (!component.type || !Object.values(COMPONENT_TYPES).includes(component.type)) {
    errors.push('Valid component type is required')
  }
  
  if (!component.title || component.title.trim() === '') {
    errors.push('Component title is required')
  }
  
  if (!component.status || !Object.values(COMPONENT_STATUS).includes(component.status)) {
    errors.push('Valid component status is required')
  }
  
  if (!Array.isArray(component.dependencies)) {
    errors.push('Dependencies must be an array')
  }
  
  console.log('✅ Component validation result:', errors.length === 0 ? 'Valid' : 'Invalid', errors)
  return errors
}

// Get dependency chain for a component (for context building)
export const getDependencyChain = (componentId, caseFile, visited = new Set()) => {
  console.log('🔗 Building dependency chain for:', componentId)
  
  if (visited.has(componentId)) {
    console.log('🚨 Circular dependency detected in chain for:', componentId)
    return []
  }
  
  const component = caseFile.get(componentId)
  if (!component) {
    console.log('⚠️ Component not found in dependency chain:', componentId)
    return []
  }
  
  visited.add(componentId)
  const chain = [component]
  
  // Recursively add dependencies
  for (const depId of component.dependencies) {
    const depChain = getDependencyChain(depId, caseFile, new Set(visited))
    chain.unshift(...depChain)
  }
  
  console.log('🔗 Dependency chain built, length:', chain.length)
  return chain
}

// Get components that depend on a given component
export const getDependents = (componentId, caseFile) => {
  console.log('🔍 Finding dependents of:', componentId)
  
  const dependents = []
  
  for (const [id, component] of caseFile) {
    if (component.dependencies.includes(componentId)) {
      dependents.push(component)
    }
  }
  
  console.log('📋 Found dependents:', dependents.length)
  return dependents
}

// Check if component can be safely deleted
export const canDeleteComponent = (componentId, caseFile) => {
  const dependents = getDependents(componentId, caseFile)
  return dependents.length === 0
}

// Filter components by search query
export const filterComponents = (components, searchQuery) => {
  if (!searchQuery || searchQuery.trim() === '') {
    return components
  }
  
  const query = searchQuery.toLowerCase().trim()
  console.log('🔍 Filtering components with query:', query)
  
  return components.filter(component => {
    return (
      component.title.toLowerCase().includes(query) ||
      component.content.toLowerCase().includes(query) ||
      getComponentTypeDisplayName(component.type).toLowerCase().includes(query)
    )
  })
}

// Sort components by various criteria
export const sortComponents = (components, sortBy = 'lastUpdated', sortOrder = 'desc') => {
  console.log('📊 Sorting components by:', sortBy, sortOrder)
  
  return [...components].sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'lastUpdated':
      default:
        aValue = new Date(a.lastUpdated)
        bValue = new Date(b.lastUpdated)
        break
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })
}

// Generate unique component title
export const generateUniqueTitle = (baseTitle, type, caseFile) => {
  let title = baseTitle || `New ${getComponentTypeDisplayName(type)}`
  let counter = 1
  
  const existingTitles = new Set()
  for (const [, component] of caseFile) {
    if (component.type === type) {
      existingTitles.add(component.title)
    }
  }
  
  while (existingTitles.has(title)) {
    counter++
    title = `${baseTitle || `New ${getComponentTypeDisplayName(type)}`} ${counter}`
  }
  
  console.log('🏷️ Generated unique title:', title)
  return title
}

console.log('✅ Component utilities loaded successfully')