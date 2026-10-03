import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './lib/wagmi'
import { initFarcasterSDK } from './lib/farcaster'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

function RootApp() {
  useEffect(() => {
    initFarcasterSDK()
  }, [])

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RootApp />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
