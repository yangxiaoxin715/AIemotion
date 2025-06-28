// 语音识别API类型定义

export interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly [index: number]: SpeechRecognitionAlternative
  readonly length: number
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

export interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult
  readonly length: number
}

export interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
  readonly resultIndex: number
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: 
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported'
  readonly message?: string
}

export interface SpeechRecognition extends EventTarget {
  // 属性
  continuous: boolean
  grammars: SpeechGrammarList
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string

  // 事件处理器
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null

  // 方法
  abort(): void
  start(): void
  stop(): void
}

export interface SpeechGrammarList {
  readonly length: number
  addFromString(string: string, weight?: number): void
  addFromURI(src: string, weight?: number): void
  item(index: number): SpeechGrammar
  [index: number]: SpeechGrammar
}

export interface SpeechGrammar {
  src: string
  weight: number
}

// 全局声明
declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition
      new(): SpeechRecognition
    }
    webkitSpeechRecognition: {
      prototype: SpeechRecognition
      new(): SpeechRecognition
    }
    SpeechGrammarList: {
      prototype: SpeechGrammarList
      new(): SpeechGrammarList
    }
    webkitSpeechGrammarList: {
      prototype: SpeechGrammarList
      new(): SpeechGrammarList
    }
  }
}