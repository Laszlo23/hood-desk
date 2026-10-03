import sdk from '@farcaster/miniapp-sdk'

let initialized = false
let isInMiniAppCached: boolean | null = null

export async function initFarcasterSDK(): Promise<void> {
  if (initialized) return
  initialized = true

  const inMiniApp = await sdk.isInMiniApp()
  isInMiniAppCached = inMiniApp

  if (inMiniApp) {
    await sdk.actions.ready()
  }
}

export async function isFarcasterContext(): Promise<boolean> {
  if (isInMiniAppCached !== null) {
    return isInMiniAppCached
  }
  
  const inMiniApp = await sdk.isInMiniApp()
  isInMiniAppCached = inMiniApp
  return inMiniApp
}

export { sdk }
