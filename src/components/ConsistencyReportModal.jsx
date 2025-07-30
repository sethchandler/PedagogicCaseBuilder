import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Copy, Eye, Check, XCircle, FileText, FileSpreadsheet, FileJson, Minus, Maximize } from 'lucide-react';
import useStore from '../store';
import { exportConsistencyReport } from '../services/consistencyAnalysis';

console.log('🎯 Loading ConsistencyReportModal component...');

const ConsistencyReportModal = () => {
  const { consistencyReport, actions } = useStore();
  const [exportFormat, setExportFormat] = useState('markdown');
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  
  if (!consistencyReport || !consistencyReport.showModal) {
    return null;
  }
  
  const { inconsistencies, analyzedAt } = consistencyReport;
  
  // Drag functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep modal within viewport bounds
      const maxX = window.innerWidth - (modalRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (modalRef.current?.offsetHeight || 0);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  
  const handleDragStart = (e) => {
    if (!modalRef.current) return;
    
    setIsDragging(true);
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  const handleExport = async () => {
    console.log('📤 Exporting consistency report as:', exportFormat);
    
    try {
      const content = exportConsistencyReport(inconsistencies, exportFormat);
      
      const fileExtension = {
        markdown: 'md',
        csv: 'csv',
        json: 'json'
      }[exportFormat];
      
      const fileName = `consistency-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      // Use File System Access API if available
      if ('showSaveFilePicker' in window) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: `${exportFormat.toUpperCase()} files`,
            accept: {
              [`text/${exportFormat === 'markdown' ? 'markdown' : exportFormat}`]: [`.${fileExtension}`]
            }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
        actions.addNotification('Report exported successfully!', 'success');
      } else {
        // Fallback to download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        actions.addNotification('Report downloaded successfully!', 'success');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Export failed:', error);
        actions.addNotification('Failed to export report', 'error');
      }
    }
  };
  
  const handleCopyFix = (fix) => {
    navigator.clipboard.writeText(fix);
    actions.addNotification('Fix copied to clipboard', 'success');
  };
  
  const handleViewComponent = (componentTitle) => {
    // Find component by title (fuzzy match)
    const components = Array.from(useStore.getState().caseFile.values());
    const component = components.find(c => 
      c.title.toLowerCase().includes(componentTitle.toLowerCase()) ||
      componentTitle.toLowerCase().includes(c.title.toLowerCase())
    );
    
    if (component) {
      actions.setCurrentComponent(component.id);
      actions.addNotification(`Navigated to ${component.title}`, 'info');
    } else {
      actions.addNotification(`Could not find component: ${componentTitle}`, 'warning');
    }
  };
  
  const pendingCount = inconsistencies.filter(i => i.status === 'pending').length;
  const resolvedCount = inconsistencies.filter(i => i.status === 'resolved').length;
  const dismissedCount = inconsistencies.filter(i => i.status === 'dismissed').length;
  
  // Minimized view
  if (isMinimized) {
    return (
      <div 
        className="fixed bg-white rounded-lg shadow-lg border border-gray-300 p-3 cursor-pointer z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          minWidth: '200px'
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center space-x-2">
          <Maximize size={16} className="text-gray-600" />
          <span className="text-sm font-medium">Consistency Report</span>
          <span className="text-xs text-gray-500">({inconsistencies.length} issues)</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" style={{ pointerEvents: 'auto' }}>
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col absolute"
        style={{
          left: position.x === 0 && position.y === 0 ? '50%' : `${position.x}px`,
          top: position.y === 0 && position.x === 0 ? '5%' : `${position.y}px`,
          transform: position.x === 0 && position.y === 0 ? 'translateX(-50%)' : 'none'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-200 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Consistency Analysis Report
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Found {inconsistencies.length} potential inconsistencies
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Minimize"
            >
              <Minus size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                actions.closeConsistencyReport();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center space-x-6 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Pending: {pendingCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Resolved: {resolvedCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-700">Dismissed: {dismissedCount}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {inconsistencies.map((issue, index) => (
              <div
                key={issue.id}
                className={`border rounded-lg p-4 ${
                  issue.status === 'resolved' ? 'bg-green-50 border-green-200' :
                  issue.status === 'dismissed' ? 'bg-gray-50 border-gray-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">
                      {index + 1}. {issue.nature}
                    </span>
                    {issue.status === 'resolved' && (
                      <Check className="text-green-600" size={20} />
                    )}
                    {issue.status === 'dismissed' && (
                      <XCircle className="text-gray-600" size={20} />
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    issue.status === 'resolved' ? 'bg-green-200 text-green-800' :
                    issue.status === 'dismissed' ? 'bg-gray-200 text-gray-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {issue.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Sources: </span>
                    <span className="text-gray-600">{issue.sources.join(', ')}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Issue: </span>
                    <span className="text-gray-600">{issue.nature}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Suggested Fix: </span>
                    <span className="text-gray-600">{issue.suggestedFix}</span>
                  </div>
                </div>
                
                {issue.status === 'pending' && (
                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={() => handleCopyFix(issue.suggestedFix)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Copy size={14} />
                      <span>Copy Fix</span>
                    </button>
                    
                    {issue.sources.map((source, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleViewComponent(source)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <Eye size={14} />
                        <span>View {source.split(' ')[0]}...</span>
                      </button>
                    ))}
                    
                    <button
                      onClick={() => actions.updateConsistencyStatus(issue.id, 'resolved')}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Check size={14} />
                      <span>Mark Resolved</span>
                    </button>
                    
                    <button
                      onClick={() => actions.updateConsistencyStatus(issue.id, 'dismissed')}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <XCircle size={14} />
                      <span>Dismiss</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-700">Export as:</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="markdown">Markdown</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download size={16} />
              <span>Export Report</span>
            </button>
          </div>
          
          <button
            onClick={() => actions.closeConsistencyReport()}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsistencyReportModal;