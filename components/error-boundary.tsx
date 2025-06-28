"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // 在生产环境中，这里应该发送错误到监控服务
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 可以在这里集成错误监控服务如Sentry
    // Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-800">
            应用出现错误
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            抱歉，应用遇到了意外错误。请尝试刷新页面或重新开始。
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left bg-gray-50 p-3 rounded-lg text-sm">
              <summary className="cursor-pointer font-medium text-red-600 mb-2">
                错误详情 (开发模式)
              </summary>
              <pre className="whitespace-pre-wrap text-red-700 overflow-auto max-h-32">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={resetError}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              刷新页面
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            如果问题持续存在，请联系技术支持
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// 用于特定场景的错误边界包装器
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={DefaultErrorFallback}>
      {children}
    </ErrorBoundary>
  )
}

// 用于组件级别的错误边界
export function ComponentErrorBoundary({ 
  children, 
  fallback,
  name
}: { 
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  name?: string
}) {
  const componentFallback = fallback || (({ resetError }: ErrorFallbackProps) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-2 text-red-600 mb-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium">
          {name ? `${name}组件` : '组件'}加载失败
        </span>
      </div>
      <p className="text-sm text-red-600 mb-3">
        该组件遇到错误，请尝试重新加载
      </p>
      <Button onClick={resetError} size="sm" variant="outline">
        重试
      </Button>
    </div>
  ))

  return (
    <ErrorBoundary fallback={componentFallback}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary