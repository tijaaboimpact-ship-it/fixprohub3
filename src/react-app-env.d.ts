/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="vite/client" />

declare namespace NodeJS {
  interface Process{
    env: ProcessEnv
  }
  interface ProcessEnv {
    /**
     * By default, there are two modes in Vite:
     * 
     * * `development` is used by vite and vite serve
     * * `production` is used by vite build
     * 
     * You can overwrite the default mode used for a command by passing the --mode option flag.
     * 
     */
    readonly NODE_ENV: 'development' | 'production'
  }
}

declare var process: NodeJS.Process

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.webp' {
    const src: string
    export default src
}

declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.FunctionComponent<React.SVGProps<
    SVGSVGElement
  > & { title?: string }>

  const src: string;
  export default src
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string }
  export default classes
}

interface Window {
  electronAPI?: {
    // MediaTek
    mtkCheck?: () => void
    mtkDetect?: () => void
    mtkFlash?: (partition: string, filePath: string, da: string, scatter?: string) => void
    onMtkEvent?: (callback: (payload: any) => void) => void
    
    // Qualcomm
    edlCheck?: () => void
    edlDetect?: () => void
    edlReadInfo?: (loader: string) => void
    edlFlash?: (partition: string, filePath: string, loader: string) => void
    edlPartitions?: (loader: string) => void
    onEdlEvent?: (callback: (payload: any) => void) => void
    
    // Samsung
    samsungCheck?: () => void
    samsungDetect?: () => void
    samsungFlash?: (files: { bl: string; ap: string; cp: string; csc: string }) => void
    onSamsungEvent?: (callback: (payload: any) => void) => void
    
    // FRP
    runFrp?: (vendor: string, mode: string) => void
    onFrpEvent?: (callback: (payload: any) => void) => void
    
    // Unlock
    runUnlock?: (method: string) => void
    onUnlockEvent?: (callback: (payload: any) => void) => void
    
    // Flash
    flashDevice: (partition: string, file: string, loader?: string) => void
    onFlashEvent: (callback: (payload: { type: string; data: string | number }) => void) => void
    
    // Device Read
    readDevice: (comPort: string) => void
    onReadResult: (callback: (payload: { success: boolean; data?: Record<string, string>; error?: string }) => void) => void
    
    // General
    removeAllListeners: (channel: string) => void
  }
}
