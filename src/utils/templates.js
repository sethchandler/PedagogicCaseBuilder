// Template system for the Pedagogic Case Builder

import { COMPONENT_TYPES, createComponent } from './componentUtils'

console.log('📋 Loading template system...')

// Pre-built case templates as specified in the technical documentation
export const TEMPLATES = {
  CIVIL_LAWSUIT: {
    id: 'civil-lawsuit',
    name: 'Civil Lawsuit',
    description: 'A basic civil litigation case with witness testimony and documentary evidence',
    components: [
      {
        type: COMPONENT_TYPES.GOALS,
        title: 'Learning Goals',
        content: 'Students will understand the basics of civil litigation procedures, evidence evaluation, and witness credibility assessment. They will learn to analyze legal arguments and apply relevant statutes and case law.',
        dependencies: []
      },
      {
        type: COMPONENT_TYPES.CASE,
        title: 'Case Background',
        content: 'A contract dispute between a small business owner and a supplier regarding delayed delivery of goods that resulted in lost profits. The business owner is seeking damages for breach of contract.',
        dependencies: []
      },
      {
        type: COMPONENT_TYPES.WITNESS,
        title: 'Business Owner (Plaintiff)',
        content: 'The plaintiff who owns a retail electronics store. Claims the delayed delivery caused them to miss the holiday sales season, resulting in significant lost revenue.',
        dependencies: ['case-background']
      },
      {
        type: COMPONENT_TYPES.WITNESS,
        title: 'Supplier Representative (Defendant)',
        content: 'The defendant company\'s sales manager who handled the contract. Claims the delay was due to unforeseen manufacturing issues and disputes the extent of claimed damages.',
        dependencies: ['case-background']
      },
      {
        type: COMPONENT_TYPES.DOCUMENT,
        title: 'Purchase Contract',
        content: 'The original purchase agreement between the parties, including delivery terms, payment schedules, and any force majeure clauses.',
        dependencies: ['case-background'],
        imageUrl: '',
        imageAltText: ''
      },
      {
        type: COMPONENT_TYPES.DOCUMENT,
        title: 'Financial Records',
        content: 'Sales records and financial statements showing the plaintiff\'s revenue patterns during comparable periods, used to calculate alleged damages.',
        dependencies: ['case-background', 'business-owner-plaintiff'],
        imageUrl: '',
        imageAltText: ''
      }
    ]
  },
  
  CRIMINAL_CASE: {
    id: 'criminal-case',
    name: 'Criminal Case',
    description: 'A criminal law scenario involving evidence analysis and witness testimony',
    components: [
      {
        type: COMPONENT_TYPES.GOALS,
        title: 'Learning Goals',
        content: 'Students will learn criminal procedure, evidence rules, constitutional protections, and the burden of proof in criminal cases. They will practice analyzing witness credibility and circumstantial evidence.',
        dependencies: []
      },
      {
        type: COMPONENT_TYPES.CASE,
        title: 'Case Background',
        content: 'A burglary case where the defendant is accused of breaking into a residential home while the owners were away. Evidence includes fingerprints, witness testimony, and security camera footage.',
        dependencies: []
      },
      {
        type: COMPONENT_TYPES.WITNESS,
        title: 'Neighbor Witness',
        content: 'A neighbor who claims to have seen someone matching the defendant\'s description near the victim\'s house on the night of the burglary.',
        dependencies: ['case-background']
      },
      {
        type: COMPONENT_TYPES.WITNESS,
        title: 'Police Detective',
        content: 'The investigating officer who processed the crime scene, collected fingerprint evidence, and conducted the initial suspect interview.',
        dependencies: ['case-background']
      },
      {
        type: COMPONENT_TYPES.DOCUMENT,
        title: 'Forensic Report',
        content: 'Laboratory analysis of fingerprints found at the scene, with comparison to the defendant\'s prints and conclusions about matches.',
        dependencies: ['case-background', 'police-detective'],
        imageUrl: '',
        imageAltText: ''
      },
      {
        type: COMPONENT_TYPES.DOCUMENT,
        title: 'Security Camera Footage',
        content: 'Video evidence from a nearby business security camera showing a figure near the victim\'s property, with analysis of timing and visual identification.',
        dependencies: ['case-background'],
        imageUrl: '',
        imageAltText: ''
      }
    ]
  },

  BUSINESS_ETHICS: {
    id: 'business-ethics',
    name: 'Business Ethics Dilemma',
    description: 'A corporate ethics case involving stakeholder conflicts and decision-making',
    components: [
      {
        type: COMPONENT_TYPES.GOALS,
        title: 'Learning Goals',
        content: 'Students will analyze ethical frameworks, stakeholder theory, and corporate social responsibility. They will practice ethical decision-making and understand the consequences of business decisions on various stakeholders.',
        dependencies: []
      },
      {
        type: COMPONENT_TYPES.CASE,
        title: 'Company Situation',
        content: 'A pharmaceutical company has developed a life-saving drug but faces pressure to price it affordably while recovering R&D costs and satisfying shareholders. Different stakeholders have conflicting interests.',
        dependencies: []
      },
      {
        type: COMPONENT_TYPES.WITNESS,
        title: 'CEO',
        content: 'The company CEO who must balance shareholder returns with public health concerns and regulatory pressures.',
        dependencies: ['company-situation']
      },
      {
        type: COMPONENT_TYPES.WITNESS,
        title: 'Patient Advocate',
        content: 'A healthcare advocate representing patients who need the medication but cannot afford high prices.',
        dependencies: ['company-situation']
      },
      {
        type: COMPONENT_TYPES.DOCUMENT,
        title: 'Financial Analysis',
        content: 'Company financial projections showing R&D costs, manufacturing expenses, and various pricing scenarios with their impact on profitability.',
        dependencies: ['company-situation', 'ceo'],
        imageUrl: '',
        imageAltText: ''
      },
      {
        type: COMPONENT_TYPES.DOCUMENT,
        title: 'Market Research',
        content: 'Analysis of patient demographics, insurance coverage patterns, and competitor pricing for similar medications.',
        dependencies: ['company-situation', 'patient-advocate'],
        imageUrl: '',
        imageAltText: ''
      }
    ]
  }
}

