import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

console.log('🎯 Loading ErrorBoundary component...')

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    console.error('🚨 Error boundary caught error:', error)
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error boundary details:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // Log error to console for debugging
    console.group('🚨 Application Error')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()
  }

  handleRetry = () => {
    console.log('🔄 Attempting error recovery...')
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReload = () => {
    console.log('🔄 Reloading application...')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Message */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error. Your work has been auto-saved.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>

            {/* Development Error Details */}
            {isDevelopment && this.state.error && (
              <details className="mt-6 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <div className="text-xs font-mono text-gray-600 space-y-2">
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-1 text-red-600 whitespace-pre-wrap">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-gray-500 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <strong>Retry Count:</strong> {this.state.retryCount}
                  </div>
                </div>
              </details>
            )}

            {/* Recovery Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Recovery Tips
              </h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Your work is automatically saved to your browser</li>
                <li>• Try refreshing the page if the error persists</li>
                <li>• Clear your browser cache if problems continue</li>
                <li>• Check your internet connection for API-related errors</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary