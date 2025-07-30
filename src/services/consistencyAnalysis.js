import { callOpenAI } from './openai';
import { getActivePrompt } from '../utils/consistencyPrompts';

console.log('🔍 Loading consistency analysis service...');

// Format case file content for analysis
export const formatCaseFileForAnalysis = (caseFile) => {
  console.log('📄 Formatting case file for consistency analysis...');
  
  const components = Array.from(caseFile.values());
  let formattedContent = '';
  
  // Group by type for better organization
  const componentsByType = {
    GOALS: [],
    CASE: [],
    WITNESS: [],
    DOCUMENT: []
  };
  
  components.forEach(comp => {
    if (componentsByType[comp.type]) {
      componentsByType[comp.type].push(comp);
    }
  });
  
  // Format learning goals
  if (componentsByType.GOALS.length > 0) {
    formattedContent += '## LEARNING GOALS\n\n';
    componentsByType.GOALS.forEach(comp => {
      formattedContent += `### ${comp.title}\n`;
      if (comp.userInput) formattedContent += `User Input: ${comp.userInput}\n`;
      if (comp.aiGeneratedContent) formattedContent += `\n${comp.aiGeneratedContent}\n`;
      formattedContent += '\n---\n\n';
    });
  }
  
  // Format case description
  if (componentsByType.CASE.length > 0) {
    formattedContent += '## CASE DESCRIPTION\n\n';
    componentsByType.CASE.forEach(comp => {
      formattedContent += `### ${comp.title}\n`;
      if (comp.userInput) formattedContent += `User Input: ${comp.userInput}\n`;
      if (comp.aiGeneratedContent) formattedContent += `\n${comp.aiGeneratedContent}\n`;
      formattedContent += '\n---\n\n';
    });
  }
  
  // Format witness testimonies
  if (componentsByType.WITNESS.length > 0) {
    formattedContent += '## WITNESS TESTIMONIES\n\n';
    componentsByType.WITNESS.forEach(comp => {
      formattedContent += `### ${comp.title}\n`;
      if (comp.userInput) formattedContent += `User Input: ${comp.userInput}\n`;
      if (comp.aiGeneratedContent) formattedContent += `\n${comp.aiGeneratedContent}\n`;
      formattedContent += '\n---\n\n';
    });
  }
  
  // Format documents
  if (componentsByType.DOCUMENT.length > 0) {
    formattedContent += '## DOCUMENTS\n\n';
    componentsByType.DOCUMENT.forEach(comp => {
      formattedContent += `### ${comp.title}\n`;
      if (comp.userInput) formattedContent += `User Input: ${comp.userInput}\n`;
      if (comp.aiGeneratedContent) formattedContent += `\n${comp.aiGeneratedContent}\n`;
      formattedContent += '\n---\n\n';
    });
  }
  
  console.log('✅ Case file formatted, length:', formattedContent.length);
  return formattedContent;
};

// Parse markdown table from AI response
export const parseConsistencyTable = (markdownResponse) => {
  console.log('📊 Parsing consistency analysis response...');
  
  const inconsistencies = [];
  
  try {
    // Find the table in the response
    const tableMatch = markdownResponse.match(/\|[\s\S]*?\|[\s\S]*?\|[\s\S]*?\|[\s\S]*?(?=\n\n|$)/);
    if (!tableMatch) {
      console.error('❌ No table found in response');
      return inconsistencies;
    }
    
    const tableText = tableMatch[0];
    const rows = tableText.split('\n').filter(row => row.trim() && !row.includes('---|'));
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split('|').filter(cell => cell.trim());
      
      if (cells.length >= 3) {
        // Clean up HTML breaks and extra whitespace
        const sources = cells[0].replace(/<br>/g, '\n').trim().split('\n')
          .map(s => s.replace(/^\d+\.\s*/, '').trim())
          .filter(s => s);
        
        inconsistencies.push({
          id: `issue-${Date.now()}-${i}`,
          sources: sources,
          nature: cells[1].trim(),
          suggestedFix: cells[2].trim(),
          status: 'pending' // pending, resolved, dismissed
        });
      }
    }
    
    console.log('✅ Parsed', inconsistencies.length, 'inconsistencies');
  } catch (error) {
    console.error('❌ Error parsing table:', error);
  }
  
  return inconsistencies;
};

// Run consistency analysis
export const analyzeConsistency = async (caseFile) => {
  console.log('🤖 Starting consistency analysis...');
  
  // Format the case file
  const formattedContent = formatCaseFileForAnalysis(caseFile);
  
  if (!formattedContent || formattedContent.trim().length === 0) {
    throw new Error('No content to analyze. Please add some components with content first.');
  }
  
  // Get the active prompt
  const prompt = getActivePrompt();
  
  // Combine prompt with case content
  const fullPrompt = prompt.replace('[CASE FILE CONTENT FOLLOWS]', formattedContent);
  
  try {
    // Call OpenAI
    const response = await callOpenAI(fullPrompt, {
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 2000 // Enough for a detailed table
    });
    
    // Parse the response
    const inconsistencies = parseConsistencyTable(response);
    
    return {
      success: true,
      inconsistencies,
      rawResponse: response,
      analyzedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Consistency analysis failed:', error);
    throw error;
  }
};

// Export consistency report in various formats
export const exportConsistencyReport = (inconsistencies, format = 'markdown') => {
  console.log('📤 Exporting consistency report as:', format);
  
  const timestamp = new Date().toISOString();
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  
  switch (format) {
    case 'markdown':
      return exportAsMarkdown(inconsistencies, date, time);
    case 'csv':
      return exportAsCSV(inconsistencies, timestamp);
    case 'json':
      return exportAsJSON(inconsistencies, timestamp);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
};

const exportAsMarkdown = (inconsistencies, date, time) => {
  let markdown = `# Pedagogic Case Consistency Report\n`;
  markdown += `Generated: ${date} ${time}\n\n`;
  
  // Summary
  const resolved = inconsistencies.filter(i => i.status === 'resolved').length;
  const pending = inconsistencies.filter(i => i.status === 'pending').length;
  const dismissed = inconsistencies.filter(i => i.status === 'dismissed').length;
  
  markdown += `## Summary\n`;
  markdown += `- Total Issues Found: ${inconsistencies.length}\n`;
  markdown += `- Resolved: ${resolved}\n`;
  markdown += `- Pending: ${pending}\n`;
  markdown += `- Dismissed: ${dismissed}\n\n`;
  
  // Inconsistencies
  markdown += `## Inconsistencies\n\n`;
  
  inconsistencies.forEach((issue, index) => {
    const statusIcon = issue.status === 'resolved' ? '✅' : 
                      issue.status === 'dismissed' ? '❌' : '⚠️';
    
    markdown += `### ${index + 1}. ${statusIcon} ${issue.nature} (${issue.status})\n`;
    markdown += `**Sources:** ${issue.sources.join(', ')}\n`;
    markdown += `**Issue:** ${issue.nature}\n`;
    markdown += `**Suggested Fix:** ${issue.suggestedFix}\n`;
    
    if (issue.status === 'resolved') {
      markdown += `**Resolution:** Fixed at ${new Date().toLocaleTimeString()}\n`;
    }
    
    markdown += `\n`;
  });
  
  return markdown;
};

const exportAsCSV = (inconsistencies, timestamp) => {
  let csv = 'Issue #,Status,Sources,Nature of Inconsistency,Suggested Fix\n';
  
  inconsistencies.forEach((issue, index) => {
    const sources = issue.sources.join('; ');
    const nature = issue.nature.replace(/"/g, '""'); // Escape quotes
    const fix = issue.suggestedFix.replace(/"/g, '""');
    
    csv += `${index + 1},"${issue.status}","${sources}","${nature}","${fix}"\n`;
  });
  
  return csv;
};

const exportAsJSON = (inconsistencies, timestamp) => {
  return JSON.stringify({
    report: {
      generatedAt: timestamp,
      summary: {
        total: inconsistencies.length,
        resolved: inconsistencies.filter(i => i.status === 'resolved').length,
        pending: inconsistencies.filter(i => i.status === 'pending').length,
        dismissed: inconsistencies.filter(i => i.status === 'dismissed').length
      },
      inconsistencies: inconsistencies
    }
  }, null, 2);
};