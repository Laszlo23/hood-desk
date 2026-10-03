import { parseAbi, type Address } from 'viem'

export const CHECKIN_CONTRACT_ABI = parseAbi([
  'event CheckIn(address indexed wallet, uint256 indexed day, uint256 timestamp)',
  'function checkIn() external',
  'function getCurrentDay() external view returns (uint256)',
  'function canCheckIn(address wallet) external view returns (bool)',
  'function getLastCheckInDay(address wallet) external view returns (uint256)',
  'function lastCheckInDay(address) external view returns (uint256)',
  'error AlreadyCheckedInToday()',
])

export function getCheckInContractAddress(): Address | null {
  const addr = String(import.meta.env.VITE_CHECKIN_CONTRACT || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
  
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return null
  }
  
  return addr as Address
}

export const CHECKIN_CONTRACT_ADDRESS = getCheckInContractAddress()
