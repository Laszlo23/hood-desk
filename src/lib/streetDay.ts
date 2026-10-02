/**
 * One day's Hood Street note, counted from the public @HoodStreetMini profile.
 * Update the posts when the day changes. Do not invent likes or a space transcript.
 */

/** The show site. The mini app URL only offers an app download outside Farcaster. */
export const GM_FARCASTER_APP = 'https://www.gmfarcaster.com/'

export const STREET_DAY = {
  readAt: '2026-10-02T12:00:00.000Z',
  profile: 'https://x.com/HoodStreetMini',
  line: 'Read again on 2 Oct. The mint page still says soon. The claim counts had not moved: 384 guaranteed, 1,054 first-come. The last titled HoodStreet Media room we can still open is Unvault alpha, ended 29 Sep.',
  spaceTitle: 'Unvault alpha',
  spaceWhen: '29 Sep 2026',
  spaceHref: 'https://x.com/i/spaces/1dxYlaOgyzYJX',
} as const

/** Distinct public posts used for the count. Welcome article kept once. */
const POSTS = [
  'ERROR 404. Back online. GTD and FCFS whitelist drop is live.',
  'Next shipment in 30 minutes. Whitelist shipments sell out. Spend Hood Bucks. GTD and FCFS.',
  'Never get high on your own supply unless it is Hood Street whitelist.',
  'Join the group chat for whitelist dealer alerts and X space vibes.',
  'Another honorary Mini for Adam Weitsman, a tribute on Hood Street.',
  'Hood morning. gm.',
  'Notifications on. Refresh for a surprise whitelist shipment.',
  'Whitelist dealer re-upped the stash.',
  'Everyone can claim 1,000 Hood Bucks and get ready for the next whitelist shipment. Tribute collections get a bonus.',
  'Sold out. Next whitelist shipment posted.',
  'Surprise whitelist shipment. Flash drop.',
  'The GTD packages got lost in transit. New whitelist shipment on the way.',
  'Whitelist shipment inbound. 20 GTD and 50 FCFS. Claim Hood Bucks.',
  'Wait for the whitelist dealer. Hood Bucks have no cash value.',
  'Tribute collections can claim Hood Bucks. Every NFT pays once.',
  'Welcome to Hood Street. 4,269 Minis, a free mint.',
  'Collabs open. A whitelist dealer will write back.',
  'Free mint soon. Party with Hood Street Minis.',
]

const TOPICS: { label: string; test: RegExp }[] = [
  { label: 'Whitelist', test: /whitelist|shipment/i },
  { label: 'Hood Bucks', test: /hood bucks/i },
  { label: 'Guaranteed', test: /\bgtd\b/i },
  { label: 'First come', test: /\bfcfs\b|first-come/i },
  { label: 'Tribute', test: /tribute|honorary/i },
  { label: 'Free mint', test: /free mint/i },
  { label: 'GM', test: /\bgm\b|hood morning/i },
  { label: 'Space', test: /space|group chat/i },
]

export const STREET_POST_COUNT = POSTS.length

export function streetTalk(): { label: string; count: number }[] {
  return TOPICS.map((topic) => ({
    label: topic.label,
    count: POSTS.filter((post) => topic.test.test(post)).length,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function gmCastUrl(): string {
  const text = `gm\n\n${STREET_DAY.line}\n\nhttps://doghood.aibusiness.fun/#/blog`
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
}
