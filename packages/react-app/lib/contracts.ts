import FXRemitABI from '../ABI/FXRemit.json';
import FXRemitV2ABI from '../ABI/FXRemitV2.json';

export const CONTRACT_ADDRESSES = {
  42220: process.env.NEXT_PUBLIC_FXREMIT_CONTRACT || '0x1245211aBAe5013e7f5523013b78F50AB44C2c57',
} as const;

export const CONTRACT_V2_ADDRESSES = {
  42220: process.env.NEXT_PUBLIC_FXREMIT_V2_CONTRACT || '0xD8726F627b5A14c17Cb848EE3c564283CBA8e057',
} as const;

export const FXREMIT_CONTRACT = {
  abi: FXRemitABI,
  address: CONTRACT_ADDRESSES,
} as const;

export const FXREMIT_V2_CONTRACT = {
  abi: FXRemitV2ABI,
  address: CONTRACT_V2_ADDRESSES,
} as const;


export const SUPPORTED_CHAIN_IDS = [42220] as const;

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

export function getContractV2Address(chainId: number): string | null {
  if (chainId in CONTRACT_V2_ADDRESSES) {
    const address = CONTRACT_V2_ADDRESSES[chainId as SupportedChainId];
    if (!address) {
      console.warn(`V2 Contract address not configured for chain ${chainId}`);
      return null;
    }
    return address;
  }
  console.warn(`V2 Contract not deployed on chain ${chainId}`);
  return null;
}

export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

export function isContractConfigured(chainId: number): boolean {
  const address = getContractAddress(chainId);
  return address !== null;
}

export const MENTO_TOKENS = {
  42220: { // Celo Mainnet
    // Mento Stablecoins
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
    // Standard Stablecoins
    USDT: process.env.NEXT_PUBLIC_USDT_MAINNET,
    USDC: process.env.NEXT_PUBLIC_USDC_MAINNET,
    // Native Token
    CELO: process.env.NEXT_PUBLIC_CELO_MAINNET,
  },
} as const;

export type Currency = keyof typeof MENTO_TOKENS[SupportedChainId];

export function getTokenAddress(chainId: SupportedChainId, currency: Currency): string {
  const address = MENTO_TOKENS[chainId][currency];
  if (!address) {
    console.error(`Token address not configured for ${currency} on chain ${chainId}`);
    console.error('Available tokens:', Object.keys(MENTO_TOKENS[chainId]));
    throw new Error(`Token address not configured for ${currency} on chain ${chainId}`);
  }
  return address;
}

export const CURRENCY_INFO = {
  // Mento Stablecoins
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
  // Standard Stablecoins
  USDT: { name: 'Tether USD', flag: '💵', symbol: 'USD₮' },
  USDC: { name: 'USD Coin', flag: '💵', symbol: 'USDC' },
  // Native Token
  CELO: { name: 'Celo', flag: '🟢', symbol: 'CELO' },
} as const;