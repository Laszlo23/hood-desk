import sdk from '@farcaster/frame-sdk'

let initialized = false
let readyCalled = false

export function initFarcasterSDK(): void {
  if (initialized) return
  initialized = true

  sdk.actions.ready()
  readyCalled = true
}

export function isFarcasterContext(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    return sdk.context !== null
  } catch {
    return false
  }
}

export function isReadyCalled(): boolean {
  return readyCalled
}

export { sdk }
