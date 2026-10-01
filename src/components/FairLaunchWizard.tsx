import { useState } from 'react'
import { isAddress } from 'viem'
import {
  DEFAULT_DECIMALS,
  DEFAULT_SUPPLY,
  FAIR_LAUNCH_COPY,
  saveFairLaunchDraft,
  setProjectTokenAddress,
  updateProject,
  type Project,
} from '../lib/projects'
import { registerTokenCreator } from '../lib/rewards/ledger'
import { awardXp } from '../lib/gamification'
import { VerifiedBadge } from './VerifiedBadge'
import { explorerVerifyUrl } from '../lib/verify/onchainVerified'
import { EXPLORER_BASE } from '../lib/chain'

type Props = {
  project: Project
  address?: string | null
  onUpdated: (p: Project) => void
  onClose: () => void
}

type Step = 'configure' | 'review' | 'deploy'

export function FairLaunchWizard({ project, address, onUpdated, onClose }: Props) {
  const existing = project.fairLaunch
  const [step, setStep] = useState<Step>('configure')
  const [name, setName] = useState(existing?.name || project.name)
  const [symbol, setSymbol] = useState(existing?.symbol || project.ticker || '')
  const [supply, setSupply] = useState(existing?.supply || DEFAULT_SUPPLY)
  const [decimals] = useState(existing?.decimals || DEFAULT_DECIMALS)
  const [pasteAddr, setPasteAddr] = useState(existing?.tokenAddress || '')
  const [iAmCreator, setIAmCreator] = useState(true)
  const [creatorAddr, setCreatorAddr] = useState(
    existing?.creatorAddress || project.creatorAddress || address || '',
  )
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const resolvedCreator = (): string => {
    if (iAmCreator && address && isAddress(address)) return address.toLowerCase()
    const c = creatorAddr.trim()
    if (c && isAddress(c)) return c.toLowerCase()
    if (c) return c
    return address && isAddress(address) ? address.toLowerCase() : 'anon'
  }

  const cfg = () => ({
    name,
    symbol,
    supply,
    decimals,
    creatorAddress: resolvedCreator(),
  })

  const saveDraft = () => {
    const updated = saveFairLaunchDraft(project.id, cfg(), address)
    if (!updated) {
      setErr('Could not save draft.')
      return
    }
    onUpdated(updated)
    setMsg('Draft saved. A token is live only after you deploy it and paste the address.')
    setStep('review')
  }

  const pasteDeployed = () => {
    const updated = setProjectTokenAddress(project.id, pasteAddr, address)
    if (!updated) {
      setErr('Invalid address — paste a 0x… deployed contract.')
      return
    }
    // Re-apply creator onto fair launch via second update path: register index
    const creator = resolvedCreator()
    registerTokenCreator({
      tokenAddress: pasteAddr.trim(),
      tokenSymbol: updated.fairLaunch?.symbol || symbol || 'TOKEN',
      creatorAddress: creator,
      projectId: updated.id,
      projectName: updated.name,
    })
    const withCreator =
      updateProject(
        updated.id,
        {
          creatorAddress: creator,
          fairLaunch: updated.fairLaunch
            ? { ...updated.fairLaunch, creatorAddress: creator }
            : updated.fairLaunch,
        },
        address,
      ) ?? updated
    onUpdated(withCreator)
    awardXp('create_project', { once: false })
    setMsg(
      'tokenAddress saved · creator registered for demo rewards. Set VITE_HOOD_TOKEN for desk-wide $HOOD if this is HOOD.',
    )
    setErr('')
  }

  return (
    <div className="card wizard-card">
      <div className="row-between">
        <div>
          <p className="eyebrow">Fair launch</p>
          <h2>Launch fair token</h2>
          <p className="muted small">{FAIR_LAUNCH_COPY}</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="wizard-steps" aria-label="Wizard steps">
        {(['configure', 'review', 'deploy'] as Step[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`wizard-step${step === s ? ' active' : ''}`}
            onClick={() => setStep(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {step === 'configure' && (
        <div className="wizard-body">
          <label className="field">
            <span className="rail-label">Token name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span className="rail-label">Symbol</span>
            <input
              className="input"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </label>
          <label className="field">
            <span className="rail-label">Fixed supply (default 1B like Hood.sol)</span>
            <input className="input" value={supply} onChange={(e) => setSupply(e.target.value)} />
          </label>
          <label className="check-row mt">
            <input
              type="checkbox"
              checked={iAmCreator}
              onChange={(e) => setIAmCreator(e.target.checked)}
            />
            <span>
              I am creator — credit my wallet for demo trade rewards
              {address ? ` (${address.slice(0, 6)}…)` : ' (connect wallet)'}
            </span>
          </label>
          {!iAmCreator && (
            <label className="field">
              <span className="rail-label">creatorAddress</span>
              <input
                className="input"
                value={creatorAddr}
                onChange={(e) => setCreatorAddr(e.target.value)}
                placeholder="0x… or handle"
              />
            </label>
          )}
          <p className="muted small">
            Decimals fixed at {decimals}. No team mint after deploy. No transfer tax. Rewards know who
            on the project after you paste a deployed contract.
          </p>
          <div className="cta-row">
            <button type="button" className="btn btn-primary" onClick={saveDraft}>
              Save & review →
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="wizard-body">
          <ul className="spec-list">
            <li>
              <span className="rail-label">Name / symbol</span>
              <span>
                {name} / ${symbol || '—'}
              </span>
            </li>
            <li>
              <span className="rail-label">Supply</span>
              <span>
                {supply} · {decimals} decimals · mint-once
              </span>
            </li>
            <li>
              <span className="rail-label">Creator (rewards)</span>
              <span className="mono tiny">{resolvedCreator()}</span>
            </li>
            <li>
              <span className="rail-label">Fair launch</span>
              <span>{FAIR_LAUNCH_COPY}</span>
            </li>
            <li>
              <span className="rail-label">Unfair allocations</span>
              <span>None — UI does not offer team/insider splits</span>
            </li>
          </ul>
          <div className="cta-row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep('configure')}>
              ← Configure
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setStep('deploy')}>
              Paste a deployed address →
            </button>
          </div>
        </div>
      )}

      {step === 'deploy' && (
        <div className="wizard-body">
          <div className="demo-banner">
            <strong>Deploy from your machine, then paste the contract.</strong> The desk does not
            mint a stand-in token.
          </div>

          <pre className="code-block">{`cd /Users/poker.vibe/Desktop/hood-token
# fill .env locally — never commit PRIVATE_KEY
forge script script/DeployHood.s.sol:DeployHood \\
  --rpc-url "$RPC_URL" --broadcast --chain-id 4663
# then paste the address below (or set VITE_HOOD_TOKEN for desk $HOOD)`}</pre>

          <label className="field">
            <span className="rail-label">Paste deployed tokenAddress</span>
            <input
              className="input"
              value={pasteAddr}
              onChange={(e) => setPasteAddr(e.target.value)}
              placeholder="0x…"
            />
          </label>
          <p className="tiny muted">Saving stores the deployed contract on this project.</p>
          <div className="cta-row">
            <button type="button" className="btn btn-primary" onClick={pasteDeployed}>
              Save tokenAddress
            </button>
          </div>

          <div className="mt verify-checklist-box">
            <p className="rail-label">Verify contract on explorer</p>
            <p className="muted small">
              After forge deploy, verify the contract on{' '}
              <a href={EXPLORER_BASE} target="_blank" rel="noreferrer">
                Robinhood Blockscout
              </a>{' '}
              (RH 4663). Green checkmarks appear on Trade / Projects / Rewards only when verified.
            </p>
            {pasteAddr.trim().startsWith('0x') && pasteAddr.trim().length === 42 ? (
              <div className="cta-row mt token-name-row">
                <span className="mono tiny">${symbol || 'TOKEN'}</span>
                <VerifiedBadge address={pasteAddr.trim()} />
                <a
                  className="btn btn-ghost btn-sm"
                  href={explorerVerifyUrl(pasteAddr.trim())}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open verify tab →
                </a>
              </div>
            ) : (
              <p className="tiny muted mt">Paste a tokenAddress to check / mark verification.</p>
            )}
          </div>

          <div className="mt">
            <p className="rail-label">LP step = checklist TODO</p>
            <p className="muted small">
              Do not invent DEX routers. Confirm which AMM is live on RH 4663 before creating LP.
            </p>
          </div>
        </div>
      )}

      {msg && <p className="ok-line mt">{msg}</p>}
      {err && <p className="err-line form-err mt">{err}</p>}
    </div>
  )
}
