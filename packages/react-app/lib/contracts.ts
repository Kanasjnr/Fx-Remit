import FXRemitABI from '../ABI/FXRemit.json';

export const CONTRACT_ADDRESSES = {
  // Celo Alfajores Testnet (Primary)
  44787: '0x7AaeC8C0165CD1C819Ebded44CF3bDe2507C8b83', // FXRemit contract address
  // Celo Mainnet
  42220: '0x' + '0'.repeat(40), // Replace with actual deployed address when deployed to mainnet
} as const;

export const FXREMIT_CONTRACT = {
  abi: FXRemitABI,
  address: CONTRACT_ADDRESSES,
} as const;

export const SUPPORTED_CHAIN_IDS = [42220, 44787] as const;

export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

export function getContractAddress(chainId: number): string {
  if (chainId in CONTRACT_ADDRESSES) {
    return CONTRACT_ADDRESSES[chainId as SupportedChainId];
  }
  throw new Error(`Contract not deployed on chain ${chainId}`);
}

// Mento token addresses for different networks
export const MENTO_TOKENS = {
  42220: { // Celo Mainnet - TODO: Add mainnet addresses when needed
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    cGBP: '0x47f2Fb88105155a18c390641C8a73f1402B2BB12', // TODO: Update with mainnet address
    cCAD: '0x02EC9E0D2Fd73e89168C1709e542a48f58d7B133', // TODO: Update with mainnet address
    cAUD: '0x84CBD49F5aE07632B6B88094E81Cce8236125Fe0', // TODO: Update with mainnet address
    cCHF: '0xADC57C2C34aD021Df4421230a6532F4e2E1dCE4F', // TODO: Update with mainnet address
    cJPY: '0x2E51F41238cA36a421C9B8b3e189e8Cc7653FE67', // TODO: Update with mainnet address
    cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
    cCOP: '0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4', // TODO: Update with mainnet address
    cKES: '0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92',
    cNGN: '0x4a5b03B8b16122D330306c65e4CA4BC5Dd6511d0',
    cZAR: '0x1e5b44015Ff90610b54000DAad31C89b3284df4d', // TODO: Update with mainnet address
    cGHS: '0x295B66bE7714458Af45E6A6Ea142A5358A6cA375',
    eXOF: '0xB0FA15e002516d0301884059c0aaC0F0C72b019D', // TODO: Update with mainnet address
    PUSO: '0x5E0E3c9419C42a1B04e2525991FB1A2C467AB8bF', // TODO: Update with mainnet address
  },
  44787: { // Celo Alfajores Testnet - All 15 tokens
    cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // US Dollar
    cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F', // Euro
    cGBP: '0x47f2Fb88105155a18c390641C8a73f1402B2BB12', // British Pound
    cCAD: '0x02EC9E0D2Fd73e89168C1709e542a48f58d7B133', // Canadian Dollar
    cAUD: '0x84CBD49F5aE07632B6B88094E81Cce8236125Fe0', // Australian Dollar
    cCHF: '0xADC57C2C34aD021Df4421230a6532F4e2E1dCE4F', // Swiss Franc
    cJPY: '0x2E51F41238cA36a421C9B8b3e189e8Cc7653FE67', // Japanese Yen
    cREAL: '0xE4D517785D091D3c54818832dB6094bcc2744545', // Brazilian Real
    cCOP: '0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4', // Colombian Peso
    cKES: '0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92', // Kenyan Shilling
    cNGN: '0x4a5b03B8b16122D330306c65e4CA4BC5Dd6511d0', // Nigerian Naira
    cZAR: '0x1e5b44015Ff90610b54000DAad31C89b3284df4d', // South African Rand
    cGHS: '0x295B66bE7714458Af45E6A6Ea142A5358A6cA375', // Ghanaian Cedi
    eXOF: '0xB0FA15e002516d0301884059c0aaC0F0C72b019D', // CFA Franc
    PUSO: '0x5E0E3c9419C42a1B04e2525991FB1A2C467AB8bF', // Philippine Peso
  },
} as const;

export type Currency = keyof typeof MENTO_TOKENS[SupportedChainId];

export function getTokenAddress(chainId: SupportedChainId, currency: Currency): string {
  return MENTO_TOKENS[chainId][currency];
}

export const CURRENCY_INFO = {
  cUSD: { name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  cEUR: { name: 'Euro', flag: '🇪🇺', symbol: '€' },
  cGBP: { name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  cCAD: { name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  cAUD: { name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  cCHF: { name: 'Swiss Franc', flag: '🇨🇭', symbol: 'CHF' },
  cJPY: { name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  cREAL: { name: 'Brazilian Real', flag: '🇧🇷', symbol: 'R$' },
  cCOP: { name: 'Colombian Peso', flag: '🇨🇴', symbol: 'COP$' },
  cKES: { name: 'Kenyan Shilling', flag: '🇰🇪', symbol: 'KSh' },
  cNGN: { name: 'Nigerian Naira', flag: '🇳🇬', symbol: '₦' },
  cZAR: { name: 'South African Rand', flag: '🇿🇦', symbol: 'R' },
  cGHS: { name: 'Ghanaian Cedi', flag: '🇬🇭', symbol: '₵' },
  eXOF: { name: 'CFA Franc', flag: '🌍', symbol: 'XOF' },
  PUSO: { name: 'Philippine Peso', flag: '🇵🇭', symbol: '₱' },
} as const;