/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional Robinhood Chain RPC override */
  readonly VITE_RH_RPC?: string
  /** WalletConnect Cloud project id */
  readonly VITE_WC_PROJECT_ID?: string
  /** Optional $HOOD ERC-20 address on RH 4663 */
  readonly VITE_HOOD_TOKEN?: string
  /** DogiHood ERC-721 on RH 4663 (featured pack NFT) */
  readonly VITE_DOGIHOOD_NFT?: string
  /** Hood Seeder ERC-721 after contracts/hood-seeder is deployed */
  readonly VITE_HOOD_SEEDER_NFT?: string
  /** Inner Circle soulbound badge after contracts/inner-circle is deployed */
  readonly VITE_INNER_CIRCLE_SBT?: string
  /** Stripe publishable key (pk_test_… / pk_live_…) */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  readonly VITE_STRIPE_PRICE_STARTER?: string
  readonly VITE_STRIPE_PRICE_DESK?: string
  readonly VITE_STRIPE_PRICE_DESK_PLUS?: string
  /** Optional USD monthly display overrides */
  readonly VITE_PRICE_STARTER?: string
  readonly VITE_PRICE_DESK?: string
  readonly VITE_PRICE_DESK_PLUS?: string
  /** Optional Stripe API base (default /api) */
  readonly VITE_STRIPE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  ethereum?: unknown
}
