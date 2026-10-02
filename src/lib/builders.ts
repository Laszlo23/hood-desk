export type DeskBuild = {
  id: string
  at: string
  name: string
  work: string
  forWhom: string
  link: string
  maker: string | null
}

export type BuildInput = {
  name: string
  work: string
  forWhom: string
  link: string
  maker: string | null
  pledge: boolean
}

export function buildBar(input: BuildInput): string | null {
  if (input.name.trim().length < 2) return 'Give the project a name.'
  if (input.work.trim().length < 80) {
    return 'Say what you built, in at least a few sentences. A ticker is not a project.'
  }
  if (input.forWhom.trim().length < 20) return 'Say who this is for.'
  try {
    const url = new URL(input.link.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'Add a real http or https link to the work.'
  } catch {
    return 'Add a real http or https link to the work.'
  }
  if (!input.pledge) return 'A listed project agrees to one mint, no tax, and no promise of profit.'
  return null
}

export async function fetchBuilds(): Promise<DeskBuild[]> {
  const res = await fetch('/api/builders')
  if (!res.ok) throw new Error('The builder list did not load.')
  const data = (await res.json()) as { projects?: DeskBuild[] }
  return Array.isArray(data.projects) ? data.projects : []
}

export async function publishBuild(input: BuildInput): Promise<DeskBuild> {
  const problem = buildBar(input)
  if (problem) throw new Error(problem)
  const res = await fetch('/api/builders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json()) as { error?: string; project?: DeskBuild }
  if (!res.ok || !data.project) throw new Error(data.error || 'The desk did not list this project.')
  return data.project
}
