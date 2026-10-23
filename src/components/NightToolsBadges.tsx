import { useState, useEffect } from 'react'
import './NightToolsBadges.css'

type BadgeType = 'lantern' | 'pick' | 'vein'

type BadgeStatus = {
  lantern: boolean
  pick: boolean
  vein: boolean
}

type Props = {
  address: string | null
}

export function NightToolsBadges({ address }: Props) {
  const [badgeStatus, setBadgeStatus] = useState<BadgeStatus>({
    lantern: false,
    pick: false,
    vein: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setBadgeStatus({ lantern: false, pick: false, vein: false })
      setLoading(false)
      return
    }

    let live = true
    setLoading(true)

    // TODO: Replace with actual API call to night ledger
    // For now, mock the response - all badges are unclaimed
    fetch(`/api/night-tools/status?address=${address}`)
      .then((res) => res.json())
      .then((data) => {
        if (live) {
          setBadgeStatus({
            lantern: data.lantern ?? false,
            pick: data.pick ?? false,
            vein: data.vein ?? false,
          })
          setLoading(false)
        }
      })
      .catch(() => {
        if (live) {
          // On error, assume no badges earned
          setBadgeStatus({ lantern: false, pick: false, vein: false })
          setLoading(false)
        }
      })

    return () => {
      live = false
    }
  }, [address])

  if (!address) {
    return null
  }

  return (
    <div className="night-tools-badges">
      <h3 className="night-tools-title">Night Tools</h3>
      <p className="night-tools-subtitle">1/1 cosmetic badges earned on the street</p>
      <div className="night-tools-grid">
        <Badge type="lantern" earned={badgeStatus.lantern} loading={loading} />
        <Badge type="pick" earned={badgeStatus.pick} loading={loading} />
        <Badge type="vein" earned={badgeStatus.vein} loading={loading} />
      </div>
      <p className="night-tools-note">
        These are 1/1 badges. Once found by the first eligible wallet, they cannot be earned by anyone else.
      </p>
    </div>
  )
}

type BadgeProps = {
  type: BadgeType
  earned: boolean
  loading: boolean
}

function Badge({ type, earned, loading }: BadgeProps) {
  const badges = {
    lantern: {
      name: 'Lantern',
      description: 'First wallet with 7-day Vienna check-in streak',
      image: '/images/night-tools/lantern.jpg',
    },
    pick: {
      name: 'Pick',
      description: 'First wallet to dig with a neighbor',
      image: '/images/night-tools/pick.jpg',
    },
    vein: {
      name: 'Vein',
      description: 'Single first wallet that checks in with Lantern (only one ever)',
      image: '/images/night-tools/vein.jpg',
    },
  }

  const badge = badges[type]

  return (
    <div className={`night-tool-badge ${earned ? 'earned' : 'unearned'} ${loading ? 'loading' : ''}`}>
      <div className="badge-image-container">
        <img
          src={badge.image}
          alt={earned ? `${badge.name} - Found` : `${badge.name} - Not found`}
          className="badge-image"
        />
        {!earned && <div className="badge-overlay" />}
      </div>
      <div className="badge-info">
        <span className="badge-name">{badge.name}</span>
        <span className="badge-supply">1/1</span>
      </div>
      <p className="badge-description">{badge.description}</p>
      {!earned && <span className="badge-status">Not found</span>}
    </div>
  )
}
