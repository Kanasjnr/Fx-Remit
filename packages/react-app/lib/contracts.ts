import FXRemitABI from '../ABI/FXRemit.json';

export const CONTRACT_ADDRESSES = {
  // Celo Alfajores Testnet (Primary)
  44787: process.env.NEXT_PUBLIC_FXREMIT_CONTRACT_ALFAJORES,
  // Celo Mainnet
  42220: process.env.NEXT_PUBLIC_FXREMIT_CONTRACT_MAINNET || '',
} as const;

export const FXREMIT_CONTRACT = {
  abi: FXRemitABI,
  address: CONTRACT_ADDRESSES,
} as const;


export const SUPPORTED_CHAIN_IDS = [42220, 44787] as const;

export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

export function getContractAddress(chainId: number): string | null {
  if (chainId in CONTRACT_ADDRESSES) {
    const address = CONTRACT_ADDRESSES[chainId as SupportedChainId];
    if (!address) {
      console.warn(`Contract address not configured for chain ${chainId}`);
      return null;
    }
    return address;
  }
  console.warn(`Contract not deployed on chain ${chainId}`);
  return null;
}

export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

export function isContractConfigured(chainId: number): boolean {
  const address = getContractAddress(chainId);
  return address !== null;
}

// Mento token addresses for different networks
export const MENTO_TOKENS = {
  42220: { // Celo Mainnet
    cUSD: process.env.NEXT_PUBLIC_CUSD_MAINNET,
    cEUR: process.env.NEXT_PUBLIC_CEUR_MAINNET,
    cGBP: process.env.NEXT_PUBLIC_CGBP_MAINNET,
    cCAD: process.env.NEXT_PUBLIC_CCAD_MAINNET,
    cAUD: process.env.NEXT_PUBLIC_CAUD_MAINNET,
    cCHF: process.env.NEXT_PUBLIC_CCHF_MAINNET,
    cJPY: process.env.NEXT_PUBLIC_CJPY_MAINNET,
    cREAL: process.env.NEXT_PUBLIC_CREAL_MAINNET,
    cCOP: process.env.NEXT_PUBLIC_CCOP_MAINNET,
    cKES: process.env.NEXT_PUBLIC_CKES_MAINNET,
    cNGN: process.env.NEXT_PUBLIC_CNGN_MAINNET,
    cZAR: process.env.NEXT_PUBLIC_CZAR_MAINNET,
    cGHS: process.env.NEXT_PUBLIC_CGHS_MAINNET,
    eXOF: process.env.NEXT_PUBLIC_EXOF_MAINNET,
    PUSO: process.env.NEXT_PUBLIC_PUSO_MAINNET,
  },
  44787: { // Celo Alfajores Testnet
    cUSD: process.env.NEXT_PUBLIC_CUSD_ALFAJORES,
    cEUR: process.env.NEXT_PUBLIC_CEUR_ALFAJORES,
    cGBP: process.env.NEXT_PUBLIC_CGBP_ALFAJORES,
    cCAD: process.env.NEXT_PUBLIC_CCAD_ALFAJORES,
    cAUD: process.env.NEXT_PUBLIC_CAUD_ALFAJORES,
    cCHF: process.env.NEXT_PUBLIC_CCHF_ALFAJORES,
    cJPY: process.env.NEXT_PUBLIC_CJPY_ALFAJORES,
    cREAL: process.env.NEXT_PUBLIC_CREAL_ALFAJORES,
    cCOP: process.env.NEXT_PUBLIC_CCOP_ALFAJORES,
    cKES: process.env.NEXT_PUBLIC_CKES_ALFAJORES,
    cNGN: process.env.NEXT_PUBLIC_CNGN_ALFAJORES,
    cZAR: process.env.NEXT_PUBLIC_CZAR_ALFAJORES,
    cGHS: process.env.NEXT_PUBLIC_CGHS_ALFAJORES,
    eXOF: process.env.NEXT_PUBLIC_EXOF_ALFAJORES,
    PUSO: process.env.NEXT_PUBLIC_PUSO_ALFAJORES,
  },
} as const;

export type Currency = keyof typeof MENTO_TOKENS[SupportedChainId];

export function getTokenAddress(chainId: SupportedChainId, currency: Currency): string {
  const address = MENTO_TOKENS[chainId][currency];
  console.log(`Getting token address for ${currency} on chain ${chainId}:`, address);
  if (!address) {
    console.error(`Token address not configured for ${currency} on chain ${chainId}`);
    console.error('Available tokens:', Object.keys(MENTO_TOKENS[chainId]));
    throw new Error(`Token address not configured for ${currency} on chain ${chainId}`);
  }
  return address;
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