// Generate IDs for template components and set up dependencies
const processTemplate = (template) => {
  console.log('🔄 Processing template:', template.name)
  
  const componentMap = new Map()
  const processedComponents = []
  
  // First pass: create components with IDs
  template.components.forEach((comp, index) => {
    const component = createComponent(comp.type, comp.title, comp.content)
    
    // Create a mapping from title-based ID to actual ID for dependency resolution
    const titleId = comp.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
    componentMap.set(titleId, component.id)
    componentMap.set(comp.title, component.id)
    
    processedComponents.push({
      ...component,
      originalDependencies: comp.dependencies
    })
  })
  
  // Second pass: resolve dependencies
  processedComponents.forEach(component => {
    component.dependencies = component.originalDependencies.map(depTitle => {
      const titleId = depTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const resolvedId = componentMap.get(titleId) || componentMap.get(depTitle)
      
      if (!resolvedId) {
        console.warn('⚠️ Could not resolve dependency:', depTitle, 'for component:', component.title)
        return null
      }
      
      return resolvedId
    }).filter(id => id && id !== component.id) // Remove null values and self-references
    
    delete component.originalDependencies
  })
  
  console.log('✅ Template processed:', processedComponents.length, 'components')
  return processedComponents
}

// Load a template into the case file
export const loadTemplate = (templateId) => {
  console.log('📋 Loading template:', templateId)
  
  // Find template by ID (not object key)
  const template = Object.values(TEMPLATES).find(t => t.id === templateId)
  if (!template) {
    console.error('❌ Template not found:', templateId)
    console.log('Available template IDs:', Object.values(TEMPLATES).map(t => t.id))
    throw new Error(`Template not found: ${templateId}`)
  }
  
  const components = processTemplate(template)
  console.log('📋 Template loaded successfully:', components.length, 'components')
  return components
}

// Get all available templates
export const getAvailableTemplates = () => {
  return Object.values(TEMPLATES).map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    componentCount: template.components.length
  }))
}

// Validate template structure
export const validateTemplate = (template) => {
  const errors = []
  
  if (!template.id) errors.push('Template ID is required')
  if (!template.name) errors.push('Template name is required')
  if (!template.description) errors.push('Template description is required')
  if (!Array.isArray(template.components)) errors.push('Template components must be an array')
  
  if (template.components) {
    template.components.forEach((comp, index) => {
      if (!comp.type) errors.push(`Component ${index}: type is required`)
      if (!comp.title) errors.push(`Component ${index}: title is required`)
      if (!comp.content) errors.push(`Component ${index}: content is required`)
      if (!Array.isArray(comp.dependencies)) errors.push(`Component ${index}: dependencies must be an array`)
    })
  }
  
  return errors
}

console.log('✅ Template system loaded with', Object.keys(TEMPLATES).length, 'templates')