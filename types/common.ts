// 通用类型定义

// API响应类型
export interface APIResponse<T = any> {
  data?: T
  error?: string
  code?: string
  message?: string
  success?: boolean
}

// 错误类型
export interface ErrorInfo {
  message: string
  code?: string
  statusCode?: number
  details?: Record<string, any>
}

// 设备信息类型
export interface DeviceInfo {
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  isHTTPS: boolean
  userAgent?: string
}

// 录音状态类型
export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  isSupported: boolean
  error: string | null
}

// 音频级别类型
export interface AudioLevel {
  current: number
  average: number
  peak: number
}

// 权限状态类型
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown'

// 组件状态类型
export interface ComponentState {
  loading: boolean
  error: string | null
  data: any
}

// 通用回调函数类型
export type CallbackFunction<T = void> = (result?: T) => void
export type ErrorCallback = (error: string | Error) => void
export type SuccessCallback<T = any> = (data: T) => void

// 异步操作状态
export interface AsyncState<T = any> {
  loading: boolean
  error: string | null
  data: T | null
  success: boolean
}

// 表单验证结果
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

// 分页信息
export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// 时间戳类型
export type Timestamp = string | number | Date

// 颜色主题类型
export type ThemeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

// 组件尺寸类型
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// 加载状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// 模态框状态
export interface ModalState {
  isOpen: boolean
  title?: string
  content?: string
  onClose?: () => void
  onConfirm?: () => void
}

// 通知类型
export interface NotificationOptions {
  title: string
  message?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  persistent?: boolean
  onClose?: () => void
}