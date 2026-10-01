/**
 * Writes Hood Seeder token metadata for ids 1..3333.
 * tokenURI is {base}/<id>.json on the live desk.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'public/nfts/hood-seeder')
const arts = ['1.svg', '42.svg', '100.svg']
const max = 3333

mkdirSync(dir, { recursive: true })

for (let id = 1; id <= max; id++) {
  const art = arts[(id - 1) % arts.length]
  const meta = {
    name: `Hood Seeder #${id}`,
    description:
      'Early supporter pass for Hood Desk on Robinhood Chain. Forest fox, #CCFF00. The claim drip stays off until the desk enables it.',
    image: `https://doghood.aibusiness.fun/nfts/hood-seeder/${art}`,
    attributes: [
      { trait_type: 'Role', value: 'Seeder' },
      { trait_type: 'Chain', value: 'Robinhood' },
      { trait_type: 'Mark', value: String(id) },
    ],
  }
  writeFileSync(join(dir, `${id}.json`), `${JSON.stringify(meta, null, 2)}\n`)
}

console.log(`seeder metadata ${max} files`)
